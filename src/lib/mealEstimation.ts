import type { ExtractedMealData } from './dataExtraction'

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ''

export async function estimateMealKBJU(mealName: string): Promise<{
  calories: number
  protein: number
  fat: number
  carbs: number
} | null> {
  if (!OPENROUTER_API_KEY) return null

  const estimationPrompt = `Оцени приблизительное КБЖУ для блюда "${mealName}".
Верни ТОЛЬКО валидный JSON объект без дополнительного текста:
{
  "calories": число,
  "protein": число (в граммах),
  "fat": число (в граммах),
  "carbs": число (в граммах)
}

Правила оценки:
- Оценивай на основе типичного состава и размера порции этого блюда
- Учитывай указанное количество если есть (например "200г творога", "стакан молока", "2 яйца")
- Для стандартных порций используй средние значения:
  * Порция каши/гарнира: ~150-200 ккал, 5-10г белка, 1-3г жира, 30-40г углеводов
  * Порция мяса/рыбы (100-150г): ~150-250 ккал, 20-30г белка, 5-15г жира, 0-5г углеводов
  * Порция овощей: ~20-50 ккал, 1-3г белка, 0-1г жира, 5-10г углеводов
  * Фрукт средний: ~50-100 ккал, 0-1г белка, 0-1г жира, 10-20г углеводов
- Если в названии указано количество - учитывай его при расчёте
- Будь реалистичным в оценках, не завышай и не занижай

Верни только JSON, без markdown, без объяснений.`

  try {
    const { callLLM } = await import('./openrouter')
    const response = await callLLM(
      [
        {
          id: 'estimation',
          role: 'user',
          content: estimationPrompt,
          timestamp: Date.now(),
        },
      ],
      { apiKey: OPENROUTER_API_KEY },
      undefined
    )

    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const estimated = JSON.parse(jsonMatch[0])
    return {
      calories: estimated.calories || 0,
      protein: estimated.protein || 0,
      fat: estimated.fat || 0,
      carbs: estimated.carbs || 0,
    }
  } catch (error) {
    console.error('Error estimating meal KBJU:', error)
    return null
  }
}

export async function enrichMealData(meals: ExtractedMealData[]): Promise<ExtractedMealData[]> {
  const enriched = await Promise.all(
    meals.map(async (meal) => {
      if (meal.calories && meal.protein && meal.fat && meal.carbs) {
        return meal
      }

      const estimated = await estimateMealKBJU(meal.name)
      if (estimated) {
        return {
          name: meal.name,
          calories: meal.calories || estimated.calories,
          protein: meal.protein || estimated.protein,
          fat: meal.fat || estimated.fat,
          carbs: meal.carbs || estimated.carbs,
        }
      }

      return meal
    })
  )

  return enriched
}

