import type { UserProfile, LLMProfileData } from './types'

/**
 * Умное обновление профиля из извлечённых данных
 * Объединяет существующие данные с новыми, обновляя только те поля, которые были извлечены
 */
export function updateProfileFromExtractedData(
  extractedData: LLMProfileData,
  currentProfile: UserProfile
): UserProfile {
  const updated: UserProfile = {
    ...currentProfile,
  }

  // Обновляем только те поля, которые были извлечены (не null/undefined)
  if (extractedData.height != null) {
    updated.height = extractedData.height
  }
  if (extractedData.weight != null) {
    updated.weight = extractedData.weight
  }
  if (extractedData.age != null) {
    updated.age = extractedData.age
  }
  if (extractedData.gender != null) {
    updated.gender = extractedData.gender
  }
  if (extractedData.activityLevel != null) {
    updated.activityLevel = extractedData.activityLevel
  }
  if (extractedData.goal != null) {
    updated.goal = extractedData.goal
  }
  if (extractedData.targetWeight != null) {
    updated.targetWeight = extractedData.targetWeight
  }

  return updated
}

/**
 * Проверяет, нужно ли пересчитать КБЖУ цели после обновления профиля
 */
export function shouldRecalculateGoal(
  extractedData: LLMProfileData,
  currentProfile: UserProfile
): boolean {
  // Пересчитываем если изменились ключевые параметры
  return (
    (extractedData.weight != null && extractedData.weight !== currentProfile.weight) ||
    (extractedData.height != null && extractedData.height !== currentProfile.height) ||
    (extractedData.age != null && extractedData.age !== currentProfile.age) ||
    (extractedData.gender != null && extractedData.gender !== currentProfile.gender) ||
    (extractedData.activityLevel != null && extractedData.activityLevel !== currentProfile.activityLevel) ||
    (extractedData.goal != null && extractedData.goal !== currentProfile.goal)
  )
}

/**
 * Получает список изменённых полей для сообщения пользователю
 */
export function getChangedFields(
  extractedData: LLMProfileData,
  currentProfile: UserProfile
): string[] {
  const changes: string[] = []

  if (extractedData.height != null && extractedData.height !== currentProfile.height) {
    changes.push(`рост: ${currentProfile.height} → ${extractedData.height} см`)
  }
  if (extractedData.weight != null && extractedData.weight !== currentProfile.weight) {
    changes.push(`вес: ${currentProfile.weight} → ${extractedData.weight} кг`)
  }
  if (extractedData.age != null && extractedData.age !== currentProfile.age) {
    changes.push(`возраст: ${currentProfile.age} → ${extractedData.age} лет`)
  }
  if (extractedData.gender != null && extractedData.gender !== currentProfile.gender) {
    changes.push(`пол: ${currentProfile.gender === 'male' ? 'мужской' : 'женский'} → ${extractedData.gender === 'male' ? 'мужской' : 'женский'}`)
  }
  if (extractedData.activityLevel != null && extractedData.activityLevel !== currentProfile.activityLevel) {
    changes.push(`активность: ${currentProfile.activityLevel} → ${extractedData.activityLevel}`)
  }
  if (extractedData.goal != null && extractedData.goal !== currentProfile.goal) {
    const goalNames = { lose: 'похудение', maintain: 'поддержание', gain: 'набор веса' }
    changes.push(`цель: ${goalNames[currentProfile.goal]} → ${goalNames[extractedData.goal]}`)
  }
  if (extractedData.targetWeight != null && extractedData.targetWeight !== currentProfile.targetWeight) {
    changes.push(`целевой вес: ${currentProfile.targetWeight || 'не указан'} → ${extractedData.targetWeight} кг`)
  }

  return changes
}

