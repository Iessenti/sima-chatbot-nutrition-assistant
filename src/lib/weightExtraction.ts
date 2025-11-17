const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ''

export async function extractWeight(message: string): Promise<number | null> {
  if (!OPENROUTER_API_KEY) return null

  const weightPatterns = [
    /\b(\d+(?:[.,]\d+)?)\s*(?:кг|килограмм|кило|kg|kilogram)\b/i,
    /\bвес[ауе]?\s*[:\-]?\s*(\d+(?:[.,]\d+)?)/i,
    /\bвешу\s*(\d+(?:[.,]\d+)?)/i,
    /\b(\d+(?:[.,]\d+)?)\s*кило/i,
  ]

  for (const pattern of weightPatterns) {
    const match = message.match(pattern)
    if (match) {
      const weight = parseFloat(match[1].replace(',', '.'))
      if (weight > 30 && weight < 300) {
        return weight
      }
    }
  }

  const extractionPrompt = `Извлеки вес из сообщения пользователя. Верни ТОЛЬКО число (вес в кг) или null если веса нет.

Сообщение: "${message}"

Верни только число или null, без текста.`

  try {
    const { callLLM } = await import('./openrouter')
    const response = await callLLM(
      [
        {
          id: 'weight-extraction',
          role: 'user',
          content: extractionPrompt,
          timestamp: Date.now(),
        },
      ],
      { apiKey: OPENROUTER_API_KEY },
      undefined
    )

    const numberMatch = response.match(/\d+(?:[.,]\d+)?/)
    if (numberMatch) {
      const weight = parseFloat(numberMatch[0].replace(',', '.'))
      if (weight > 30 && weight < 300) {
        return weight
      }
    }
  } catch (error) {
    console.error('Error extracting weight:', error)
  }

  return null
}

