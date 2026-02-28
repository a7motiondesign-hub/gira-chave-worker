/**
 * worker/worker-loop.js
 *
 * Core processing loop. Polls the Supabase queue every 30s via the
 * claim_pending_jobs RPC (FOR UPDATE SKIP LOCKED — no race conditions).
 *
 * Concurrency:
 *   - foto-revista    (Replicate): sequential, 700ms between jobs (rate limit ≤2/s)
 *   - virtual-staging (Gemini):    p-limit(2) — max 2 parallel requests
 *   - limpar-baguncca (Gemini):    same pool as virtual-staging
 */

import pLimit from 'p-limit'
import { supabase } from './lib/supabase.js'
import { buildGeminiPrompt, generateWithGemini, generateWithReplicate } from './services/ai.js'
import { saveOutputAndComplete, markJobFailed, requeueWithBackoff } from './services/storage.js'
import { notifyJobComplete, notifyJobFailed } from './services/notifications.js'
import { logAiUsage } from './services/usage-logger.js'

const POLL_INTERVAL_MS = 30_000   // 30 seconds
const BATCH_SIZE       = 15       // jobs per cycle (matches plan document)
const REPLICATE_DELAY  = 700      // ms between Replicate calls (rate limit: ≤2 req/s)
const MAX_RETRY        = 3

const geminiLimit = pLimit(2)     // max 2 Gemini requests in flight at once

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function isTransientError(msg = '') {
  const m = msg.toLowerCase()
  return (
    m.includes('timeout') ||
    m.includes('network') ||
    m.includes('econnreset') ||
    m.includes('socket') ||
    m.includes('rate limit') ||
    m.includes('too many requests') ||
    m.includes('503') ||
    m.includes('502')
  )
}

// ── Job processors ────────────────────────────────────────────────────────────

async function processGeminiJob(job) {
  console.log(`[worker] Gemini job ${job.id} | service=${job.service} | retry=${job.retry_count}`)

  const imageRes = await fetch(job.input_image_url)
  if (!imageRes.ok) throw new Error(`Falha ao baixar imagem: HTTP ${imageRes.status}`)
  const imageBase64 = Buffer.from(await imageRes.arrayBuffer()).toString('base64')

  const prompt = buildGeminiPrompt(job)

  const vsStart = Date.now()
  const result = await generateWithGemini({ imageBase64, prompt })
  const vsDurationMs = Date.now() - vsStart

  // Log AI usage (fire-and-forget)
  // Usa result.modelId — o modelo REAL após override do model guard — não o env var
  logAiUsage({
    userId: job.user_id,
    sessionId: job.id,
    model: result.modelId || 'gemini-3.1-flash-image-preview',
    feature: job.service === 'limpar-baguncca' ? 'limpar_baguncca' : 'virtual_staging',
    usageMetadata: result.usageMetadata,
    durationMs: vsDurationMs,
    metadata: {
      jobId: job.id,
      service: job.service,
      roomType: job.room_type,
      style: job.style,
      success: result.success,
    },
  }).catch(() => {})

  if (!result.success) {
    throw new Error(result.error || 'Gemini não retornou imagem')
  }

  const outputUrl = `data:${result.mimeType};base64,${result.imageBase64}`
  await saveOutputAndComplete(job.id, job.user_id, outputUrl)

  await notifyJobComplete({
    userId: job.user_id,
    service: job.service,
    jobId: job.id,
    roomType: job.room_type,
    style: job.style,
    creditsUsed: job.credits_used,
  }).catch(() => {})

  console.log(`[worker] ✅ Gemini job ${job.id} concluído (${vsDurationMs}ms)`)
}

async function processReplicateJob(job) {
  console.log(`[worker] Replicate job ${job.id} | retry=${job.retry_count}`)

  const imageRes = await fetch(job.input_image_url)
  if (!imageRes.ok) throw new Error(`Falha ao baixar imagem: HTTP ${imageRes.status}`)
  const imageBase64 = Buffer.from(await imageRes.arrayBuffer()).toString('base64')

  const result = await generateWithReplicate({ imageBase64 })

  if (!result.success) {
    const err = new Error(result.error || 'Replicate falhou')
    err.is429 = result.is429 ?? false
    throw err
  }

  await saveOutputAndComplete(job.id, job.user_id, result.outputUrl)

  await notifyJobComplete({
    userId: job.user_id,
    service: job.service,
    jobId: job.id,
    creditsUsed: job.credits_used,
  }).catch(() => {})

  console.log(`[worker] ✅ Replicate job ${job.id} concluído`)
}

// ── Error handler ─────────────────────────────────────────────────────────────

async function handleJobError(job, err) {
  console.error(`[worker] ❌ Job ${job.id} falhou (tentativa ${job.retry_count + 1}):`, err.message)

  const nextRetry = job.retry_count + 1
  const isDefinitive = nextRetry >= MAX_RETRY || (!err.is429 && !isTransientError(err.message))

  if (isDefinitive) {
    await markJobFailed(job.id, `[Falha definitiva após ${MAX_RETRY} tentativas] ${err.message}`)
    await notifyJobFailed({
      userId: job.user_id,
      service: job.service,
      jobId: job.id,
      errorMessage: err.message,
    }).catch(() => {})
  } else {
    await requeueWithBackoff(job.id, job.retry_count, err.message)
  }
}

// ── Main cycle ────────────────────────────────────────────────────────────────

async function processQueue() {
  const { data: jobs, error } = await supabase.rpc('claim_pending_jobs', { batch_size: BATCH_SIZE })

  if (error) {
    console.error('[worker] Erro ao buscar jobs:', error.message)
    return
  }

  if (!jobs || jobs.length === 0) return

  const geminiJobs   = jobs.filter(j => j.service === 'virtual-staging' || j.service === 'limpar-baguncca')
  const replicateJobs = jobs.filter(j => j.service === 'foto-revista')

  console.log(`[worker] Ciclo: ${geminiJobs.length} Gemini + ${replicateJobs.length} Replicate`)

  // Gemini: up to 2 concurrent via p-limit
  const geminiPromise = Promise.allSettled(
    geminiJobs.map(job =>
      geminiLimit(() => processGeminiJob(job).catch(err => handleJobError(job, err)))
    )
  )

  // Replicate: strictly sequential with 700ms gap
  const replicatePromise = (async () => {
    for (let i = 0; i < replicateJobs.length; i++) {
      const job = replicateJobs[i]
      try {
        await processReplicateJob(job)
      } catch (err) {
        await handleJobError(job, err)
      }
      if (i < replicateJobs.length - 1) await sleep(REPLICATE_DELAY)
    }
  })()

  await Promise.allSettled([geminiPromise, replicatePromise])
  console.log(`[worker] Ciclo concluído: ${jobs.length} jobs processados`)
}

// ── Public API ────────────────────────────────────────────────────────────────

export function startWorkerLoop() {
  console.log(`[worker] Loop iniciado — polling a cada ${POLL_INTERVAL_MS / 1000}s`)
  // Run immediately on start, then at each interval
  processQueue().catch(err => console.error('[worker] Erro no primeiro ciclo:', err.message))
  setInterval(() => {
    processQueue().catch(err => console.error('[worker] Erro no ciclo periódico:', err.message))
  }, POLL_INTERVAL_MS)
}
