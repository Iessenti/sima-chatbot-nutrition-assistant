import type { UserProfile, DailyEntry, Meal, Gender, ActivityLevel, Goal } from './types'
import { callLLM } from './openrouter'

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ''

export interface ExtractedProfileData {
  age?: number
  weight?: number
  height?: number
  gender?: Gender
  activityLevel?: ActivityLevel
  goal?: Goal
  targetWeight?: number
  name?: string
}

export interface ExtractedMealData {
  name: string
  calories?: number
  protein?: number
  fat?: number
  carbs?: number
}

export interface LLMAction {
  type: 'create_profile' | 'update_profile' | 'add_entry' | 'show_stats' | 'show_goal' | 'none'
  data?: Partial<UserProfile> | DailyEntry | null
  response: string
}

export async function extractUserData(message: string): Promise<ExtractedProfileData | null> {
  if (!OPENROUTER_API_KEY) return null

  const extractionPrompt = `Проанализируй сообщение пользователя и извлеки биометрические данные.
Верни ТОЛЬКО валидный JSON объект без дополнительного текста с полями:
{
  "age": число или null,
  "weight": число или null,
  "height": число или null,
  "gender": "male" | "female" | null,
  "activityLevel": "sedentary" | "light" | "moderate" | "active" | "very_active" | null,
  "goal": "lose" | "maintain" | "gain" | null,
  "targetWeight": число или null,
  "name": строка или null
}

Правила извлечения:
- Возраст: ищи числа с словами "лет", "год", "age", "мне X", "X лет", "возраст X", "мне уже X"
- Вес: ищи числа с "кг", "килограмм", "weight", "вешу X", "X килограмм", "мой вес X", "вес сейчас X", "текущий вес X", "вешу теперь X"
- Рост: ищи числа с "см", "сантиметр", "height", "рост X", "X см", "мой рост X", "рост сейчас X"
- Пол: 
  * "мужской"/"male"/"мужчина"/"инцел"/"парень" → "male"
  * "женский"/"female"/"женщина"/"девушка" → "female"
  * Если не указан явно, но есть контекстные подсказки - используй их
- Активность: 
  * "малоподвижный"/"сидячий"/"не люблю физические нагрузки"/"не очень люблю физические нагрузки"/"сидячая работа"/"мало двигаюсь" → "sedentary"
  * "лёгкая"/"немного активности"/"пешие прогулки"/"легкие тренировки" → "light"
  * "умеренная"/"средняя"/"регулярные тренировки"/"средняя активность" → "moderate"
  * "высокая"/"активный"/"интенсивные тренировки"/"много двигаюсь" → "active"
  * "очень высокая"/"профессиональный спорт"/"очень активный" → "very_active"
- Цель: 
  * "похудеть"/"сбросить"/"lose"/"хочу похудеть"/"нужно похудеть"/"снизить вес"/"убрать вес"/"сжечь жир" → "lose"
  * "набрать"/"gain"/"набрать вес"/"набрать массу"/"нарастить мышцы" → "gain"
  * "поддержать"/"maintain"/"поддержать вес"/"остаться в текущем весе"/"не менять вес" → "maintain"
- Целевой вес: ищи "до X кг", "хочу весить X", "нужно похудеть до X", "цель X кг", "целевой вес X", "хочу дойти до X", "планирую весить X"
- Имя: извлеки имя если упомянуто ("меня зовут X", "я X", "зови меня X", "мое имя X")

ВАЖНО: Если данных недостаточно - верни null для поля, но извлеки ВСЁ что возможно.

Сообщение пользователя: "${message}"

Верни только JSON, без markdown, без объяснений.`

  try {
    const response = await callLLM(
      [
        {
          id: 'extraction',
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
    
    // Возвращаем данные даже если не все поля заполнены
    // Система сама решит что делать с частичными данными
    return extracted
  } catch (error) {
    console.error('Error extracting user data:', error)
    return null
  }
}

export async function extractMealData(message: string): Promise<ExtractedMealData[] | null> {
  if (!OPENROUTER_API_KEY) return null

  const extractionPrompt = `Проанализируй сообщение пользователя и извлеки информацию о приёмах пищи.
Верни ТОЛЬКО валидный JSON массив объектов без дополнительного текста:
[
  {
    "name": "название блюда",
    "calories": число или null,
    "protein": число или null,
    "fat": число или null,
    "carbs": число или null
  }
]

Правила извлечения:
- Разделяй разные блюда по приёмам пищи (завтрак, обед, ужин, перекус, полдник) или по перечислениям
- Распознавай описания количества: "две порции", "300г", "стакан", "тарелка" - включай в название блюда
- Распознавай время: "на завтрак", "на обед", "на ужин", "утром", "днём", "вечером" - можно включить в название или игнорировать
- Если пользователь описал еду, но не указал КБЖУ - верни null для этих полей (они будут оценены отдельно)
- Если пользователь указал только калории - используй их, остальное null
- Если пользователь указал КБЖУ частично (например только калории и белки) - используй что есть, остальное null
- Распознавай фразы типа "ел", "съел", "поел", "употребил", "принял пищу", "завтракал", "обедал", "ужинал"
- Если еды нет или это не описание еды - верни пустой массив []

Примеры:
"ел овсянку на завтрак, курицу с рисом на обед" → [{"name": "овсянка", ...}, {"name": "курица с рисом", ...}]
"сегодня съел яблоко" → [{"name": "яблоко", ...}]
"на завтрак овсянка 300 ккал, на обед курица с рисом 600 ккал" → [{"name": "овсянка", "calories": 300, ...}, {"name": "курица с рисом", "calories": 600, ...}]
"утром кофе с бутербродом, днём салат, вечером рыба" → [{"name": "кофе с бутербродом", ...}, {"name": "салат", ...}, {"name": "рыба", ...}]
"сегодня ел: омлет из 3 яиц, гречку с курицей, творог 200г" → [{"name": "омлет из 3 яиц", ...}, {"name": "гречка с курицей", ...}, {"name": "творог 200г", ...}]

Сообщение пользователя: "${message}"

Верни только JSON массив, без markdown, без объяснений.`

  try {
    const response = await callLLM(
      [
        {
          id: 'meal-extraction',
          role: 'user',
          content: extractionPrompt,
          timestamp: Date.now(),
        },
      ],
      { apiKey: OPENROUTER_API_KEY },
      undefined
    )

    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return null

    const extracted = JSON.parse(jsonMatch[0])
    return Array.isArray(extracted) && extracted.length > 0 ? extracted : null
  } catch (error) {
    console.error('Error extracting meal data:', error)
    return null
  }
}

export async function parseLLMResponse(
  response: string,
  context: { hasProfile: boolean; hasEntries: boolean }
): Promise<LLMAction> {
  if (!OPENROUTER_API_KEY) {
    return { type: 'none', response }
  }

  const parsePrompt = `Проанализируй ответ ассистента и определи, какое действие нужно выполнить.

Контекст:
- Профиль создан: ${context.hasProfile}
- Есть записи: ${context.hasEntries}

Ответ ассистента: "${response}"

Верни ТОЛЬКО валидный JSON объект:
{
  "action": "create_profile" | "update_profile" | "add_entry" | "show_stats" | "show_goal" | "none",
  "response": "текст ответа для пользователя"
}

Если ассистент упоминает создание профиля или извлечение данных профиля - action: "create_profile"
Если ассистент упоминает добавление записи или еды - action: "add_entry"
Если ассистент упоминает статистику - action: "show_stats"
Если ассистент упоминает цели - action: "show_goal"
Иначе - action: "none"

Верни только JSON, без markdown, без объяснений.`

  try {
    const parseResponse = await callLLM(
      [
        {
          id: 'parse',
          role: 'user',
          content: parsePrompt,
          timestamp: Date.now(),
        },
      ],
      { apiKey: OPENROUTER_API_KEY },
      undefined
    )

    const jsonMatch = parseResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        type: parsed.action || 'none',
        response: parsed.response || response,
      }
    }
  } catch (error) {
    console.error('Error parsing LLM response:', error)
  }

  return { type: 'none', response }
}

