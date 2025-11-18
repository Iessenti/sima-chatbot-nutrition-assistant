import type { Activity, ActivityType } from './types'

const MET_VALUES: Record<ActivityType, number> = {
  walking: 3.0,
  running: 8.0,
  gym: 5.0,
  cycling: 6.0,
  other: 4.0,
}

const MET_VALUES_DETAILED: Record<string, number> = {
  'walking_slow': 2.0,
  'walking_normal': 3.0,
  'walking_fast': 4.0,
  'running_slow': 8.0,
  'running_normal': 10.0,
  'running_fast': 12.0,
  'cycling_slow': 4.0,
  'cycling_normal': 6.0,
  'cycling_fast': 8.0,
  'gym_light': 3.0,
  'gym_moderate': 5.0,
  'gym_intense': 8.0,
}

export function calculateActivityCalories(
  activity: Activity,
  userWeight: number
): number {
  if (activity.calories !== undefined && activity.calories !== null) {
    return activity.calories
  }

  if (!activity.duration) {
    return 0
  }

  const met = getMETValue(activity)
  const hours = activity.duration / 60
  const calories = met * userWeight * hours

  return Math.round(calories)
}

function getMETValue(activity: Activity): number {
  const baseMET = MET_VALUES[activity.type]

  if (activity.description) {
    const desc = activity.description.toLowerCase()
    
    if (desc.includes('быстро') || desc.includes('интенсивно') || desc.includes('быстрый')) {
      if (activity.type === 'running') return MET_VALUES_DETAILED['running_fast'] || 12.0
      if (activity.type === 'walking') return MET_VALUES_DETAILED['walking_fast'] || 4.0
      if (activity.type === 'cycling') return MET_VALUES_DETAILED['cycling_fast'] || 8.0
      if (activity.type === 'gym') return MET_VALUES_DETAILED['gym_intense'] || 8.0
    }
    
    if (desc.includes('медленно') || desc.includes('легко') || desc.includes('легкий')) {
      if (activity.type === 'running') return MET_VALUES_DETAILED['running_slow'] || 8.0
      if (activity.type === 'walking') return MET_VALUES_DETAILED['walking_slow'] || 2.0
      if (activity.type === 'cycling') return MET_VALUES_DETAILED['cycling_slow'] || 4.0
      if (activity.type === 'gym') return MET_VALUES_DETAILED['gym_light'] || 3.0
    }
  }

  return baseMET
}

export function estimateActivityDurationFromDistance(
  activityType: ActivityType,
  distanceKm?: number
): number | null {
  if (!distanceKm) return null

  const averageSpeeds: Record<ActivityType, number> = {
    walking: 5,
    running: 10,
    cycling: 15,
    gym: 0,
    other: 0,
  }

  const speed = averageSpeeds[activityType]
  if (speed === 0) return null

  const hours = distanceKm / speed
  return Math.round(hours * 60)
}

