import { GoogleGenAI, MaskReferenceImage, RawReferenceImage } from '@google/genai';
import { STRUCTURAL_LOCK_DIRECTIVE } from './prompt-constants.js';
import { detectAspectRatioFromBase64 } from './image-utils.js';

// ── Google AI Studio client (Gemini — generateContent) ──────────────────────
let _client = null;

export function getGoogleAIClient() {
  if (!_client) {
    const apiKey = process.env.GOOGLE_VS_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error('VS_API_KEY not found in environment');
    _client = new GoogleGenAI({ apiKey });
  }
  return _client;
}

// ── Vertex AI client (Imagen — editImage with MASK_MODE_SEMANTIC) ───────────
// The @google/genai SDK v1.43+ supports Vertex AI natively when initialized
// with vertexai:true + project/location instead of apiKey.
// Auth uses Application Default Credentials (ADC):
//   - Set GOOGLE_APPLICATION_CREDENTIALS env var pointing to a Service Account
//     JSON key file, OR
//   - Pass inline credentials via VERTEX_AI_SA_KEY env var (JSON string).
let _vertexClient = null;

export function getVertexAIClient() {
  if (!_vertexClient) {
    const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

    if (!project) {
      throw new Error(
        '[Vertex AI] GOOGLE_CLOUD_PROJECT not set. ' +
        'Create a GCP project, enable the Vertex AI API, and set this env var.'
      );
    }

    const opts = { vertexai: true, project, location };

    // Support inline service account credentials via env var (useful for
    // serverless / Vercel where you can't write files to disk).
    const saKeyRaw = process.env.VERTEX_AI_SA_KEY;
    if (saKeyRaw) {
      try {
        const credentials = JSON.parse(saKeyRaw);
        opts.googleAuthOptions = { credentials };
        console.log('[Vertex AI] Using inline SA credentials from VERTEX_AI_SA_KEY');
      } catch {
        throw new Error('[Vertex AI] VERTEX_AI_SA_KEY is not valid JSON');
      }
    }
    // Otherwise falls back to GOOGLE_APPLICATION_CREDENTIALS (ADC file path)

    _vertexClient = new GoogleGenAI(opts);
    console.log(`[Vertex AI] Client initialized — project=${project} location=${location}`);
  }
  return _vertexClient;
}

// ── Shared helpers ──────────────────────────────────────────────────────────

function resolveModel() {
  const SAFE_MODEL = 'gemini-3.1-flash-image-preview';
  const envModel = process.env.VS_MODEL_ID || '';
  if (!envModel || envModel.toLowerCase().includes('pro')) {
    console.log(`[VS] Override: '${envModel || 'vazio'}' → ${SAFE_MODEL}`);
    return SAFE_MODEL;
  }
  return envModel;
}

function resolveImagenModel() {
  // editImage requires an Imagen model — use env var or default
  return process.env.IMAGEN_MODEL_ID || 'imagen-3.0-capability-001';
}

/**
 * Extracts the generated image data from a Gemini generateContent response.
 */
function extractImageFromResponse(response) {
  const candidate = response.candidates?.[0];
  const finishReason = candidate?.finishReason;
  console.log('[VS] Finish reason:', finishReason);

  if (finishReason === 'SAFETY' || finishReason === 'IMAGE_SAFETY') {
    throw new Error(`Bloqueado por filtro de segurança. Ratings: ${JSON.stringify(candidate?.safetyRatings)}`);
  }
  if (finishReason === 'NO_IMAGE') {
    throw new Error(`Modelo não suporta geração de imagem (NO_IMAGE).`);
  }
  if (finishReason === 'MALFORMED_FUNCTION_CALL') {
    throw new Error('MALFORMED_FUNCTION_CALL');
  }

  const parts = candidate?.content?.parts || [];
  const imagePart = parts.find(p => p.inlineData?.data || p.inline_data?.data);
  const imageData = imagePart?.inlineData?.data || imagePart?.inline_data?.data || null;
  const imageMime = imagePart?.inlineData?.mimeType || imagePart?.inline_data?.mime_type || 'image/png';
  const usageMetadata = response.usageMetadata || null;

  if (!imageData) {
    const textFallback = parts.find(p => p.text)?.text || 'Sem resposta';
    throw new Error(`Gemini não retornou imagem. Parts: ${parts.length}. Texto: "${textFallback.substring(0, 300)}"`);
  }

  return { imageData, imageMime, usageMetadata };
}

