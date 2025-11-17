import type { KBJUGoal } from './types'
import { callLLM } from './openrouter'

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ''

export interface ExtractedGoalData {
  calories?: number
  protein?: number
  fat?: number
  carbs?: number
}

/**
 * Извлекает цели КБЖУ из сообщения пользователя
 * Позволяет пользователю изменять цели через естественный язык
 */
export async function extractGoalData(message: string): Promise<ExtractedGoalData | null> {
  if (!OPENROUTER_API_KEY) return null

  const extractionPrompt = `Проанализируй сообщение пользователя и извлеки цели по КБЖУ (калории, белки, жиры, углеводы).
Верни ТОЛЬКО валидный JSON объект без дополнительного текста с полями:
{
  "calories": число или null,
  "protein": число или null,
  "fat": число или null,
  "carbs": число или null
}

Правила извлечения:
- Калории: ищи числа с "ккал", "калорий", "calories", "хочу X ккал", "нужно X калорий", "норма X ккал"
- Белки: ищи числа с "г белка", "белков", "protein", "белка X г", "X грамм белка"
- Жиры: ищи числа с "г жира", "жиров", "fat", "жира X г", "X грамм жира"
- Углеводы: ищи числа с "г углеводов", "углеводов", "carbs", "углеводов X г", "X грамм углеводов"

Распознавай фразы:
- "хочу X ккал в день" → calories: X
- "нужно X калорий" → calories: X
- "белка X грамм" → protein: X
- "жиров X" → fat: X
- "углеводов X" → carbs: X
- "изменить цель на X ккал" → calories: X
- "установить норму X ккал" → calories: X

Если пользователь упоминает изменение целей, но не указывает конкретные числа - верни null для соответствующих полей.
Если целей КБЖУ нет в сообщении - верни null для всех полей.

Сообщение пользователя: "${message}"

Верни только JSON, без markdown, без объяснений.`

  try {
    const response = await callLLM(
      [
        {
          id: 'goal-extraction',
          role: 'user',
          content: extractionPrompt,
          timestamp: Date.now(),
        },
      ],
      { apiKey: OPENROUTER_API_KEY },
      undefined
    )

    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const extracted = JSON.parse(jsonMatch[0])
    
    // Проверяем, есть ли хоть какие-то данные о целях
    const hasData = extracted.calories != null || 
                   extracted.protein != null || 
                   extracted.fat != null || 
                   extracted.carbs != null

    return hasData ? extracted : null
  } catch (error) {
    console.error('Error extracting goal data:', error)
    return null
  }
}

