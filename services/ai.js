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

const CLEAN_UP_PROMPT = `You are a photo retouching tool, not an interior designer. Your ONLY task is to digitally REMOVE clutter and mess from the photo. You do NOT add, install, replace, or improve anything.

━━━ GEOMETRIA — BLOQUEADA ABSOLUTAMENTE ━━━
A imagem de saida DEVE ter:
- Exactamente a mesma proporcao (aspect ratio) da imagem de entrada.
- Exactamente o mesmo angulo de camera, zoom, campo visual (FOV) e perspectiva.
- Nenhum recorte, ampliacao, rotacao ou mudanca de enquadramento.
Se voce alterar o enquadramento de qualquer forma, a tarefa falhou.

━━━ ZERO ADICOES — PROIBIDO INSERIR QUALQUER COISA ━━━
Nao insira absolutamente nada que nao esteja presente na foto original:
- PROIBIDO: luminarias, abajures, pendentes, spots ou qualquer tipo de iluminacao.
- PROIBIDO: moveis, tapetes, plantas, quadros, vasos, objetos decorativos.
- PROIBIDO: substituicao de piso, teto, paredes ou qualquer elemento estrutural.
- PROIBIDO: pintura, renovacao ou melhoria visual de qualquer superficie.
Sua unica acao permitida e REMOVER itens de baguncca ja existentes.

━━━ PRESERVACAO DE MATERIAIS — OBRIGATORIA ━━━
- O piso deve manter seu material, cor, textura e padrao IDENTICOS ao original. Se houver sujeira, remova apenas a sujeira superficial SEM alterar o material subjacente.
- Paredes, teto e todas as superficies fixas devem manter cor, textura e estado exatos da foto original (manchas de umidade antigas, reboco bruto, tinta descascada devem PERMANECER se forem estruturais).
- Luminarias, interruptores, tomadas e instalacoes fixas existentes devem permanecer EXATAMENTE como estao.

━━━ O QUE REMOVER (BAGUNCCA) ━━━
Remova apenas objetos transientes, pessoais e de consumo fora do lugar:
- Cozinhas: louças sujas, panelas, panos, detergentes, alimentos, sacolas.
- Banheiros: toalhas usadas, produtos de higiene, lixo, tapetes amassados.
- Quartos: roupas, sapatos, bolsas, cabides soltos, malas.
- Salas/Escritorios: papeis, cabos, eletrônicos pessoais, caixas, embalagens.
- Geral: entulho, materiais de construcao soltos, lixo de qualquer tipo.

━━━ O QUE NUNCA TOCAR ━━━
- Moveis grandes (sofas, camas, mesas, estantes, geladeira, fogao): permanecem no lugar EXATO.
- Decoracao fixa (quadros na parede, vasos grandes, plantas permanentes): permanecem.
- Iluminacao natural: mantenha as condicoes exatas de luz, sombra e reflexos.

Resultado esperado: A mesma fotografia da entrada, com a mesma proporcao e enquadramento, mostrando o ambiente exatamente como ele e — porem sem a baguncca superficial.`

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

export async function generateWithGemini({ imageBase64, prompt, mimeType = 'image/jpeg' }) {
  const client = getClient()

  // Proteção de modelo: modelos "pro" são texto-only e retornam finishReason: "NO_IMAGE".
  // Apenas modelos da família flash-image suportam Image-to-Image.
  const SAFE_MODEL = 'gemini-3.1-flash-image-preview'
  const envModel = process.env.VS_MODEL_ID || ''
  const modelId = (!envModel || envModel.toLowerCase().includes('pro'))
    ? (console.log(`[ai] Override: '${envModel || 'vazio'}' não suporta imagem. Usando ${SAFE_MODEL}`), SAFE_MODEL)
    : envModel
  console.log('[ai] Using model:', modelId)

  // Verbo imperativo prefixado ao prompt evita que o modelo entre em modo VQA
  // (onde descreve a imagem em vez de transformá-la).
  // Para limpar-baguncca usamos prefixo diferente que enfatiza "não adicionar nada".
  const isCleanup = prompt === CLEAN_UP_PROMPT
  const actionPrompt = isCleanup
    ? `Remove only the clutter and mess from this photo. Do not add, replace or change anything else: ${prompt}`
    : `Edite esta imagem aplicando o seguinte: ${prompt}`

  // Para edição (limpar-baguncca), NÃO forçamos aspectRatio — o modelo deve
  // respeitar as dimensões originais da imagem de entrada.
  // Para staging (texto->imagem), usamos 4:3 como referência.
  const imageConfig = isCleanup
    ? { imageSize: '2K' }
    : { aspectRatio: '4:3', imageSize: '2K' }

  try {
    const response = await client.models.generateContent({
      model: modelId,
      contents: [
        {
          parts: [
            // Prompt de ação primeiro
            { text: actionPrompt },
            // Imagem de referência para transformação
            { inlineData: { data: imageBase64, mimeType } },
          ],
        },
      ],
      config: {
        // IMAGE exclusivo: remover TEXT evita resposta VQA ("Vejo na imagem...")
        responseModalities: ['IMAGE'],
        imageConfig,
      },
    })

    // Dump bruto para diagnóstico — remove após estabilizar
    console.log('[DEBUG AI RESPONSE DUMP]:', JSON.stringify(response, null, 2))

    const candidate = response.candidates?.[0]
    const finishReason = candidate?.finishReason
    console.log('[ai] Finish reason:', finishReason)

    // Detectar bloqueio por safety filters
    if (finishReason === 'SAFETY' || finishReason === 'IMAGE_SAFETY') {
      const ratings = JSON.stringify(candidate?.safetyRatings || {})
      throw new Error(`Bloqueado por filtro de segurança. Ratings: ${ratings}`)
    }

    // Detectar modelo errado (pro ou texto-only)
    if (finishReason === 'NO_IMAGE') {
      throw new Error(`Modelo '${modelId}' não suporta geração de imagem (NO_IMAGE). Verifique VS_MODEL_ID.`)
    }

    // Extração defensiva: suporte a camelCase (inlineData) e snake_case (inline_data)
    const parts = candidate?.content?.parts || []
    const imagePart = parts.find(p => p.inlineData?.data || p.inline_data?.data)
    const imageData = imagePart?.inlineData?.data || imagePart?.inline_data?.data || null
    const imageMime = imagePart?.inlineData?.mimeType || imagePart?.inline_data?.mime_type || 'image/png'

    if (!imageData) {
      const textFallback = parts.find(p => p.text)?.text || 'Sem resposta'
      throw new Error(`Gemini nao retornou imagem. Parts: ${parts.length}. Texto: "${textFallback.substring(0, 300)}"`)
    }

    console.log('[ai] Imagem extraída com sucesso. mimeType:', imageMime)
    return {
      success: true,
      imageBase64: imageData,
      mimeType: imageMime,
      usageMetadata: response.usageMetadata || null,
      modelId,   // modelo REAL usado (após model guard)
    }
  } catch (err) {
    console.error('[ai] Gemini error:', err.message)
    return { success: false, error: err.message, usageMetadata: null, modelId }
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