// ── generateVirtualStaging ──────────────────────────────────────────────────

/**
 * Gera Virtual Staging usando Gemini generateContent (image-edit mode).
 *
 * @param {Object} params
 * @param {string} params.imageBase64 - base64 (sem data URI prefix)
 * @param {string} params.prompt - Prompt para o staging
 * @param {string} [params.mimeType='image/jpeg']
 * @param {boolean} [params.rawPrompt=false] - Se true, envia o prompt diretamente sem
 *   envolver com STRUCTURAL_LOCK_DIRECTIVE. Use quando o caller já montou o prompt completo.
 * @returns {Promise<{success: boolean, imageBase64?: string, mimeType?: string, usageMetadata?: object, error?: string}>}
 */
export async function generateVirtualStaging({ imageBase64, prompt, mimeType = 'image/jpeg', rawPrompt = false }) {
  const client = getGoogleAIClient();
  const modelId = resolveModel();
  console.log('[VS] Using model:', modelId);

  const aspectRatio = detectAspectRatioFromBase64(imageBase64);

  // Quando rawPrompt=true, o caller já montou o prompt completo (ex: worker/cron modular)
  // Quando rawPrompt=false (legado), envolvemos com STRUCTURAL_LOCK_DIRECTIVE para backward-compat
  const actionPrompt = rawPrompt
    ? prompt
    : `${STRUCTURAL_LOCK_DIRECTIVE}\n\nAdd furniture to this image maintaining EXACTLY the same framing, perspective, camera angle, and all architectural elements (doors, windows, walls, floors, ceiling) UNCHANGED. Instructions: ${prompt}`;

  try {
    const response = await client.models.generateContent({
      model: modelId,
      contents: [
        {
          parts: [
            { text: actionPrompt },
            { inlineData: { data: imageBase64, mimeType } },
          ],
        },
      ],
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio,
          imageSize: '2K',
        },
      },
    });

    const { imageData, imageMime, usageMetadata } = extractImageFromResponse(response);

    console.log('[VS] ✅ Imagem gerada com sucesso. mimeType:', imageMime);
    return { success: true, imageBase64: imageData, mimeType: imageMime, usageMetadata };

  } catch (error) {
    console.error('[VS] Processing error:', error.message);
    return { success: false, error: error.message, usageMetadata: null };
  }
}

// ── editSurfaces — Semantic Inpainting via Imagen editImage API ─────────────

// ADE20K semantic segmentation class IDs used by Imagen/Gemini
const SEG_CLASS_WALL  = 9;   // wall
const SEG_CLASS_FLOOR = 3;   // floor

/**
 * Edits wall paint and/or floor material using the Imagen editImage API
 * with MASK_MODE_SEMANTIC segmentation. Each surface gets its own pass
 * to ensure clean mask isolation.
 *
 * @param {Object} params
 * @param {string} params.imageBase64 - base64 image (no data URI prefix)
 * @param {string} [params.wallPaint] - Wall color name to apply (e.g. "Cinza Urbano")
 * @param {string} [params.floorChange] - Floor material name (e.g. "Porcelanato Escuro")
 * @returns {Promise<{success: boolean, imageBase64?: string, mimeType?: string, error?: string}>}
 */
