/**
 * worker/services/storage.js
 *
 * Saves a processed image (base64 or URL) to Cloudflare R2 and
 * marks the replicate_job as completed in Supabase.
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { supabase } from '../lib/supabase.js'

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const R2_PUBLIC_BASE = 'https://pub-58676ec492ce4763bc29c0609e408719.r2.dev'

/**
 * Uploads the output image to R2 and returns the permanent public URL.
 *
 * @param {string} jobId
 * @param {string} userId
 * @param {string} outputImageUrl - Can be a data URI (data:image/...) or an HTTPS URL
 * @returns {Promise<string>} permanent R2 URL
 */
export async function uploadToR2(jobId, userId, outputImageUrl) {
  let buffer

  if (String(outputImageUrl).startsWith('data:')) {
    buffer = Buffer.from(String(outputImageUrl).split(',')[1], 'base64')
  } else {
    const res = await fetch(outputImageUrl)
    if (!res.ok) throw new Error(`R2: falha ao baixar imagem origem HTTP ${res.status}`)
    buffer = Buffer.from(await res.arrayBuffer())
  }

  const key = `processed/${userId}/${jobId}_${Date.now()}.webp`

  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: 'image/webp',
  }))

  return `${R2_PUBLIC_BASE}/${key}`
}

/**
 * Saves output, marks job as completed in Supabase.
 *
 * @param {string} jobId
 * @param {string} userId
 * @param {string} outputImageUrl - data URI or public URL
 * @returns {Promise<string>} permanent URL
 */
export async function saveOutputAndComplete(jobId, userId, outputImageUrl) {
  let permanentUrl = outputImageUrl

  try {
    permanentUrl = await uploadToR2(jobId, userId, outputImageUrl)
  } catch (err) {
    console.error(`[storage] R2 upload falhou para job ${jobId}:`, err.message)
    // fallback: keep the original URL (data URIs won't persist across restarts, but better than failing)
  }

  const { error } = await supabase
    .from('replicate_jobs')
    .update({
      status: 'completed',
      output_image_url: permanentUrl,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)

  if (error) {
    console.error(`[storage] Erro ao marcar job ${jobId} como completed:`, error.message)
  }

  return permanentUrl
}

/**
 * Marks a job as permanently failed in Supabase.
 *
 * @param {string} jobId
 * @param {string} errorMessage
 */
export async function markJobFailed(jobId, errorMessage) {
  const { error } = await supabase
    .from('replicate_jobs')
    .update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)

  if (error) {
    console.error(`[storage] Erro ao marcar job ${jobId} como failed:`, error.message)
  }
}

/**
 * Requeues a job with exponential backoff + jitter.
 *
 * @param {string} jobId
 * @param {number} currentRetryCount
 * @param {string} errorMessage
 */
export async function requeueWithBackoff(jobId, currentRetryCount, errorMessage) {
  const BASE_BACKOFF_MS = 5_000
  const backoffMs = BASE_BACKOFF_MS * (3 ** currentRetryCount) + Math.random() * 5_000
  const newRetryCount = currentRetryCount + 1
  const retryAfter = new Date(Date.now() + backoffMs).toISOString()

  const { error } = await supabase
    .from('replicate_jobs')
    .update({
      status: 'pending',
      retry_count: newRetryCount,
      retry_after: retryAfter,
      error_message: `[Tentativa ${newRetryCount}/3] ${errorMessage}`,
    })
    .eq('id', jobId)

  if (error) {
    console.error(`[storage] Erro ao requeue job ${jobId}:`, error.message)
  }
}
