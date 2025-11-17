import type { UserContext } from './types'
import { callLLM } from './openrouter'

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ''

/**
 * Извлекает контекст из сообщения (имя, предпочтения, заметки)
 */
export async function extractContext(message: string): Promise<Partial<UserContext> | null> {
  if (!OPENROUTER_API_KEY) return null

  const extractionPrompt = `Проанализируй сообщение пользователя и извлеки контекстную информацию.
Верни ТОЛЬКО валидный JSON объект без дополнительного текста с полями:
{
  "name": строка или null (имя пользователя, если упомянуто),
  "preferences": массив строк или null (предпочтения в питании, диетические ограничения),
  "notes": строка или null (важные заметки о пользователе, которые стоит запомнить)
}

Правила извлечения:
- Имя: ищи фразы "меня зовут X", "я X", "мое имя X", "call me X", "зови меня X", "меня зовут X, но можно X"
- Предпочтения: ищи упоминания:
  * Диетические ограничения: "вегетарианец", "веган", "не ем мясо", "не ем молочное", "без глютена", "безлактозное"
  * Аллергии: "аллергия на X", "не переношу X", "не могу есть X"
  * Предпочтения в еде: "люблю X", "не люблю X", "предпочитаю X", "не ем X"
  * Режим питания: "интервальное голодание", "кето", "палео", "low carb"
- Заметки: важная информация о пользователе:
  * Ситуация: "живу с мамой", "работаю из дома", "студент", "спортсмен"
  * Цели и мотивация: "хочу похудеть к лету", "готовлюсь к соревнованиям", "по рекомендации врача"
  * Особенности: "не люблю готовить", "ем только дома", "часто в командировках"
  * Медицинские: "диабет", "гипертония", "проблемы с ЖКТ" (но не детали, только общее)

Если информации нет - верни null для поля. Если есть несколько предпочтений - верни массив строк.

Сообщение пользователя: "${message}"

Верни только JSON, без markdown, без объяснений.`

  try {
    const response = await callLLM(
      [
        {
          id: 'context-extraction',
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
    
    // Проверяем, есть ли хоть какая-то информация
    const hasData = extracted.name || 
                   (extracted.preferences && extracted.preferences.length > 0) || 
                   extracted.notes

    return hasData ? extracted : null
  } catch (error) {
    console.error('Error extracting context:', error)
    return null
  }
}

