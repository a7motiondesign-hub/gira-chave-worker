/**
 * worker/services/storage.js
 *
 * Saves a processed image (base64 or URL) to Cloudflare R2 and
 * marks the replicate_job as completed in Supabase.
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { supabase } from '../lib/supabase.js'
import sharp from 'sharp'

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const R2_PUBLIC_BASE = 'https://pub-58676ec492ce4763bc29c0609e408719.r2.dev'
const THUMB_WIDTH = 400
const THUMB_QUALITY = 80

/**
 * Uploads the output image to R2 and returns the permanent public URL.
 * Also generates a compressed thumbnail (400px WebP).
 *
 * @param {string} jobId
 * @param {string} userId
 * @param {string} outputImageUrl - Can be a data URI (data:image/...) or an HTTPS URL
 * @returns {Promise<{permanentUrl: string, thumbnailUrl: string|null}>}
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

  const ts = Date.now()
  const key = `processed/${userId}/${jobId}_${ts}.webp`

  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: 'image/webp',
  }))

  const permanentUrl = `${R2_PUBLIC_BASE}/${key}`

  // Generate & upload compressed thumbnail
  let thumbnailUrl = null
  try {
    const thumbBuffer = await sharp(buffer)
      .resize(THUMB_WIDTH, null, { withoutEnlargement: true })
      .webp({ quality: THUMB_QUALITY })
      .toBuffer()

    const thumbKey = `processed/${userId}/thumbs/${jobId}_${ts}.webp`
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: thumbKey,
      Body: thumbBuffer,
      ContentType: 'image/webp',
    }))
    thumbnailUrl = `${R2_PUBLIC_BASE}/${thumbKey}`
  } catch (thumbErr) {
    console.warn(`[storage] Thumbnail falhou para job ${jobId}:`, thumbErr.message)
  }

  return { permanentUrl, thumbnailUrl }
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
  let thumbnailUrl = null

  try {
    const result = await uploadToR2(jobId, userId, outputImageUrl)
    permanentUrl = result.permanentUrl
    thumbnailUrl = result.thumbnailUrl
  } catch (err) {
    console.error(`[storage] R2 upload falhou para job ${jobId}:`, err.message)
    // fallback: keep the original URL (data URIs won't persist across restarts, but better than failing)
  }

  const updateData = {
    status: 'completed',
    output_image_url: permanentUrl,
    completed_at: new Date().toISOString(),
  }
  if (thumbnailUrl) updateData.thumbnail_url = thumbnailUrl

  const { error } = await supabase
    .from('replicate_jobs')
    .update(updateData)
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
