import type { UserProfile, DailyEntry, KBJUGoal } from './types'

/**
 * @deprecated Используй getSystemPrompt из './systemPrompt' вместо этого
 * Этот файл оставлен только для обратной совместимости
 */
export function getIntelligentSystemPrompt(
  profile: UserProfile | null,
  entries: DailyEntry[],
  goal: KBJUGoal | null
): string {
  // Реэкспортируем из нового централизованного файла
  const { getSystemPrompt } = require('./systemPrompt')
  return getSystemPrompt(profile, entries, goal)
}

export function getProactiveSuggestion(
  profile: UserProfile | null,
  entries: DailyEntry[],
  goal: KBJUGoal | null
): string | null {
  if (!profile) {
    return "Привет! Давай создадим твой профиль? Расскажи мне о себе: сколько тебе лет, какой у тебя рост и вес, и какая у тебя цель?"
  }

  if (entries.length === 0) {
    return "Отлично, профиль готов! Хочешь добавить первую запись о питании? Просто опиши что ел сегодня, и я добавлю это в твой дневник."
  }

  const lastEntry = entries[entries.length - 1]
  const daysSinceLastEntry = Math.floor(
    (Date.now() - new Date(lastEntry.date).getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSinceLastEntry > 1) {
    return `Заметил, что ты не добавлял записи уже ${daysSinceLastEntry} ${daysSinceLastEntry === 1 ? 'день' : daysSinceLastEntry < 5 ? 'дня' : 'дней'}. Хочешь добавить сегодняшний приём пищи?`
  }

  return null
}

