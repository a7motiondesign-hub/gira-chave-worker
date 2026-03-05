/**
 * worker/services/ai.js
 *
 * Wrappers for Gemini (virtual-staging, limpar-baguncca) and
 * Replicate (foto-revista) calls.
 *
 * Uses the NEW @google/genai SDK (same as lib/google-ai-image-client.js)
 * which supports responseModalities: ['IMAGE'] and imageConfig.
 */

import { GoogleGenAI } from '@google/genai'
import Replicate from 'replicate'
import { PROMPT_LIBRARY } from '../lib/prompts.js'
import {
  CLEAN_UP_LEVEL_1,
  buildCleanUpLevel2,
  buildCleanUpLevel3,
  STRUCTURAL_LOCK_DIRECTIVE,
  buildStructuralLock,
  STAGING_UNIVERSAL_RULES,
  STAGING_EXCLUSIONS,
  FOTO_TURBINADA_LEVELS,
  buildStagingWallPaintOverride,
  buildStagingFloorOverride,
} from '../lib/prompt-constants.js'
import { editSurfaces } from '../lib/google-ai-image-client.js'
export { editSurfaces }
import { detectAspectRatioFromBase64 } from '../lib/image-utils.js'

// ── Gemini client (singleton) ─────────────────────────────────────────────────

let _client = null

function getGeminiClient() {
  if (!_client) {
    const apiKey = process.env.GOOGLE_VS_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) throw new Error('[ai] GOOGLE_VS_API_KEY não configurada')
    _client = new GoogleGenAI({ apiKey })
  }
  return _client
}

// ── Prompt builder ────────────────────────────────────────────────────────────

/**
 * Builds the final Gemini prompt for a given job.
 * Mirrors the logic inside processGeminiJob() in process-queue/route.js.
 *
 * @param {{ service: string, room_type: string, style: string }} job
 * @returns {string}
 */
export function buildGeminiPrompt(job) {
  // Reference-photo mode: build from the reference image instead of a style preset
  if (job.service === 'virtual-staging' && job.options?.referenceImageUrl) {
    return buildReferencePrompt(job.room_type, job.options || {})
  }

  if (job.service === 'limpar-baguncca') {
    const opts = job.options || {}
    const level = opts.level || 1

    if (level === 3) {
      return buildCleanUpLevel3(opts.wallColor || 'Branco Neve', opts.floorType || 'Porcelanato Claro')
    }
    if (level === 2) {
      return buildCleanUpLevel2(opts.wallColor || 'Branco Neve')
    }
    // Level 1 (default)
    return CLEAN_UP_LEVEL_1
  }

  const availableRooms = Object.keys(PROMPT_LIBRARY)
  const availableStyles = PROMPT_LIBRARY[job.room_type] ? Object.keys(PROMPT_LIBRARY[job.room_type]) : []
  const roomHit = !!PROMPT_LIBRARY[job.room_type]
  const styleHit = !!(PROMPT_LIBRARY[job.room_type]?.[job.style])

  console.log(`[ai:debug] PROMPT LOOKUP:
    job.room_type = ${JSON.stringify(job.room_type)}  → encontrado=${roomHit}
    job.style     = ${JSON.stringify(job.style)}  → encontrado=${styleHit}
    salas disponíveis  = [${availableRooms.join(', ')}]
    estilos disponíveis (${job.room_type}) = [${availableStyles.join(', ')}]
    → usando fallback = ${!styleHit}`)

  const rawPrompt =
    PROMPT_LIBRARY[job.room_type]?.[job.style] ||
    PROMPT_LIBRARY.living_room.moderno_brasileiro

  // All styles now go through the unified adaptPrompt with structural lock + modular options
  const opts = job.options || {}
  return adaptPrompt(rawPrompt, job.room_type, opts)
}

/**
 * Builds a prompt for reference-photo virtual staging.
 * The worker will send IMAGE 1 (property) and IMAGE 2 (reference) to Gemini.
 *
 * @param {string} roomType
 * @param {Object} opts
 * @returns {string}
 */
