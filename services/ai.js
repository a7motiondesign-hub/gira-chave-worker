/**
 * worker/services/ai.js
 *
 * Wrappers for Gemini (virtual-staging, limpar-baguncca) and
 * Replicate (foto-revista) calls.
 *
 * Uses the NEW @google/genai SDK with responseModalities: ['TEXT','IMAGE']
 * which is REQUIRED for Gemini image generation models.
 */

import { GoogleGenAI } from '@google/genai'
import Replicate from 'replicate'
import { PROMPT_LIBRARY } from '../lib/prompts.js'

// ── Constants ─────────────────────────────────────────────────────────────────

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

1. NAO ALTERE A ESTRUTURA: Nao mude paredes, teto, piso, janelas, portas, luminarias fixas, armarios embutidos ou bancadas fixas.
2. NAO MOVA OU REMOVA MOBILIARIO: Sofas, camas, mesas, cadeiras, estantes, racks, geladeiras, fogoes e moveis grandes devem permanecer EXATAMENTE onde estao na foto original.
3. NAO MUDE O DESIGN: Nao altere cores de tintas, texturas de materiais, estampas de tecidos ou o estilo da decoracao existente (quadros na parede, vasos decorativos grandes e plantas devem permanecer).
4. NAO ALTERE A ILUMINACAO: Mantenha as condicoes exatas de luz, sombra e reflexos da fotografia original. O resultado deve ser fotorrealista e indistinguivel da foto original, exceto pela limpeza.

Resultado esperado: Uma fotografia imobiliaria profissional, mostrando o recinto exatamente como ele e, mas em seu estado mais limpo, organizado e apresentavel possivel.`

const STAGING_UNIVERSAL_RULES = `REGRA UNIVERSAL DE POSICIONAMENTO - OBRIGATORIA E ABSOLUTA:
Nenhum movel, tapete, objeto decorativo ou qualquer elemento inserido pode obstruir, bloquear, cobrir parcialmente ou reduzir a passagem de PORTAS, JANELAS, CORREDORES ou qualquer abertura visivel no ambiente. Todos os acessos e aberturas devem permanecer completamente desobstruidos e visiveis na imagem final, exatamente como estao na foto original.`

// ── Gemini client singleton (@google/genai) ───────────────────────────────────

let _client = null
function getClient() {
  if (!_client) {
    const apiKey = process.env.GOOGLE_VS_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) throw new Error('[ai] GOOGLE_VS_API_KEY not configured')
    _client = new GoogleGenAI({ apiKey })
  }
  return _client
}

// ── Prompt builder ────────────────────────────────────────────────────────────

export function buildGeminiPrompt(job) {
  if (job.service === 'limpar-baguncca') return CLEAN_UP_PROMPT

  const rawPrompt =
    PROMPT_LIBRARY[job.room_type]?.[job.style] ||
    PROMPT_LIBRARY.living_room.moderno_brasileiro

  if (job.style === 'popular_brasileiro') return rawPrompt

  return STAGING_UNIVERSAL_RULES + '\n\n' + adaptPrompt(rawPrompt, job.room_type)
}

function adaptPrompt(existingPrompt, roomType = '') {
  const detectedRoom =
    roomType ||
    existingPrompt.match(/\b(kitchen|bedroom|bathroom|living room|dining room|office)\b/i)?.[1] ||
    'interior space'

  return (
    `Edit and return the provided real estate photo with professional virtual staging applied, ` +
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

export async function generateWithGemini({ imageBase64, prompt }) {
  const client = getClient()

  // Modelo seguro para image-to-image. Se VS_MODEL_ID não suportar imagem, o fallback cobre.
  const MODEL_FALLBACK = 'gemini-2.5-flash-preview-image-generation'
  const modelId = process.env.VS_MODEL_ID || MODEL_FALLBACK
  console.log('[ai] Using model:', modelId)

  try {
    const response = await client.models.generateContent({
      model: modelId,
      contents: [
        {
          parts: [
            // Imagem de referência (image-to-image)
            { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
            // Instrução de transformação
            { text: prompt },
          ],
        },
      ],
      config: {
        // Forçar OUTPUT exclusivo de imagem.
        // "TEXT" removido propositalmente: quando ambos são listados, o modelo
        // entra em modo VQA (responde em texto explicando o que faria).
        // Com apenas "IMAGE", ele é forçado à transformação visual.
        responseModalities: ['IMAGE'],
      },
    })

    // ── DUMP BRUTO DE DIAGNÓSTICO (remova após estabilizar) ──────────────────
    // Essencial porque a estrutura da resposta muda entre versões do SDK/modelos.
    console.log('[DEBUG AI RESPONSE DUMP]:', JSON.stringify(response, null, 2))

    // ── Extração Defensiva Multi-Path ────────────────────────────────────────
    // A localização do base64 varia entre famílias de modelos (Gemini vs Imagen):
    const base64Image =
      // Path 1: Familia Imagen via Gemini API
      response.generatedImages?.[0]?.image?.imageBytes ||
      // Path 2: Gemini Flash Multimodal (candidates[].content.parts[])
      response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data ||
      // Path 3: parts expostos diretamente na raiz (algumas versões do SDK)
      response.parts?.find(p => p.inlineData)?.inlineData?.data ||
      null

    const imageMime =
      response.generatedImages?.[0]?.image?.mimeType ||
      response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.mimeType ||
      'image/png'

    const finishReason = response.candidates?.[0]?.finishReason
    console.log('[ai] Finish reason:', finishReason)

    if (!base64Image) {
      // Extrair texto da resposta para diagnóstico (se o modelo ignorou a restrição e respondeu em texto)
      const textFallback =
        response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text || 'Sem resposta'
      throw new Error(`Gemini nao retornou imagem. Texto: "${textFallback}"`)
    }

    return {
      success: true,
      imageBase64: base64Image,
      mimeType: imageMime,
      usageMetadata: response.usageMetadata || null,
    }
  } catch (err) {
    console.error('[ai] Gemini error:', err.message)
    return { success: false, error: err.message, usageMetadata: null }
  }
}

// ── Replicate image generation ────────────────────────────────────────────────

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
