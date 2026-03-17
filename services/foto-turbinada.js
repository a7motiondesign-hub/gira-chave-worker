/**
 * worker/services/foto-turbinada.js
 *
 * Full Foto Turbinada pipeline:
 *   Step 0 — Gemini CLEAN_UP_LEVEL_1   (remove logos, clutter, distractions)
 *   Step 1 — Cloudinary Enhance        (improve, sharpen, auto contrast/brightness)
 *   Step 2 — Real-ESRGAN ×2            (upscale + denoise)
 *   Step 3 — Final export              (1920px longest-side, JPEG q88, sRGB, strip metadata)
 *
 * Output: data:image/jpeg;base64,... — passed directly to saveOutputAndComplete()
 * which re-uploads to R2 and marks the job as completed.
 */

import { v2 as cloudinary } from 'cloudinary'
import Replicate from 'replicate'
import sharp from 'sharp'
import { generateWithGemini } from './ai.js'
import { CLEAN_UP_LEVEL_1 } from '../lib/prompt-constants.js'

// ── Clients ───────────────────────────────────────────────────────────────────

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

// ── Constants ─────────────────────────────────────────────────────────────────

const REAL_ESRGAN_MODEL = 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b'

// Real-ESRGAN hardware limit: ~2.1 MP (longest side capped before upscale)
const ESRGAN_MAX_SIDE = 1400

// Full HD target — longest side is always 1920px, aspect ratio preserved
const TARGET_LONG_SIDE = 1920

// JPEG quality — within the 85-90% spec (Lightroom equivalent ~10-11)
const JPEG_QUALITY = 88

// Maximum output file size (hard limit per user spec)
const MAX_FILE_BYTES = 5 * 1024 * 1024

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveReplicateUrl(output) {
  if (!output) throw new Error('Replicate não retornou output')
  const item = Array.isArray(output) ? output[0] : output
  if (item && typeof item.url === 'function') return item.url().toString()
  if (item instanceof URL) return item.href
  if (typeof item === 'string') return item
  const s = String(item)
  if (s.startsWith('http')) return s
  throw new Error(`Formato de output do Replicate não reconhecido: ${typeof item}`)
}

async function fetchBuffer(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Falha ao baixar imagem: HTTP ${res.status} — ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

// ── Step 0: Gemini cleanup ────────────────────────────────────────────────────

async function step0Gemini(imageBase64) {
  console.log('[ft:step0] Gemini CLEAN_UP_LEVEL_1...')

  const MAX_RETRIES = 3
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const result = await generateWithGemini({ imageBase64, prompt: CLEAN_UP_LEVEL_1 })
    if (result.success) {
      console.log(`[ft:step0] ✅ mimeType=${result.mimeType}`)
      return { base64: result.imageBase64, mimeType: result.mimeType }
    }
    const isRetryable = result.error?.includes('NO_IMAGE') || result.error?.includes('retryable')
    if (!isRetryable || attempt === MAX_RETRIES) {
      throw new Error(`Step 0 falhou: ${result.error}`)
    }
    console.warn(`[ft:step0] Tentativa ${attempt} falhou (${result.error}) — aguardando 2s...`)
    await new Promise(r => setTimeout(r, 2000))
  }
}

// ── Step 1: Cloudinary enhance ────────────────────────────────────────────────

async function step1CloudinaryEnhance(imageBase64, mimeType) {
  console.log('[ft:step1] Cloudinary enhance...')

  // Upload to Cloudinary to get a public_id for transformation
  const uploaded = await cloudinary.uploader.upload(
    `data:${mimeType};base64,${imageBase64}`,
    { folder: 'foto-turbinada/step1-input', resource_type: 'image' }
  )

  // Build transformation URL (Cloudinary applies server-side)
  const enhancedUrl = cloudinary.url(uploaded.public_id, {
    transformation: [
      { effect: 'improve' },
      { effect: 'sharpen:80' },
      { effect: 'auto_contrast' },
      { effect: 'auto_brightness' },
      { quality: 'auto:best', fetch_format: 'jpg' },
    ],
    secure: true,
  })

  // Download the transformed result as raw buffer
  const buffer = await fetchBuffer(enhancedUrl)
  console.log(`[ft:step1] ✅ ${(buffer.length / 1024).toFixed(0)} KB`)
  return buffer
}

// ── Step 2: Real-ESRGAN ×2 upscale ───────────────────────────────────────────