function buildReferencePrompt(roomType, opts = {}) {
  const detectedRoom = roomType || 'interior space'
  const structuralLock = buildStructuralLock({
    preserveWalls: !opts.wallPaint,
    preserveFloors: !opts.floorChange,
  })
  const curtainRule = opts.curtains !== false
    ? 'CURTAINS — REQUIRED: replicate the curtain style, material and color from IMAGE 2.'
    : 'WINDOW TREATMENT EXCLUSION: Do NOT add any curtains or window treatments.'

  return `<system_directive>
${structuralLock}
</system_directive>
<task>
You will receive TWO images:
- IMAGE 1 (first image): The property photograph to be virtually staged — an empty or minimally furnished ${detectedRoom}.
- IMAGE 2 (second image): A style reference photograph showing the desired interior design aesthetic.

Your task: Stage IMAGE 1 by faithfully replicating the style, atmosphere, furniture types, materials, color palette, curtains, rugs, lighting, and decorative approach visible in IMAGE 2 — applied naturally to the architecture and layout of IMAGE 1.
OUTPUT: Hyperrealistic staged interior photo, same resolution and framing as IMAGE 1.
</task>
<reference_extraction>
From IMAGE 2, extract and apply to IMAGE 1:
- Furniture style, shapes, proportions, and materials
- Overall color palette (wall color if not explicitly locked, upholstery, wood tones, metals)
- Curtain style, material, and color
- Rug type, pattern, and placement
- Lighting fixtures design and placement
- Wall decor (art, mirrors, shelves) style and density
- Plant types and placement
- Overall atmosphere and mood
Apply all of the above to IMAGE 1, strictly respecting its architectural layout.
</reference_extraction>
<staging_rules>
${STAGING_UNIVERSAL_RULES}
SURFACE PRESERVATION: ALL existing wall surfaces, floor materials, and ceiling finishes of IMAGE 1 MUST remain unchanged unless surface override options specify otherwise.
${curtainRule}
</staging_rules>
<critical_rules>
- THE CAMERA DOES NOT MOVE: IMAGE 1 viewpoint, angle, and framing are IMMUTABLE.
- All furniture must be placed PARALLEL or PERPENDICULAR to the walls of IMAGE 1, NEVER diagonally.
- Respect the actual dimensions of IMAGE 1’s space — do not invent space that is not present.
- HYPERREALISTIC rendering, indistinguishable from a real DSLR photograph.
</critical_rules>
<verification>
• IMAGE 1 architecture (doors, windows, walls, floor, ceiling) is PIXEL-PERFECT preserved.
• The style, colors, and atmosphere closely match IMAGE 2.
• Perspective geometry of IMAGE 1 is completely unchanged.
• Result is HYPERREALISTIC, not CGI-looking.
</verification>`
}

/**
 * Adapts a prompt for Gemini image output using XML semantic tags.
 *
 * Surface changes (wall paint, floor) are handled separately via editSurfaces()
 * in a two-pass pipeline, so this function ALWAYS protects walls/floors.
 *
 * @param {string} existingPrompt
 * @param {string} roomType
 * @param {Object} options
 * @returns {string}
 */
