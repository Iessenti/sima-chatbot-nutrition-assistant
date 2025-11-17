export type Gender = 'male' | 'female'

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'

export type Goal = 'lose' | 'maintain' | 'gain'

export interface UserProfile {
  height: number
  weight: number
  age: number
  gender: Gender
  activityLevel: ActivityLevel
  goal: Goal
  targetWeight?: number
}

export interface UserContext {
  name?: string
  preferences?: string[]
  notes?: string
  lastUpdated?: number
}

export interface Meal {
  id: string
  name: string
  calories: number
  protein: number
  fat: number
  carbs: number
}

export interface DailyEntry {
  id: string
  date: string
  meals: Meal[]
  weight?: number
  activityLevel?: ActivityLevel
}

export interface KBJUGoal {
  calories: number
  protein: number
  fat: number
  carbs: number
}

export interface Stats {
  period: {
    start: string
    end: string
  }
  averageWeight?: number
  weightChange?: number
  totalCalories: number
  totalProtein: number
  totalFat: number
  totalCarbs: number
  averageDailyCalories: number
  averageDailyProtein: number
  averageDailyFat: number
  averageDailyCarbs: number
}

export type MessageRole = 'user' | 'assistant'

export type MessageType = 'text' | 'form' | 'data'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  type?: MessageType
  data?: unknown
}

export interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
}

