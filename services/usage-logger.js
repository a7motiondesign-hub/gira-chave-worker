/**
 * worker/services/usage-logger.js
 *
 * Logs AI token usage and cost to the ai_usage_logs Supabase table.
 * Adapted from lib/ai/usage-logger.js and lib/ai/cost-calculator.js,
 * replacing @/ imports with direct relative paths.
 */

import { supabase } from '../lib/supabase.js'

// ── Pricing table (mirrored from lib/ai/cost-calculator.js) ─────────────────
// USD per 1 million tokens. Check https://ai.google.dev/pricing for updates.
const MODEL_PRICING = {
  'gemini-2.0-flash':               { input: 0.10,   output: 0.40,   cached: 0.025   },
  'gemini-2.0-flash-lite':          { input: 0.075,  output: 0.30,   cached: 0.01875 },
  'gemini-1.5-flash':               { input: 0.075,  output: 0.30,   cached: 0.01875 },
  'gemini-1.5-pro':                 { input: 1.25,   output: 5.00,   cached: 0.3125  },
  'gemini-2.5-pro-preview-tts':     { input: 1.00,   output: 20.00,  cached: 0.25    },
  // Image generation models — output tokens are image pixels, priced at premium
  'gemini-3-pro-image-preview':         { input: 2.00,  output: 120.00, cached: 0.50 },
  // TODO: Confirm official pricing for gemini-3.1-pro-preview at https://ai.google.dev/pricing
  'gemini-3.1-pro-preview':             { input: 2.00,  output: 120.00, cached: 0.50 },
  // Flash image model (actually used after model guard) — pricing TBD, using flash-2.0 as proxy
  'gemini-3.1-flash-image-preview':     { input: 0.10,  output: 0.40,  cached: 0.025 },
}

function calculateTokenCost(model, promptTokens, completionTokens, { cachedTokens = 0, thoughtsTokens = 0 } = {}) {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gemini-2.0-flash']
  const cachedPrice = pricing.cached ?? pricing.input * 0.25
  const nonCachedInput = Math.max(0, promptTokens - cachedTokens) + thoughtsTokens

  const cachedCostUsd  = (cachedTokens   / 1_000_000) * cachedPrice
  const inputCostUsd   = (nonCachedInput / 1_000_000) * pricing.input
  const outputCostUsd  = (completionTokens / 1_000_000) * pricing.output
  const totalCostUsd   = cachedCostUsd + inputCostUsd + outputCostUsd

  const r = v => Math.round(v * 100_000_000) / 100_000_000
  return { inputCostUsd: r(inputCostUsd), outputCostUsd: r(outputCostUsd), cachedCostUsd: r(cachedCostUsd), totalCostUsd: r(totalCostUsd) }
}

function extractUsageMetadata(raw) {
  if (!raw) return null
  const u = raw.usageMetadata || raw
  const promptTokens     = u.promptTokenCount       ?? u.prompt_token_count       ?? 0
  const completionTokens = u.candidatesTokenCount   ?? u.candidates_token_count   ?? 0
  const totalTokens      = u.totalTokenCount        ?? u.total_token_count        ?? (promptTokens + completionTokens)
  const cachedTokens     = u.cachedContentTokenCount ?? u.cached_content_token_count ?? 0
  const thoughtsTokens   = u.thoughtsTokenCount      ?? u.thoughts_token_count      ?? 0
  const cacheHit         = cachedTokens > 0
  if (promptTokens === 0 && completionTokens === 0) return null
  return { promptTokens, completionTokens, totalTokens, cachedTokens, thoughtsTokens, cacheHit }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Logs an AI usage event to ai_usage_logs. Fire-and-forget — does not throw.
 *
 * @param {object} params
 * @param {string|null} params.userId
 * @param {string|null} params.sessionId - typically the job id
 * @param {string} params.model
 * @param {string} params.feature - 'virtual_staging' | 'limpar_baguncca' | 'foto_revista' | etc.
 * @param {object|null} [params.usageMetadata] - raw Gemini usageMetadata object
 * @param {number} [params.durationMs]
 * @param {object} [params.metadata] - extra JSON metadata
 */
export async function logAiUsage({
  userId = null,
  sessionId = null,
  model,
  feature,
  usageMetadata = null,
  durationMs = null,
  metadata = {},
}) {
  try {
    let promptTokens = 0, completionTokens = 0, totalTokens = 0
    let cachedTokens = 0, thoughtsTokens = 0, cacheHit = false

    if (usageMetadata) {
      const extracted = extractUsageMetadata(usageMetadata)
      if (extracted) {
        ;({ promptTokens, completionTokens, totalTokens, cachedTokens, thoughtsTokens, cacheHit } = extracted)
      }
    }

    totalTokens = totalTokens || (promptTokens + completionTokens)

    const costs = calculateTokenCost(model, promptTokens, completionTokens, { cachedTokens, thoughtsTokens })

    const { error } = await supabase.from('ai_usage_logs').insert({
      user_id:              userId,
      session_id:           sessionId,
      model,
      feature,
      prompt_tokens:        promptTokens,
      completion_tokens:    completionTokens,
      total_tokens:         totalTokens,
      cached_tokens:        cachedTokens,
      thoughts_tokens:      thoughtsTokens,
      cache_hit:            cacheHit,
      status_code:          'success',
      input_cost_usd:       costs.inputCostUsd,
      output_cost_usd:      costs.outputCostUsd,
      total_cost_usd:       costs.totalCostUsd,
      request_duration_ms:  durationMs,
      metadata,
    })

    if (error) {
      console.error('[usage-logger] Erro ao salvar log:', error.message)
    }
  } catch (err) {
    console.error('[usage-logger] Exceção ao salvar log:', err.message)
  }
}
