/**
 * lib/image-utils.js
 *
 * Lightweight image dimension detection — zero external dependencies.
 * Parses JPEG SOF / PNG IHDR / WebP VP8 headers to extract width × height,
 * then maps to the nearest Gemini-supported aspect ratio.
 */

const SUPPORTED_RATIOS = [
  { label: '1:1',  value: 1 },
  { label: '3:4',  value: 3 / 4 },
  { label: '4:3',  value: 4 / 3 },
  { label: '9:16', value: 9 / 16 },
  { label: '16:9', value: 16 / 9 },
]

/**
 * Reads width × height from raw image bytes (JPEG, PNG, or WebP).
 * @param {Buffer} buffer
 * @returns {{ width: number, height: number } | null}
 */
export function getImageDimensions(buffer) {
  if (!buffer || buffer.length < 24) return null

  // JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    let offset = 2
    while (offset < buffer.length - 9) {
      if (buffer[offset] !== 0xFF) { offset++; continue }
      const marker = buffer[offset + 1]
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

  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
  }

  // WebP
  if (buffer.length >= 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    const subtype = buffer.toString('ascii', 12, 16)
    if (subtype === 'VP8 ' && buffer.length >= 30) {
      return { width: buffer.readUInt16LE(26) & 0x3FFF, height: buffer.readUInt16LE(28) & 0x3FFF }
    }
    if (subtype === 'VP8L' && buffer.length >= 25) {
      const bits = buffer.readUInt32LE(21)
      return { width: (bits & 0x3FFF) + 1, height: ((bits >> 14) & 0x3FFF) + 1 }
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

/**
 * Maps width × height to nearest Gemini-supported aspect ratio.
 * @param {number} width
 * @param {number} height
 * @returns {string}
 */
export function nearestGeminiAspectRatio(width, height) {
  const ratio = width / height
  let best = SUPPORTED_RATIOS[0]
  let bestDiff = Math.abs(ratio - best.value)
  for (const c of SUPPORTED_RATIOS) {
    const diff = Math.abs(ratio - c.value)
    if (diff < bestDiff) { bestDiff = diff; best = c }
  }
  return best.label
}

/**
 * Detects nearest Gemini-supported aspect ratio from base64 image.
 * @param {string} base64  Raw base64 (NO data URI prefix)
 * @returns {string} e.g. '4:3', '16:9', '9:16', '3:4', '1:1'
 */
export function detectAspectRatioFromBase64(base64) {
  try {
    const headerSlice = base64.substring(0, 87_380) // ~64KB
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
  return '4:3' // safe default for real estate (landscape)
}
