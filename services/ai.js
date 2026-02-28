/**
 * worker/services/ai.js
 *
 * Wrappers for Gemini (virtual-staging, limpar-baguncca) and
 * Replicate (foto-revista) calls. Adapted from:
 *   - lib/google-ai-image-client.js
 *   - app/api/cron/process-queue/route.js (processFotoRevista, processGeminiJob)
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import Replicate from 'replicate'
import { PROMPT_LIBRARY } from '../lib/prompts.js'

// ── Constants (mirrored from process-queue/route.js) ─────────────────────────

const CLEAN_UP_PROMPT = `Edit and return the provided real estate photo with a professional virtual cleanup applied. OUTPUT: Photorealistic cleaned interior photo, same resolution and framing as input.

Atue como um editor profissional de fotografia imobiliaria de alto padrao. Sua tarefa e realizar uma faxina virtual completa e impecavel na imagem fornecida, preparando-a para um anuncio de imovel premium.

INSTRUCOES DE LIMPEZA E ORGANIZACAO (UNIVERSAL PARA QUALQUER RECINTO):

1. REMOCAO TOTAL DE BAGUNCCA: Identifique e remova todos os objetos transientes, pessoais e de consumo que nao fazem parte da decoracao permanente ou do mobiliario fixo. Isso inclui, mas nao se limita a:
   - Em Cozinhas/Salas de Jantar: Loucas sujas ou limpas, panelas, talheres, panos de prato, detergentes, esponjas, alimentos, garrafas, sacolas plasticas e eletroportateis pequenos fora de lugar.
   - Em Banheiros: Toalhas usadas, roupoes, produtos de higiene pessoal (shampoos, sabonetes, escovas de dente, cremes), papel higienico fora do suporte, lixo e tapetes de banho amassados.
   - Em Quartos/Closets: Roupas (limpas ou sujas), sapatos, bolsas, cabides soltos, joias, maquiagem, malas e brinquedos.
   - Em Escritorios/Salas: Papeis soltos, canetas, cabos, carregadores, eletronicos pessoais (celulares, tablets, laptops se parecerem em uso), controles remotos, revistas, jornais, caixas e encomendas.
   - Geral: Qualquer tipo de lixo, embalagem ou item fora do lugar.

2. ORGANIZACAO DE SUPERFICIES:
   - Deixe todas as superficies horizontais (bancadas, mesas, criados-mudos, escrivaninhas, chao) completamente limpas, desimpedidas e brilhantes, como se tivessem acabado de ser faxinadas.
   - Se houver camas: Deixe-as perfeitamente feitas, com lencois e colchas esticados de forma hoteleira, sem rugas.
   - Se houver sofas/poltronas: Endireite as almofadas do assento e encosto, deixando-as com aspecto de novas e alinhadas.
   - Endireite cadeiras e banquetas para que fiquem alinhadas com as mesas ou bancadas.

RESTRICOES CRITICAS E ABSOLUTAS (O QUE NAO TOCAR):

1. NAO ALTERE A ESTRUTURA: Nao mude paredes, teto, piso, janelas, portas, luminárias fixas, armarios embutidos ou bancadas fixas.
2. NAO MOVA OU REMOVA MOBILIARIO: Sofas, camas, mesas, cadeiras, estantes, racks, geladeiras, fogoes e moveis grandes devem permanecer EXATAMENTE onde estao na foto original.
3. NAO MUDE O DESIGN: Nao altere cores de tintas, texturas de materiais, estampas de tecidos ou o estilo da decoracao existente (quadros na parede, vasos decorativos grandes e plantas devem permanecer).
4. NAO ALTERE A ILUMINACAO: Mantenha as condicoes exatas de luz, sombra e reflexos da fotografia original. O resultado deve ser fotorrealista e indistinguivel da foto original, exceto pela limpeza.

Resultado esperado: Uma fotografia imobiliaria profissional, mostrando o recinto exatamente como ele e, mas em seu estado mais limpo, organizado e apresentavel possivel.`

const STAGING_UNIVERSAL_RULES = `REGRA UNIVERSAL DE POSICIONAMENTO — OBRIGATORIA E ABSOLUTA:
Nenhum movel, tapete, objeto decorativo ou qualquer elemento inserido pode obstruir, bloquear, cobrir parcialmente ou reduzir a passagem de PORTAS, JANELAS, CORREDORES ou qualquer abertura visivel no ambiente. Todos os acessos e aberturas devem permanecer completamente desobstruidos e visiveis na imagem final, exatamente como estao na foto original.`

// ── Gemini client (singleton) ─────────────────────────────────────────────────

let _genAI = null

function getGeminiClient() {
  if (!_genAI) {
    const apiKey = process.env.GOOGLE_VS_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) throw new Error('[ai] GOOGLE_VS_API_KEY não configurada')
    _genAI = new GoogleGenerativeAI(apiKey)
  }
  return _genAI
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
  if (job.service === 'limpar-baguncca') {
    return CLEAN_UP_PROMPT
  }

  const rawPrompt =
    PROMPT_LIBRARY[job.room_type]?.[job.style] ||
    PROMPT_LIBRARY.living_room.moderno_brasileiro

  // popular_brasileiro prompts already contain the full directive — no adaptation needed
  if (job.style === 'popular_brasileiro') {
    return rawPrompt
  }

  return STAGING_UNIVERSAL_RULES + '\n\n' + adaptPrompt(rawPrompt, job.room_type)
}

/**
 * Adapts a plain Stable-Diffusion-style prompt for Gemini image output.
 * Mirrors adaptExistingPrompt() from lib/google-ai-image-client.js.
 *
 * @param {string} existingPrompt
 * @param {string} roomType
 * @returns {string}
 */
