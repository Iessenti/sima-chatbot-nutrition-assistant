import type { UserProfile, DailyEntry, KBJUGoal, Stats, ActivityLevel } from './types'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

export function calculateBMR(profile: UserProfile): number {
  const { weight, height, age, gender } = profile
  
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161
  }
}

export function calculateTDEE(profile: UserProfile): number {
  const bmr = calculateBMR(profile)
  const multiplier = ACTIVITY_MULTIPLIERS[profile.activityLevel]
  return Math.round(bmr * multiplier)
}

export function calculateKBJUGoal(profile: UserProfile): KBJUGoal {
  const tdee = calculateTDEE(profile)
  let targetCalories = tdee
  
  if (profile.goal === 'lose') {
    targetCalories = Math.round(tdee * 0.85)
  } else if (profile.goal === 'gain') {
    targetCalories = Math.round(tdee * 1.15)
  }
  
  const protein = Math.round(targetCalories * 0.3 / 4)
  const fat = Math.round(targetCalories * 0.25 / 9)
  const carbs = Math.round((targetCalories - protein * 4 - fat * 9) / 4)
  
  return {
    calories: targetCalories,
    protein,
    fat,
    carbs,
  }
}

export function calculateDailyKBJU(entry: DailyEntry): KBJUGoal {
  const total = entry.meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      fat: acc.fat + meal.fat,
      carbs: acc.carbs + meal.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  )
  
  return {
    calories: Math.round(total.calories),
    protein: Math.round(total.protein),
    fat: Math.round(total.fat),
    carbs: Math.round(total.carbs),
  }
}

export function calculateStats(entries: DailyEntry[], startDate?: string, endDate?: string): Stats {
  let filteredEntries = entries
  
  if (startDate || endDate) {
    filteredEntries = entries.filter(entry => {
      const entryDate = parseISO(entry.date)
      if (startDate && entryDate < parseISO(startDate)) return false
      if (endDate && entryDate > parseISO(endDate)) return false
      return true
    })
  }
  
  if (filteredEntries.length === 0) {
    const now = new Date().toISOString()
    return {
      period: {
        start: startDate || now,
        end: endDate || now,
      },
      totalCalories: 0,
      totalProtein: 0,
      totalFat: 0,
      totalCarbs: 0,
      averageDailyCalories: 0,
      averageDailyProtein: 0,
      averageDailyFat: 0,
      averageDailyCarbs: 0,
    }
  }
  
  const weights = filteredEntries.filter(e => e.weight).map(e => e.weight!)
  const averageWeight = weights.length > 0
    ? weights.reduce((a, b) => a + b, 0) / weights.length
    : undefined
  
  const weightChange = weights.length >= 2
    ? weights[weights.length - 1] - weights[0]
    : undefined
  
  const totals = filteredEntries.reduce(
    (acc, entry) => {
      const daily = calculateDailyKBJU(entry)
      return {
        calories: acc.calories + daily.calories,
        protein: acc.protein + daily.protein,
        fat: acc.fat + daily.fat,
        carbs: acc.carbs + daily.carbs,
      }
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  )
  
  const days = filteredEntries.length
  
  return {
    period: {
      start: startDate || filteredEntries[0].date,
      end: endDate || filteredEntries[filteredEntries.length - 1].date,
    },
    averageWeight,
    weightChange,
    totalCalories: Math.round(totals.calories),
    totalProtein: Math.round(totals.protein),
    totalFat: Math.round(totals.fat),
    totalCarbs: Math.round(totals.carbs),
    averageDailyCalories: Math.round(totals.calories / days),
    averageDailyProtein: Math.round(totals.protein / days),
    averageDailyFat: Math.round(totals.fat / days),
    averageDailyCarbs: Math.round(totals.carbs / days),
  }
}

export function formatDataForLLM(profile: UserProfile | null, entries: DailyEntry[], goal: KBJUGoal | null): string {
  const parts: string[] = []
  
  if (profile) {
    parts.push(`Профиль пользователя:
- Рост: ${profile.height} см
- Вес: ${profile.weight} кг
- Возраст: ${profile.age} лет
- Пол: ${profile.gender === 'male' ? 'мужской' : 'женский'}
- Уровень активности: ${profile.activityLevel}
- Цель: ${profile.goal === 'lose' ? 'похудение' : profile.goal === 'gain' ? 'набор веса' : 'поддержание веса'}
${profile.targetWeight ? `- Целевой вес: ${profile.targetWeight} кг` : ''}`)
  }
  
  if (goal) {
    parts.push(`Целевые КБЖУ:
- Калории: ${goal.calories} ккал
- Белки: ${goal.protein} г
- Жиры: ${goal.fat} г
- Углеводы: ${goal.carbs} г`)
  }
  
  if (entries.length > 0) {
    const recentEntries = entries.slice(-7)
    parts.push(`Последние записи (${recentEntries.length} из ${entries.length}):`)
    recentEntries.forEach(entry => {
      const daily = calculateDailyKBJU(entry)
      parts.push(`\n${entry.date}:
- Калории: ${daily.calories} ккал
- Белки: ${daily.protein} г
- Жиры: ${daily.fat} г
- Углеводы: ${daily.carbs} г
${entry.weight ? `- Вес: ${entry.weight} кг` : ''}`)
    })
  }
  
  return parts.join('\n\n')
}