async function step2Esrgan(inputBuffer) {
  console.log('[ft:step2] Real-ESRGAN ×2...')

  const meta = await sharp(inputBuffer).metadata()
  const { width, height } = meta

  // Cap before ESRGAN if input exceeds hardware limit (~2.1MP)
  let uploadBuffer = inputBuffer
  if (width > ESRGAN_MAX_SIDE || height > ESRGAN_MAX_SIDE) {
    const scale = Math.min(ESRGAN_MAX_SIDE / width, ESRGAN_MAX_SIDE / height)
    const newW = Math.floor(width  * scale)
    const newH = Math.floor(height * scale)
    uploadBuffer = await sharp(inputBuffer)
      .resize(newW, newH)
      .jpeg({ quality: 90 })
      .toBuffer()
    console.log(`[ft:step2] Pre-resize: ${width}×${height} → ${newW}×${newH}`)
  }

  // Upload to Cloudinary so Replicate can access it via URL
  const uploaded = await cloudinary.uploader.upload(
    `data:image/jpeg;base64,${uploadBuffer.toString('base64')}`,
    { folder: 'foto-turbinada/step2-input', resource_type: 'image' }
  )

  // Run Real-ESRGAN
  const output = await replicate.run(REAL_ESRGAN_MODEL, {
    input: {
      image: uploaded.secure_url,
      scale: 2,
      face_enhance: false,
    },
  })
  const outputUrl = resolveReplicateUrl(output)

  // Download upscaled result
  const result = await fetchBuffer(outputUrl)
  const metaOut = await sharp(result).metadata()
  console.log(`[ft:step2] ✅ ${metaOut.width}×${metaOut.height} | ${(result.length / 1024 / 1024).toFixed(1)}MB`)
  return result
}

// ── Step 3: Final export ──────────────────────────────────────────────────────

async function step3FinalExport(inputBuffer) {
  console.log('[ft:step3] Final export (Full HD, JPEG q88, sRGB)...')

  const meta = await sharp(inputBuffer).metadata()
  const { width, height } = meta

  // Scale so that the longest side = 1920px, aspect ratio preserved
  const longSide    = Math.max(width, height)
  const scaleFactor = TARGET_LONG_SIDE / longSide
  const newWidth    = Math.round(width  * scaleFactor)
  const newHeight   = Math.round(height * scaleFactor)

  const buildExport = (quality) =>
    sharp(inputBuffer)
      .resize(newWidth, newHeight)
      .toColorspace('srgb')
      // withMetadata() is intentionally omitted: strips GPS/personal EXIF data
      .jpeg({ quality, mozjpeg: true })
      .toBuffer()

  let exportBuf = await buildExport(JPEG_QUALITY)

  // Safety: if still > 5MB (unlikely after resize), reduce quality to 80
  if (exportBuf.length > MAX_FILE_BYTES) {
    console.warn(`[ft:step3] ${(exportBuf.length / 1024 / 1024).toFixed(1)}MB > 5MB — reduzindo para q80`)
    exportBuf = await buildExport(80)
  }

  const finalMB = (exportBuf.length / 1024 / 1024).toFixed(2)
  console.log(`[ft:step3] ✅ ${newWidth}×${newHeight} | ${finalMB} MB`)
  return exportBuf
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Runs the full Foto Turbinada pipeline.
 *
 * @param {Buffer} imageBuffer  - Raw input image bytes
 * @param {string} mimeType     - MIME type of the input image (default: image/jpeg)
 * @returns {Promise<string>}   - data:image/jpeg;base64,... ready for saveOutputAndComplete()
 */
export async function runFotoTurbinadaPipeline(imageBuffer, mimeType = 'image/jpeg') {
  const t0 = Date.now()

  // Step 0 — Gemini cleanup
  const { base64: s0base64, mimeType: s0mime } = await step0Gemini(imageBuffer.toString('base64'))

  // Step 1 — Cloudinary enhance
  const step1Buffer = await step1CloudinaryEnhance(s0base64, s0mime)

  // Step 2 — Real-ESRGAN ×2
  const step2Buffer = await step2Esrgan(step1Buffer)

  // Step 3 — Final export
  const finalBuffer = await step3FinalExport(step2Buffer)

  console.log(`[ft] Pipeline completa em ${((Date.now() - t0) / 1000).toFixed(1)}s`)
  return `data:image/jpeg;base64,${finalBuffer.toString('base64')}`
}
