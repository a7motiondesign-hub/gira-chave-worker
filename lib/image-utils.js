/**
 * lib/image-utils.js
 *
 * Lightweight image dimension detection — zero external dependencies.
 * Parses JPEG SOF / PNG IHDR / WebP VP8 headers to extract width × height,
 * then maps to the nearest Gemini-supported aspect ratio.
 *
 * Imported by:
 *   - lib/google-ai-image-client.js  (Next.js routes)
 *   - worker/services/ai.js          (standalone worker on Render)
 */

const SUPPORTED_RATIOS = [
  { label: '1:1',  value: 1 },
  { label: '3:4',  value: 3 / 4 },
  { label: '4:3',  value: 4 / 3 },
  { label: '9:16', value: 9 / 16 },
  { label: '16:9', value: 16 / 9 },
]

// ── Raw dimension readers ─────────────────────────────────────────────────────

/**
 * Reads width × height from raw image bytes (JPEG, PNG, or WebP).
 * Only inspects the first few hundred bytes — safe for any buffer size.
 *
 * @param {Buffer} buffer
 * @returns {{ width: number, height: number } | null}
 */
export function getImageDimensions(buffer) {
  if (!buffer || buffer.length < 24) return null

  // ── JPEG (SOF0..SOF15, excluding DHT/JPG/DAC) ────────────────────────
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    let offset = 2
    while (offset < buffer.length - 9) {
      if (buffer[offset] !== 0xFF) { offset++; continue }
      const marker = buffer[offset + 1]
      // SOF markers: C0–CF except C4 (DHT), C8 (JPG), CC (DAC)
      if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width:  buffer.readUInt16BE(offset + 7),
        }
      }
      const segLen = buffer.readUInt16BE(offset + 2)
      offset += 2 + segLen
    }
    return null
  }

  // ── PNG (IHDR is always the first chunk after 8-byte signature) ───────
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return {
      width:  buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    }
  }

  // ── WebP (RIFF container → VP8 / VP8L / VP8X) ────────────────────────
  if (
    buffer.length >= 30 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    const subtype = buffer.toString('ascii', 12, 16)
    if (subtype === 'VP8 ' && buffer.length >= 30) {
      return {
        width:  buffer.readUInt16LE(26) & 0x3FFF,
        height: buffer.readUInt16LE(28) & 0x3FFF,
      }
    }
    if (subtype === 'VP8L' && buffer.length >= 25) {
      const bits = buffer.readUInt32LE(21)
      return {
        width:  (bits & 0x3FFF) + 1,
        height: ((bits >> 14) & 0x3FFF) + 1,
      }
    }
    if (subtype === 'VP8X' && buffer.length >= 30) {
      return {
        width:  (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16)) + 1,
        height: (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16)) + 1,
      }
    }
  }

  return null
}

// ── Aspect ratio mapping ──────────────────────────────────────────────────────

/**
 * Maps an arbitrary width × height to the nearest Gemini-supported aspect ratio.
 *
 * Supported by Gemini imageConfig: 1:1 | 3:4 | 4:3 | 9:16 | 16:9
 *
 * @param {number} width
 * @param {number} height
 * @returns {string}  e.g. '4:3'
 */
export function nearestGeminiAspectRatio(width, height) {
  const ratio = width / height
  let best = SUPPORTED_RATIOS[0]
  let bestDiff = Math.abs(ratio - best.value)

  for (const candidate of SUPPORTED_RATIOS) {
    const diff = Math.abs(ratio - candidate.value)
    if (diff < bestDiff) {
      bestDiff = diff
      best = candidate
    }
  }

  return best.label
}

// ── Convenience: base64 → aspect ratio ────────────────────────────────────────

/**
 * Detects the nearest Gemini-supported aspect ratio from a base64-encoded image.
 * Only decodes the first ~64 KB (enough for any header format).
 *
 * @param {string} base64  Raw base64 string (NO data URI prefix)
 * @returns {string}       e.g. '4:3', '16:9', '9:16', '3:4', '1:1'
 */
export function detectAspectRatioFromBase64(base64) {
  try {
    // 87 380 base64 chars ≈ 64 KB decoded — more than enough for any image header
    const headerSlice = base64.substring(0, 87_380)
    const buffer = Buffer.from(headerSlice, 'base64')
    const dims = getImageDimensions(buffer)
    if (dims) {
      const ar = nearestGeminiAspectRatio(dims.width, dims.height)
      console.log(`[image-utils] Detected ${dims.width}×${dims.height} → aspect ratio ${ar}`)
      return ar
    }
  } catch (e) {
    console.warn('[image-utils] Failed to detect aspect ratio:', e.message)
  }
  return '4:3' // safe default for real estate photos (landscape)
}
