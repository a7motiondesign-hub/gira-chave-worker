
import 'dotenv/config'
import { GoogleGenerativeAI } from '@google/generative-ai'

async function run() {
  const apiKey = process.env.GOOGLE_VS_API_KEY
  if (!apiKey) {
    console.error('API key missing')
    return
  }
  
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: process.env.VS_MODEL_ID })

  const buffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=',
    'base64'
  )

  const prompt = 'Describe this image as detailed as possible.'

  try {
    const result = await model.generateContent([
      { inlineData: { data: buffer.toString('base64'), mimeType: 'image/png' } },
      { text: prompt },
    ])

    const response = await result.response
    console.log('--- RESPONSE METADATA ---')
    console.log(response.promptFeedback)
    console.log(response.usageMetadata)
    
    console.log('--- RESPONSE CANDIDATES ---')
    if (response.candidates && response.candidates.length > 0) {
       console.log(JSON.stringify(response.candidates[0].content, null, 2))
    } else {
       console.log('No candidates found.')
    }

  } catch (err) {
    console.error(err)
  }
}

run()
