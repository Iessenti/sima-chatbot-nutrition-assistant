import type { ChatMessage } from './types'

export type Command = 'start' | 'profile' | 'update' | 'stats' | 'goal' | 'help' | 'reset'

export function parseCommand(message: string): Command | null {
  const trimmed = message.trim().toLowerCase()
  
  if (trimmed.startsWith('/start')) return 'start'
  if (trimmed.startsWith('/profile')) return 'profile'
  if (trimmed.startsWith('/update')) return 'update'
  if (trimmed.startsWith('/stats')) return 'stats'
  if (trimmed.startsWith('/goal')) return 'goal'
  if (trimmed.startsWith('/help')) return 'help'
  if (trimmed.startsWith('/reset')) return 'reset'
  
  return null
}

export function detectIntent(message: string): Command | null {
  const lower = message.toLowerCase()
  
  if (
    lower.includes('начать') ||
    lower.includes('старт') ||
    lower.includes('опрос') ||
    lower.includes('профиль') && (lower.includes('создать') || lower.includes('заполнить'))
  ) {
    return 'start'
  }
  
  if (
    lower.includes('профиль') ||
    lower.includes('данные') ||
    lower.includes('информация обо мне')
  ) {
    return 'profile'
  }
  
  if (
    lower.includes('добавить') ||
    lower.includes('записать') ||
    lower.includes('еда') ||
    lower.includes('приём пищи') ||
    lower.includes('обед') ||
    lower.includes('завтрак') ||
    lower.includes('ужин')
  ) {
    return 'update'
  }
  
  if (
    lower.includes('статистика') ||
    lower.includes('статистику') ||
    lower.includes('прогресс') ||
    lower.includes('результаты')
  ) {
    return 'stats'
  }
  
  if (
    lower.includes('цель') ||
    lower.includes('цели') ||
    lower.includes('изменить цель')
  ) {
    return 'goal'
  }
  
  if (
    lower.includes('помощь') ||
    lower.includes('справка') ||
    lower.includes('команды') ||
    lower.includes('что умеешь')
  ) {
    return 'help'
  }
  
  if (
    lower.includes('сбросить') ||
    lower.includes('очистить') ||
    lower.includes('удалить все')
  ) {
    return 'reset'
  }
  
  return null
}

export function getCommandDescription(command: Command): string {
  const descriptions: Record<Command, string> = {
    start: 'Начать опрос профиля — заполнить данные о росте, весе, возрасте, уровне активности и цели',
    profile: 'Просмотреть или изменить профиль пользователя',
    update: 'Добавить запись за день — приёмы пищи, вес, активность',
    stats: 'Показать статистику по питанию и весу за период',
    goal: 'Изменить цели по весу и пересчитать КБЖУ',
    help: 'Показать справку по командам и использованию',
    reset: 'Сбросить все данные (требует подтверждения)',
  }
  return descriptions[command]
}

