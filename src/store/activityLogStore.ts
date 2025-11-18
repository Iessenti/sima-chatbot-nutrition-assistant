import { create } from 'zustand'
import type { ActivityLogEntry, ActivityLogActionType } from '@/lib/types'
import {
  getActivityLog,
  saveActivityLogEntry,
  deleteActivityLogEntry,
} from '@/lib/storage'

interface ActivityLogStore {
  entries: ActivityLogEntry[]
  addEntry: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp' | 'date'>) => void
  deleteEntry: (entryId: string) => void
  loadLog: () => void
  getEntriesByDate: (date: string) => ActivityLogEntry[]
  getEntriesByType: (type: ActivityLogActionType) => ActivityLogEntry[]
  getRecentEntries: (limit?: number) => ActivityLogEntry[]
}

export const useActivityLogStore = create<ActivityLogStore>((set, get) => ({
  entries: [],

  addEntry: (entryData) => {
    const now = Date.now()
    const date = new Date(now).toISOString().split('T')[0]
    const entry: ActivityLogEntry = {
      id: `log-${now}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      date,
      ...entryData,
    }
    saveActivityLogEntry(entry)
    set((state) => ({
      entries: [...state.entries, entry].sort((a, b) => b.timestamp - a.timestamp),
    }))
  },

  deleteEntry: (entryId) => {
    deleteActivityLogEntry(entryId)
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== entryId),
    }))
  },

  loadLog: () => {
    const entries = getActivityLog()
    set({ entries: entries.sort((a, b) => b.timestamp - a.timestamp) })
  },

  getEntriesByDate: (date) => {
    return get().entries.filter((e) => e.date === date)
  },

  getEntriesByType: (type) => {
    return get().entries.filter((e) => e.actionType === type)
  },

  getRecentEntries: (limit = 10) => {
    return get().entries.slice(0, limit)
  },
}))

