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
import { detectAspectRatioFromBase64 } from '../lib/image-utils.js'

// ── Constants ─────────────────────────────────────────────────────────────────

const CLEAN_UP_PROMPT = `You are a professional real estate photo editor. Your task has two parts: (1) digitally REMOVE clutter and mess, and (2) apply a fresh coat of paint to walls and ceiling as described below.

━━━ GEOMETRIA — BLOQUEADA ABSOLUTAMENTE ━━━
A imagem de saida DEVE ter:
- Exactamente a mesma proporcao (aspect ratio) da imagem de entrada.
- Exactamente o mesmo angulo de camera, zoom, campo visual (FOV) e perspectiva.
- Nenhum recorte, ampliacao, rotacao ou mudanca de enquadramento.
Se voce alterar o enquadramento de qualquer forma, a tarefa falhou.

━━━ PINTURA DE PAREDES E TETO — OBRIGATORIA ━━━
Aplique pintura nova e uniforme nas paredes e no teto do recinto:
- TETO: branco puro (warm white), sem textura aparente, aspecto de tinta latex recém-aplicada.
- PAREDES: escolha automaticamente a cor neutra mais adequada ao ambiente entre as tres opcoes abaixo, priorizando harmonia com o piso e mobiliario existente:
  a) Branco off-white (tom ligeiramente quente, ex: #F5F0E8)
  b) Palha / areia clara (tom bege suave, ex: #EDE0C4)
  c) Pessego claro (tom rosado suave, ex: #F2D9C8)
- A pintura deve cobrir uniformemente toda a extensao de cada parede visivel, inclusive em torno de portas, janelas, rodapes e quinas.
- Mantenha interruptores, tomadas, rodapes, portas, janelas e qualquer elemento fixo NO MESMO LUGAR e formato — apenas a cor da parede/teto muda.
- A aparencia final deve ser fotorrealista, como se o ambiente tivesse sido pintado por um profissional.

━━━ REMOCAO DE BAGUNCCA — OBRIGATORIA ━━━
Remova todos os objetos transientes, pessoais e de consumo fora do lugar:
- Cozinhas: louças sujas, panelas, panos, detergentes, alimentos, sacolas.
- Banheiros: toalhas usadas, produtos de higiene, lixo, tapetes amassados.
- Quartos: roupas, sapatos, bolsas, cabides soltos, malas.
- Salas/Escritorios: papeis, cabos, eletronicos pessoais, caixas, embalagens.
- Geral: entulho, materiais de construcao soltos, lixo de qualquer tipo.

━━━ PRESERVACAO DO PISO ━━━
- O piso deve manter seu material, cor, textura e padrao IDENTICOS ao original.
- Se houver sujeira, remova apenas a sujeira superficial SEM alterar o material subjacente.

━━━ O QUE NUNCA TOCAR ━━━
- Moveis grandes (sofas, camas, mesas, estantes, geladeira, fogao): permanecem no lugar EXATO.
- Decoracao fixa (quadros na parede, vasos grandes, plantas permanentes): permanecem.
- Luminarias, spots e instalacoes fixas: permanecem no lugar exato.
- Iluminacao natural: mantenha as condicoes exatas de luz, sombra e reflexos.
- PROIBIDO adicionar qualquer mobiliario, tapete, planta ou objeto decorativo novo.

Resultado esperado: A mesma fotografia da entrada, mesmo enquadramento e proporcao, mostrando o ambiente limpo, organizado e com paredes e teto recém-pintados em tom neutro claro.`