export async function editSurfaces({ imageBase64, wallPaint, floorChange }) {
  // Use Vertex AI client — MASK_MODE_SEMANTIC inpainting requires Vertex AI,
  // it is not available via Google AI Studio (API Key).

  // 🔍 DEBUG: env vars check
  console.log(`[VS-SURFACE:debug] ENV CHECK:
    GOOGLE_CLOUD_PROJECT   = ${JSON.stringify(process.env.GOOGLE_CLOUD_PROJECT)}
    GOOGLE_CLOUD_LOCATION  = ${JSON.stringify(process.env.GOOGLE_CLOUD_LOCATION)}
    VERTEX_AI_SA_KEY       = ${process.env.VERTEX_AI_SA_KEY ? `SET (${process.env.VERTEX_AI_SA_KEY.length} chars)` : 'NOT SET'}
    IMAGEN_MODEL_ID        = ${JSON.stringify(process.env.IMAGEN_MODEL_ID)}
    wallPaint              = ${JSON.stringify(wallPaint)}
    floorChange            = ${JSON.stringify(floorChange)}`)

  const client = getVertexAIClient();
  const modelId = resolveImagenModel();
  let currentImage = imageBase64;
  let currentMime = 'image/png';

  console.log(`[VS-SURFACE] editSurfaces start | wall=${wallPaint || 'none'} | floor=${floorChange || 'none'} | model=${modelId}`);

  try {
    // ── Pass 1: Wall paint ────────────────────────────────────────────────
    if (wallPaint) {
      console.log(`[VS-SURFACE] Pass 1: Wall paint → "${wallPaint}"`);

      const rawRef = new RawReferenceImage();
      rawRef.referenceImage = { imageBytes: currentImage, mimeType: 'image/jpeg' };
      rawRef.referenceId = 0;

      const maskRef = new MaskReferenceImage();
      maskRef.referenceId = 0;
      maskRef.config = {
        maskMode: 'MASK_MODE_SEMANTIC',
        segmentationClasses: [SEG_CLASS_WALL],
      };

      const response = await client.models.editImage({
        model: modelId,
        prompt: `Repaint the masked wall surfaces with a fresh uniform coat of "${wallPaint}" matte interior paint. Maintain realistic paint finish with proper light interaction, subtle shading, and natural reflections. Do NOT alter any non-wall surfaces.`,
        referenceImages: [rawRef, maskRef],
        config: {
          editMode: 'EDIT_MODE_INPAINT_INSERTION',
          numberOfImages: 1,
        },
      });

      const generated = response?.generatedImages?.[0];
      if (!generated?.image?.imageBytes) {
        throw new Error(`editImage wall pass returned no image. Response: ${JSON.stringify(response).substring(0, 500)}`);
      }

      currentImage = generated.image.imageBytes;
      currentMime = generated.image.mimeType || 'image/png';
      console.log(`[VS-SURFACE] ✅ Wall paint applied`);
    }

    // ── Pass 2: Floor replacement ─────────────────────────────────────────
    if (floorChange) {
      console.log(`[VS-SURFACE] Pass 2: Floor change → "${floorChange}"`);

      const rawRef = new RawReferenceImage();
      rawRef.referenceImage = { imageBytes: currentImage, mimeType: currentMime };
      rawRef.referenceId = 0;

      const maskRef = new MaskReferenceImage();
      maskRef.referenceId = 0;
      maskRef.config = {
        maskMode: 'MASK_MODE_SEMANTIC',
        segmentationClasses: [SEG_CLASS_FLOOR],
      };

      const response = await client.models.editImage({
        model: modelId,
        prompt: `Replace the masked floor surface entirely with "${floorChange}" flooring. The new floor must follow the room's perspective geometry perfectly with correct grout lines, joints, and realistic material texture. Maintain proper reflections, shadows, and floor transitions at doorways. Do NOT alter any non-floor surfaces.`,
        referenceImages: [rawRef, maskRef],
        config: {
          editMode: 'EDIT_MODE_INPAINT_INSERTION',
          numberOfImages: 1,
        },
      });

      const generated = response?.generatedImages?.[0];
      if (!generated?.image?.imageBytes) {
        throw new Error(`editImage floor pass returned no image. Response: ${JSON.stringify(response).substring(0, 500)}`);
      }

      currentImage = generated.image.imageBytes;
      currentMime = generated.image.mimeType || 'image/png';
      console.log(`[VS-SURFACE] ✅ Floor replacement applied`);
    }

    console.log(`[VS-SURFACE] editSurfaces complete`);
    return { success: true, imageBase64: currentImage, mimeType: currentMime };

  } catch (error) {
    console.error('[VS-SURFACE] editSurfaces error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Calcula custo baseado na resolução
 * @param {string} resolution - '2K' ou '4K'
 * @returns {number} Custo em USD
 */
export function calculateCost(resolution = '2K') {
  return resolution === '4K' ? 0.24 : 0.134;
}
