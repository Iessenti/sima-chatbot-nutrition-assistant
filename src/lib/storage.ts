import type { UserProfile, DailyEntry, KBJUGoal, ChatMessage, UserContext, ActivityLogEntry } from './types'

const STORAGE_KEYS = {
  PROFILE: 'kbju_profile',
  ENTRIES: 'kbju_entries',
  GOAL: 'kbju_goal',
  CHAT_HISTORY: 'kbju_chat_history',
  USER_CONTEXT: 'kbju_user_context',
  ACTIVITY_LOG: 'kbju_activity_log',
} as const

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile))
  } catch (error) {
    console.error('Failed to save profile:', error)
  }
}

export function getProfile(): UserProfile | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to get profile:', error)
    return null
  }
}

export function saveDailyEntry(entry: DailyEntry): void {
  try {
    const entries = getDailyEntries()
    const existingIndex = entries.findIndex(e => e.id === entry.id)
    
    if (existingIndex >= 0) {
      entries[existingIndex] = entry
    } else {
      entries.push(entry)
    }
    
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries))
  } catch (error) {
    console.error('Failed to save daily entry:', error)
  }
}

export function getDailyEntries(): DailyEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ENTRIES)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Failed to get daily entries:', error)
    return []
  }
}

export function getDailyEntryByDate(date: string): DailyEntry | null {
  const entries = getDailyEntries()
  return entries.find(e => e.date === date) || null
}

export function deleteDailyEntry(entryId: string): void {
  try {
    const entries = getDailyEntries()
    const filtered = entries.filter(e => e.id !== entryId)
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to delete daily entry:', error)
  }
}

export function saveGoal(goal: KBJUGoal): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GOAL, JSON.stringify(goal))
  } catch (error) {
    console.error('Failed to save goal:', error)
  }
}

export function getGoal(): KBJUGoal | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GOAL)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to get goal:', error)
    return null
  }
}

export function saveChatHistory(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages))
  } catch (error) {
    console.error('Failed to save chat history:', error)
  }
}

export function getChatHistory(): ChatMessage[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Failed to get chat history:', error)
    return []
  }
}

export function saveUserContext(context: UserContext): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_CONTEXT, JSON.stringify(context))
  } catch (error) {
    console.error('Failed to save user context:', error)
  }
}

export function getUserContext(): UserContext | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_CONTEXT)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to get user context:', error)
    return null
  }
}

export function saveActivityLogEntry(entry: ActivityLogEntry): void {
  try {
    const entries = getActivityLog()
    entries.push(entry)
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(entries))
  } catch (error) {
    console.error('Failed to save activity log entry:', error)
  }
}

export function getActivityLog(): ActivityLogEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Failed to get activity log:', error)
    return []
  }
}

export function deleteActivityLogEntry(entryId: string): void {
  try {
    const entries = getActivityLog()
    const filtered = entries.filter(e => e.id !== entryId)
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to delete activity log entry:', error)
  }
}

export function clearAllData(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  } catch (error) {
    console.error('Failed to clear all data:', error)
  }
}

