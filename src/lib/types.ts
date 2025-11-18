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

export type ActivityType = 'walking' | 'running' | 'gym' | 'cycling' | 'other'

export interface Activity {
  type: ActivityType
  duration?: number
  calories?: number
  description?: string
}

export interface DailyEntry {
  id: string
  date: string
  meals: Meal[]
  weight?: number
  activityLevel?: ActivityLevel
  activity?: Activity
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

export type ActivityLogActionType =
  | 'profile_created'
  | 'profile_updated'
  | 'meal_added'
  | 'weight_recorded'
  | 'activity_recorded'
  | 'goal_updated'
  | 'context_updated'

export interface ActivityLogEntry {
  id: string
  timestamp: number
  date: string
  actionType: ActivityLogActionType
  description: string
  data?: {
    profile?: Partial<UserProfile>
    meals?: Meal[]
    weight?: number
    activity?: Activity
    goal?: Partial<KBJUGoal>
    context?: Partial<UserContext>
  }
  messageId?: string
}

export type LLMAction = 
  | 'create_profile'
  | 'update_profile'
  | 'add_entry'
  | 'update_goal'
  | 'show_stats'
  | 'show_goal'
  | 'general'

export interface LLMProfileData {
  height?: number
  weight?: number
  age?: number
  gender?: Gender
  activityLevel?: ActivityLevel
  goal?: Goal
  targetWeight?: number
}

export interface LLMMealData {
  name: string
  calories?: number
  protein?: number
  fat?: number
  carbs?: number
}

export interface LLMGoalData {
  calories?: number
  protein?: number
  fat?: number
  carbs?: number
}

export interface LLMContextData {
  name?: string
  preferences?: string[]
  notes?: string
}

export interface LLMResponse {
  action: LLMAction
  data?: {
    profile?: LLMProfileData
    meals?: LLMMealData[]
    weight?: number
    activity?: {
      type: ActivityType
      duration?: number
      calories?: number
      description?: string
    }
    goal?: LLMGoalData
    context?: LLMContextData
    targetDate?: string
  }
  response: string
}

