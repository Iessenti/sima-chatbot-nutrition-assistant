import { create } from 'zustand'
import type { UserProfile, DailyEntry, KBJUGoal, UserContext } from '@/lib/types'
import {
  getProfile,
  saveProfile,
  getDailyEntries,
  saveDailyEntry,
  getGoal,
  saveGoal,
  getUserContext,
  saveUserContext,
} from '@/lib/storage'

interface DataStore {
  profile: UserProfile | null
  entries: DailyEntry[]
  goal: KBJUGoal | null
  context: UserContext | null
  setProfile: (profile: UserProfile) => void
  updateProfile: (updates: Partial<UserProfile>) => void
  addEntry: (entry: DailyEntry) => void
  updateEntry: (entry: DailyEntry) => void
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
    saveDailyEntry(entry)
    set((state) => ({
      entries: [...state.entries, entry],
    }))
  },
  
  updateEntry: (entry) => {
    saveDailyEntry(entry)
    set((state) => ({
      entries: state.entries.map((e) => (e.id === entry.id ? entry : e)),
    }))
  },
  
  setGoal: (goal) => {
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

