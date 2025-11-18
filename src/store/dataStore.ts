import { create } from 'zustand'
import type { UserProfile, DailyEntry, KBJUGoal, UserContext } from '@/lib/types'
import {
  getProfile,
  saveProfile,
  getDailyEntries,
  saveDailyEntry,
  deleteDailyEntry,
  getGoal,
  saveGoal,
  getUserContext,
  saveUserContext,
} from '@/lib/storage'
import { validateProfile, validateEntry, validateGoal } from '@/lib/validation'
import { showToast } from '@/components/Toast'

interface DataStore {
  profile: UserProfile | null
  entries: DailyEntry[]
  goal: KBJUGoal | null
  context: UserContext | null
  setProfile: (profile: UserProfile) => void
  updateProfile: (updates: Partial<UserProfile>) => void
  addEntry: (entry: DailyEntry) => void
  updateEntry: (entry: DailyEntry) => void
  deleteEntry: (entryId: string) => void
  setGoal: (goal: KBJUGoal) => void
  updateContext: (updates: Partial<UserContext>) => void
  loadData: () => void
}

export const useDataStore = create<DataStore>((set, get) => ({
  profile: null,
  entries: [],
  goal: null,
  context: null,
  
  setProfile: (profile) => {
    const validation = validateProfile(profile)
    if (!validation.success) {
      showToast(`Ошибка валидации профиля: ${validation.error}`, 'error')
      return
    }
    saveProfile(profile)
    set({ profile })
  },
  
  updateProfile: (updates) => {
    const currentProfile = get().profile
    if (!currentProfile) return
    
    const updatedProfile: UserProfile = {
      ...currentProfile,
      ...updates,
    }
    saveProfile(updatedProfile)
    set({ profile: updatedProfile })
  },
  
  addEntry: (entry) => {
    const validation = validateEntry(entry)
    if (!validation.success) {
      showToast(`Ошибка валидации записи: ${validation.error}`, 'error')
      return
    }
    saveDailyEntry(entry)
    set((state) => ({
      entries: [...state.entries, entry],
    }))
  },
  
  updateEntry: (entry) => {
    const validation = validateEntry(entry)
    if (!validation.success) {
      showToast(`Ошибка валидации записи: ${validation.error}`, 'error')
      return
    }
    saveDailyEntry(entry)
    set((state) => ({
      entries: state.entries.map((e) => (e.id === entry.id ? entry : e)),
    }))
  },
  
  deleteEntry: (entryId) => {
    deleteDailyEntry(entryId)
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== entryId),
    }))
  },
  
  setGoal: (goal) => {
    const validation = validateGoal(goal)
    if (!validation.success) {
      showToast(`Ошибка валидации цели: ${validation.error}`, 'error')
      return
    }
    saveGoal(goal)
    set({ goal })
  },
  
  updateContext: (updates) => {
    const currentContext = get().context || {}
    const updatedContext: UserContext = {
      ...currentContext,
      ...updates,
      lastUpdated: Date.now(),
    }
    saveUserContext(updatedContext)
    set({ context: updatedContext })
  },
  
  loadData: () => {
    const profile = getProfile()
    const entries = getDailyEntries()
    const goal = getGoal()
    const context = getUserContext()
    set({ profile, entries, goal, context })
  },
}))