function adaptPrompt(existingPrompt, roomType = '', options = {}) {
  const detectedRoom =
    roomType ||
    existingPrompt.match(/\b(kitchen|bedroom|bathroom|living room|dining room|office)\b/i)?.[1] ||
    'interior space'

  // ── Build modular exclusions based on user toggles ──────────────────────
  const exclusionItems = []
  for (const [key, instruction] of Object.entries(STAGING_EXCLUSIONS)) {
    if (options[key] === false) {
      exclusionItems.push(instruction)
    }
  }

  // ── Wall decor rule ─────────────────────────────────────────────────────
  const wallDecorEnabled = options.wallDecor !== false
  const wallDecorRule = wallDecorEnabled
    ? `WALL DECORATION: On any visible wall with empty space suitable for decor, add wall art appropriate to the style (framed prints, paintings, or mirrors) and/or floating shelves with style-appropriate decorative objects. The choice and quantity of wall decor must feel natural and proportional to the style aesthetic — minimal for minimalist/japandi styles, bold for luxo/art_deco styles, eclectic for boho/colorido styles, simple and affordable for popular styles.`
    : ''

  // ── Curtain rule ────────────────────────────────────────────────────────
  const curtainsEnabled = options.curtains !== false
  const curtainRule = curtainsEnabled
    ? `CURTAINS — REQUIRED: If ANY window is visible in the image, you MUST add window treatments (curtains, drapes, or sheers) appropriate to the staging style. This is mandatory — do not leave windows bare. The window frame and glass must remain unaltered; only add the fabric treatment. Choose the curtain style, material, and color that naturally fits the room's aesthetic.`
    : ''

  // ── Surface change logic ────────────────────────────────────────────────
  // When wallPaint / floorChange are set:
  //   1. Build a structural lock WITHOUT wall/floor protection — so Gemini
  //      won't block changes via PRIORITY ZERO.
  //   2. Inject override rules via buildStagingWallPaintOverride / buildStagingFloorOverride.
  // This acts as both FALLBACK (if editSurfaces/Vertex AI fails) and REINFORCEMENT
  // (ensures Gemini keeps the already-modified surfaces from Pass 1).
  const hasSurfaceChange = !!(options.wallPaint || options.floorChange)

  const structuralLock = hasSurfaceChange
    ? buildStructuralLock({
        preserveWalls:  !options.wallPaint,
        preserveFloors: !options.floorChange,
      })
    : STRUCTURAL_LOCK_DIRECTIVE

  const surfaceRules = hasSurfaceChange
    ? [
        options.wallPaint  ? buildStagingWallPaintOverride(options.wallPaint, options.wallTexture || null) : null,
        options.floorChange ? buildStagingFloorOverride(options.floorChange)   : null,
      ].filter(Boolean).join('\n\n')
    : `SURFACE PRESERVATION — ABSOLUTE RULE:
The STYLE REFERENCE describes the AESTHETIC of furniture and decorative objects ONLY.
ALL existing wall surfaces, paint colors, wall textures, wall tiles, floor materials, ceiling finishes, and architectural features (doorways, arches, corridors) in the original photograph MUST remain PIXEL-PERFECT and UNCHANGED.
Use the style reference ONLY to select appropriate furniture styles, fabric colors, wood tones, and decorative objects.`

  const criticalSurfaceRule = hasSurfaceChange
    ? `- Apply the specified surface changes (${
        [options.wallPaint && `walls: "${options.wallPaint}"`, options.floorChange && `floor: "${options.floorChange}"`]
          .filter(Boolean).join(', ')
      }); ALL other architectural elements remain PIXEL-PERFECT`
    : `- Preserve ALL architectural elements exactly (walls, floors, ceiling, windows, doors)`

  const surfaceVerificationLines = [
    options.wallPaint  ? `- ALL visible wall surfaces are uniformly repainted with "${options.wallPaint}"` : null,
    options.floorChange ? `- The floor has been replaced with "${options.floorChange}" with realistic texture and perspective` : null,
  ].filter(Boolean).join('\n')

  // ── Assemble prompt using XML semantic tags ─────────────────────────────
  const taskDescription = hasSurfaceChange
    ? `You must complete TWO simultaneous tasks on the provided real estate photo:
TASK 1 — STAGE THE ROOM (PRIMARY): Furnish this empty ${detectedRoom} with furniture, decor, and accessories in the specified style. This is the MOST IMPORTANT task. An output with NO furniture is completely unacceptable.
TASK 2 — MODIFY SURFACES (SECONDARY): Apply the specified wall and/or floor changes described in <staging_rules>. These changes MUST be visible in the output BUT must not prevent or interfere with the staging.
OUTPUT: Hyperrealistic fully-furnished interior photo with all specified surface changes applied. Same resolution and framing as input.`
    : `Edit and return the provided real estate photo with professional virtual staging applied — furnishing an empty or unfurnished ${detectedRoom}.
OUTPUT: Hyperrealistic furnished interior photo, same resolution and framing as input.`

  const furnitureVerificationLine = `- THE ROOM IS FURNISHED: appropriate ${detectedRoom} furniture is present (the room must NOT be empty)`

  const prompt = `<system_directive>
${structuralLock}
</system_directive>

<task>
${taskDescription}
</task>

<staging_style>
${existingPrompt}
</staging_style>

<staging_rules>
${STAGING_UNIVERSAL_RULES}

${surfaceRules}
${curtainRule}
${wallDecorRule}
</staging_rules>

${exclusionItems.length > 0 ? `<exclusions>\n${exclusionItems.join('\n')}\n</exclusions>\n` : ''}
<critical_rules>
${criticalSurfaceRule}
- THE CAMERA DOES NOT MOVE: viewpoint, angle, framing, and proportions are IMMUTABLE
- ALIGNMENT: all furniture PARALLEL or PERPENDICULAR to walls, NEVER diagonal
- Add ONLY furniture, decor, and staging elements consistent with the style reference
- Ensure HYPERREALISTIC rendering indistinguishable from a real photograph
- No text, watermarks, or UI elements
${hasSurfaceChange ? '- FURNITURE IS MANDATORY: do NOT return the image with surface changes only and no furniture' : ''}
</critical_rules>

<verification>
${furnitureVerificationLine}
- Every door and window from the original is still present, same position, size, and color
${surfaceVerificationLines}
- The horizon line is at the EXACT SAME pixel height as the original photograph
- All vanishing points and wall/floor/ceiling angles are GEOMETRICALLY IDENTICAL to the original
- Room proportions and apparent ceiling height are UNCHANGED — no zoom, no scale shift
- The result is HYPERREALISTIC — indistinguishable from a real professional DSLR photograph
</verification>`

  return prompt
}

// ── Gemini image generation ───────────────────────────────────────────────────

/**
 * Calls Gemini to generate a virtual staging or clean-up image.
 * Uses the NEW @google/genai SDK with responseModalities: ['IMAGE'] and imageConfig.
 *
 * @param {{ imageBase64: string, prompt: string }} params
 * @returns {Promise<{ success: boolean, imageBase64?: string, mimeType?: string, usageMetadata?: object, error?: string }>}
 */
