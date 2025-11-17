import { useMemo, useCallback } from 'react'
import { useDataStore } from '@/store/dataStore'
import { calculateKBJUGoal, calculateDailyKBJU, calculateStats } from '@/lib/calculations'
import type { KBJUGoal, DailyEntry } from '@/lib/types'

export function useKBJU() {
  const { profile, entries, goal } = useDataStore()

  const calculatedGoal = useMemo(() => {
    if (!profile) return null
    return calculateKBJUGoal(profile)
  }, [profile])

  const currentGoal = goal || calculatedGoal

  const getDailyKBJU = useCallback((entry: DailyEntry): KBJUGoal => {
    return calculateDailyKBJU(entry)
  }, [])

  const getStats = useCallback((startDate?: string, endDate?: string) => {
    return calculateStats(entries, startDate, endDate)
  }, [entries])

  return {
    goal: currentGoal,
    calculatedGoal,
    getDailyKBJU,
    getStats,
  }
}

