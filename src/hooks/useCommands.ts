import { useCallback } from 'react'
import { useDataStore } from '@/store/dataStore'
import { useChatStore } from '@/store/chatStore'
import { calculateKBJUGoal, calculateStats } from '@/lib/calculations'
import { parseCommand, detectIntent } from '@/lib/commandHandler'
import { clearAllData } from '@/lib/storage'
import type { DailyEntry } from '@/lib/types'

export function useCommands() {
  const { profile, setProfile, addEntry, setGoal, entries } = useDataStore()
  const { addMessage } = useChatStore()

  const handleCommand = useCallback(
    (command: string, message: string): boolean => {
      const cmd = parseCommand(message) || detectIntent(message)

      if (!cmd) return false

      switch (cmd) {
        case 'start': {
          if (profile) {
            addMessage({
              id: `cmd-${Date.now()}`,
              role: 'assistant',
              content: `У тебя уже есть профиль. Используй /profile для просмотра или изменения.`,
              timestamp: Date.now(),
            })
          } else {
            addMessage({
              id: `cmd-${Date.now()}`,
              role: 'assistant',
              content: `Давай создадим твой профиль! Мне нужно узнать:
- Рост (см)
- Вес (кг)
- Возраст
- Пол
- Уровень активности
- Цель (похудение/поддержание/набор)

Напиши эти данные, или я могу задать вопросы по очереди.`,
              timestamp: Date.now(),
            })
          }
          return true
        }

        case 'profile': {
          if (!profile) {
            addMessage({
              id: `cmd-${Date.now()}`,
              role: 'assistant',
              content: `У тебя ещё нет профиля. Используй /start для создания.`,
              timestamp: Date.now(),
            })
          } else {
            const goal = calculateKBJUGoal(profile)
            addMessage({
              id: `cmd-${Date.now()}`,
              role: 'assistant',
              content: `Твой профиль:
- Рост: ${profile.height} см
- Вес: ${profile.weight} кг
- Возраст: ${profile.age} лет
- Пол: ${profile.gender === 'male' ? 'мужской' : 'женский'}
- Активность: ${profile.activityLevel}
- Цель: ${profile.goal === 'lose' ? 'похудение' : profile.goal === 'gain' ? 'набор веса' : 'поддержание'}

Целевые КБЖУ:
- Калории: ${goal.calories} ккал
- Белки: ${goal.protein} г
- Жиры: ${goal.fat} г
- Углеводы: ${goal.carbs} г

Напиши, что хочешь изменить.`,
              timestamp: Date.now(),
            })
          }
          return true
        }

        case 'update': {
          addMessage({
            id: `cmd-${Date.now()}`,
            role: 'assistant',
            content: `Добавим запись за день. Напиши:
- Приёмы пищи (название и КБЖУ)
- Текущий вес (если измерял)

Или просто опиши, что ел сегодня, и я помогу рассчитать.`,
            timestamp: Date.now(),
          })
          return true
        }

        case 'stats': {
          if (entries.length === 0) {
            addMessage({
              id: `cmd-${Date.now()}`,
              role: 'assistant',
              content: `У тебя ещё нет записей. Используй /update для добавления.`,
              timestamp: Date.now(),
            })
          } else {
            const stats = calculateStats(entries)
            addMessage({
              id: `cmd-${Date.now()}`,
              role: 'assistant',
              content: `Статистика за период:
- Всего записей: ${entries.length}
- Средний вес: ${stats.averageWeight?.toFixed(1) || 'N/A'} кг
${stats.weightChange ? `- Изменение веса: ${stats.weightChange > 0 ? '+' : ''}${stats.weightChange.toFixed(1)} кг` : ''}
- Средне за день:
  • Калории: ${stats.averageDailyCalories} ккал
  • Белки: ${stats.averageDailyProtein} г
  • Жиры: ${stats.averageDailyFat} г
  • Углеводы: ${stats.averageDailyCarbs} г`,
              timestamp: Date.now(),
            })
          }
          return true
        }

        case 'goal': {
          if (!profile) {
            addMessage({
              id: `cmd-${Date.now()}`,
              role: 'assistant',
              content: `Сначала создай профиль через /start`,
              timestamp: Date.now(),
            })
          } else {
            const goal = calculateKBJUGoal(profile)
            setGoal(goal)
            addMessage({
              id: `cmd-${Date.now()}`,
              role: 'assistant',
              content: `Твои текущие цели:
- Калории: ${goal.calories} ккал
- Белки: ${goal.protein} г
- Жиры: ${goal.fat} г
- Углеводы: ${goal.carbs} г

Чтобы изменить цели, измени профиль через /profile`,
              timestamp: Date.now(),
            })
          }
          return true
        }

        case 'help': {
          addMessage({
            id: `cmd-${Date.now()}`,
            role: 'assistant',
            content: `Доступные команды:
/start - создать профиль
/profile - просмотреть/изменить профиль
/update - добавить запись за день
/stats - показать статистику
/goal - показать цели КБЖУ
/reset - сбросить все данные
/help - показать эту справку

Ты также можешь просто писать мне естественным языком, и я пойму, что ты хочешь сделать!`,
            timestamp: Date.now(),
          })
          return true
        }

        case 'reset': {
          addMessage({
            id: `cmd-${Date.now()}`,
            role: 'assistant',
            content: `⚠️ Внимание! Это удалит все данные: профиль, записи, цели, историю чата.

Напиши "подтверждаю" или "да" для подтверждения, или "отмена" для отмены.`,
            timestamp: Date.now(),
          })
          return true
        }

        default:
          return false
      }
    },
    [profile, entries, setProfile, addEntry, setGoal, addMessage]
  )

  const handleResetConfirmation = useCallback(
    (confirmed: boolean) => {
      if (confirmed) {
        clearAllData()
        useDataStore.getState().loadData()
        useChatStore.getState().clearChat()
        addMessage({
          id: `cmd-${Date.now()}`,
          role: 'assistant',
          content: `Все данные удалены. Используй /start для создания нового профиля.`,
          timestamp: Date.now(),
        })
      } else {
        addMessage({
          id: `cmd-${Date.now()}`,
          role: 'assistant',
          content: `Отменено. Данные сохранены.`,
          timestamp: Date.now(),
        })
      }
    },
    [addMessage]
  )

  return {
    handleCommand,
    handleResetConfirmation,
  }
}