export async function generateWithGemini({ imageBase64, prompt, referenceImageBase64 = null }) {
  const client = getGeminiClient()

  // Model override: pro models return NO_IMAGE — force flash
  const SAFE_MODEL = 'gemini-3.1-flash-image-preview'
  const envModel = process.env.VS_MODEL_ID || ''
  const modelId = (!envModel || envModel.toLowerCase().includes('pro'))
    ? (console.log(`[ai] Override: '${envModel || 'empty'}' → ${SAFE_MODEL}`), SAFE_MODEL)
    : envModel

  // Detect aspect ratio from the input image (maps to nearest Gemini-supported value)
  const aspectRatio = detectAspectRatioFromBase64(imageBase64)

  try {
    const requestParts = [
      { text: prompt },
      { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
    ]
    if (referenceImageBase64) {
      // Accept either raw base64 OR a data URI (strip the header)
      const refData = referenceImageBase64.startsWith('data:')
        ? referenceImageBase64.split(',')[1]
        : referenceImageBase64
      requestParts.push({ inlineData: { data: refData, mimeType: 'image/jpeg' } })
      console.log(`[ai] Reference image included (${refData.length} base64 chars)`)
    }

    const response = await client.models.generateContent({
      model: modelId,
      contents: [
        {
          parts: requestParts,
        },
      ],
      config: {
        // IMAGE-only: adding 'TEXT' activates VQA mode where model describes instead of editing
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio,
          imageSize: '2K', // CRITICAL: uppercase — '2k' is silently rejected
        },
      },
    })

    const candidate = response.candidates?.[0]
    const finishReason = candidate?.finishReason
    console.log('[ai] Finish reason:', finishReason)

    if (finishReason === 'SAFETY' || finishReason === 'IMAGE_SAFETY') {
      throw new Error(`Bloqueado por filtro de segurança: ${JSON.stringify(candidate?.safetyRatings)}`)
    }
    if (finishReason === 'NO_IMAGE') {
      throw new Error(`Modelo '${modelId}' não suporta geração de imagem (NO_IMAGE).`)
    }

    // Defensive extraction (camelCase + snake_case — SDK versions vary)
    const parts = candidate?.content?.parts || []
    const imagePart = parts.find(p => p.inlineData?.data || p.inline_data?.data)
    const imageData = imagePart?.inlineData?.data || imagePart?.inline_data?.data || null
    const imageMime = imagePart?.inlineData?.mimeType || imagePart?.inline_data?.mime_type || 'image/png'
    const usageMetadata = response.usageMetadata || null

    if (!imageData) {
      const textFallback = parts.find(p => p.text)?.text || 'Sem resposta'
      throw new Error(`Gemini não retornou imagem. Parts: ${parts.length}. Texto: "${textFallback.substring(0, 300)}"`)
    }

    console.log(`[ai] ✅ Imagem gerada. mimeType: ${imageMime}, aspectRatio: ${aspectRatio}`)
    return {
      success: true,
      imageBase64: imageData,
      mimeType: imageMime,
      usageMetadata,
    }
  } catch (err) {
    console.error('[ai] Gemini error:', err.message)
    return { success: false, error: err.message, usageMetadata: null }
  }
}

// ── Replicate image generation ────────────────────────────────────────────────

/**
 * Calls Replicate to enhance a real estate photo (foto-revista).
 *
 * @param {{ imageBase64: string }} params
 * @returns {Promise<{ success: boolean, outputUrl?: string, error?: string }>}
 */
export async function generateWithReplicate({ imageBase64, level = 2 }) {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

  const dataUri = `data:image/jpeg;base64,${imageBase64}`

  // Select level config (default to level 2 — standard)
  const lvl = FOTO_TURBINADA_LEVELS[level] || FOTO_TURBINADA_LEVELS[2]

  try {
    const output = await replicate.run(process.env.FT_MODEL_ID, {
      input: {
        image: dataUri,
        prompt: lvl.prompt,
        negative_prompt: lvl.negative_prompt,
        dynamic: lvl.dynamic,
        creativity: lvl.creativity,
        resemblance: lvl.resemblance,
        scale: 2,
        sd_model: 'juggernaut_reborn.safetensors [338b85bc4f]',
        scheduler: 'DPM++ 3M SDE Karras',
        num_inference_steps: 18,
        downscaling: false,
      },
    })

    return { success: true, outputUrl: output }
  } catch (err) {
    const is429 =
      err?.status === 429 ||
      String(err?.message).toLowerCase().includes('rate limit') ||
      String(err?.message).toLowerCase().includes('too many requests')

    return { success: false, error: err.message, is429 }
  }
}