function adaptPrompt(existingPrompt, roomType = '') {
  const detectedRoom =
    roomType ||
    existingPrompt.match(/\b(kitchen|bedroom|bathroom|living room|dining room|office)\b/i)?.[1] ||
    'interior space'

  return (
    `Edit and return the provided real estate photo with professional virtual staging applied — ` +
    `furnishing an empty or unfurnished ${detectedRoom}. ` +
    `OUTPUT: Photorealistic furnished interior photo, same resolution and framing as input.\n\n` +
    `STYLE REFERENCE (recreate this aesthetic in the room):\n${existingPrompt}\n\n` +
    `CRITICAL RULES:\n` +
    `- Preserve ALL architectural elements exactly (walls, floors, ceiling, windows, doors)\n` +
    `- Maintain original camera angle, perspective, and lighting conditions\n` +
    `- Add ONLY furniture, decor, and staging elements consistent with the style reference\n` +
    `- Ensure photorealistic rendering indistinguishable from a real photograph\n` +
    `- No text, watermarks, or UI elements`
  )
}

// ── Gemini image generation ───────────────────────────────────────────────────

/**
 * Calls Gemini to generate a virtual staging or clean-up image.
 *
 * @param {{ imageBase64: string, prompt: string }} params
 * @returns {Promise<{ success: boolean, imageBase64?: string, mimeType?: string, usageMetadata?: object, error?: string }>}
 */
export async function generateWithGemini({ imageBase64, prompt }) {
  const genAI = getGeminiClient()
  const model = genAI.getGenerativeModel({
    model: process.env.VS_MODEL_ID || 'gemini-3.1-pro-preview',
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  })

  try {
    const result = await model.generateContent([
      { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
      { text: prompt },
    ])

    const response = await result.response
    const usageMetadata = response.usageMetadata || null

    // Logging detailed blocking info if available
    if (response.promptFeedback?.blockReason) {
      console.warn('[ai] Gemini block reason:', response.promptFeedback.blockReason)
    }

    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      p => p.inlineData?.mimeType?.startsWith('image/')
    )

    if (!imagePart) {
      // Try to extract text explanation if image is missing
      const textPart = response.text ? response.text() : 'No text explanation provided.'
      throw new Error(`Gemini não retornou imagem. Resposta textual: "${textPart}"`)
    }

    return {
      success: true,
      imageBase64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType,
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
export async function generateWithReplicate({ imageBase64 }) {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

  const dataUri = `data:image/jpeg;base64,${imageBase64}`

  try {
    const output = await replicate.run(process.env.FT_MODEL_ID, {
      input: {
        image: dataUri,
        prompt:
          'professional real estate photography, HDR, natural lighting, sharp details, vibrant colors, high quality',
        negative_prompt: 'blurry, low quality, distorted, noisy, dark, underexposed',
        dynamic: 6,
        creativity: 0.35,
        resemblance: 0.6,
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