const STRUCTURAL_LOCK_DIRECTIVE = `━━━ PRIORIDADE ZERO — BLOQUEIO ESTRUTURAL ABSOLUTO E INVIOLAVEL ━━━
Todos os elementos arquitetonicos e estruturais da fotografia original DEVEM permanecer PIXEL-PERFECT e COMPLETAMENTE INALTERADOS. Esta regra SOBRESCREVE todas as outras instrucoes sem excecao.

RESOLUCAO E DIMENSOES:
A imagem de saida DEVE preservar EXATAMENTE a mesma resolucao, dimensoes e aspect ratio da fotografia de entrada. NAO recortar, preencher, redimensionar, letterbox ou alterar as dimensoes em pixel de forma alguma.

ELEMENTOS QUE NUNCA DEVEM SER ALTERADOS, REMOVIDOS, MOVIDOS, REDIMENSIONADOS, RECOLORIDOS OU OBSTRUIDOS:
- PORTAS: paineis, batentes, macanetas, dobradicas, fechaduras, soleiras, molduras
- JANELAS: caixilhos, vidros, peitoris, grades, persianas, trilhos
- PAREDES: superficie, cor de tinta, textura, rodapes, molduras de gesso, tomadas, interruptores
- PISOS: material, cor, padrao, textura, transicoes
- TETO: superficie, altura, spots, ventiladores, molduras, vigas
- ABERTURAS: corredores, arcos, passagens — TODOS devem permanecer totalmente visiveis e desobstruidos
- INSTALACOES FIXAS: armarios embutidos, bancadas fixas, ar condicionado, aquecedores

VERIFICACAO OBRIGATORIA ANTES DO OUTPUT:
Conte cada porta e janela visivel na imagem original. O output DEVE ter o MESMO numero de portas e janelas, nas MESMAS posicoes, com as MESMAS dimensoes. Se QUALQUER porta ou janela estiver faltando, alterada ou parcialmente escondida — o output e INVALIDO.

NENHUM movel, tapete, cortina, planta ou objeto decorativo pode bloquear, cobrir ou reduzir a area visivel de QUALQUER porta, janela, corredor ou abertura.

PROIBIDO criar paredes, divisorias, pilares ou qualquer elemento arquitetonico que NAO exista na foto original.`

const PERSPECTIVE_LOCK = `━━━ PERSPECTIVA — REGRA INVIOLAVEL ━━━
A CAMERA NAO SE MOVE. O ponto de vista, angulo, distancia focal, enquadramento e proporcoes da foto original sao ABSOLUTAMENTE IMUTAVEIS. A linha do horizonte, pontos de fuga e geometria perspectiva devem ser IDENTICOS pixel por pixel. NAO rotacionar, inclinar, dar zoom in/out ou recortar a imagem de forma alguma.`

const STAGING_UNIVERSAL_RULES = `ALINHAMENTO GEOMETRICO — OBRIGATORIO:
- Todos os moveis devem ser posicionados PARALELOS ou PERPENDICULARES as paredes mais proximas. NUNCA em diagonal.
- Sofas e camas devem ser colocados encostados em uma parede.
- Tapetes devem ser alinhados com o eixo principal do comodo.
- Mesas de centro devem ser centralizadas em relacao ao sofa.
- Cadeiras devem ser alinhadas com mesas, NUNCA em angulo.

REGRA UNIVERSAL DE POSICIONAMENTO:
Nenhum movel, tapete, objeto decorativo ou qualquer elemento inserido pode obstruir, bloquear, cobrir parcialmente ou reduzir a passagem de PORTAS, JANELAS, CORREDORES ou qualquer abertura visivel no ambiente.`

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

  // TODOS os estilos (incluindo popular_brasileiro) passam pelo lock estrutural
  return (
    STRUCTURAL_LOCK_DIRECTIVE + '\n\n' +
    PERSPECTIVE_LOCK + '\n\n' +
    STAGING_UNIVERSAL_RULES + '\n\n' +
    (job.style === 'popular_brasileiro' ? rawPrompt : adaptPrompt(rawPrompt, job.room_type))
  )
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
  const isCleanup = prompt.includes('REMOCAO DE BAGUNCCA') || prompt.includes('PINTURA DE PAREDES')
  const actionPrompt = isCleanup
    ? `Edit this real estate photo: remove all clutter and mess, then repaint the walls and ceiling with a fresh neutral color as instructed. The output MUST have EXACTLY the same camera angle, perspective, framing, and dimensions as the input. Do NOT add walls or architectural elements that don't exist. Follow all rules exactly:\n\n${prompt}`
    : `Edit this real estate photo adding furniture. CRITICAL: the output MUST preserve EXACTLY the same camera angle, perspective, framing, room geometry, and all architectural elements (walls, doors, windows, ceiling). Do NOT create walls, partitions, or architectural elements that do not exist in the original photo. Do NOT change the perspective or crop.\n\n${prompt}`

  // Detectar aspect ratio real da imagem de entrada (JPEG/PNG/WebP header parse)
  const aspectRatio = detectAspectRatioFromBase64(imageBase64)
  const imageConfig = { aspectRatio, imageSize: '2K' }

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
