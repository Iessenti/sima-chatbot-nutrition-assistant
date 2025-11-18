import { z } from 'zod'

export const UserProfileSchema = z.object({
  height: z.number().min(100).max(250),
  weight: z.number().min(30).max(300),
  age: z.number().min(10).max(120),
  gender: z.enum(['male', 'female']),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  goal: z.enum(['lose', 'maintain', 'gain']),
  targetWeight: z.number().min(30).max(300).optional(),
})

export const MealSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  calories: z.number().min(0),
  protein: z.number().min(0),
  fat: z.number().min(0),
  carbs: z.number().min(0),
})

export const ActivitySchema = z.object({
  type: z.enum(['walking', 'running', 'gym', 'cycling', 'other']),
  duration: z.number().min(0).optional(),
  calories: z.number().min(0).optional(),
  description: z.string().optional(),
})

export const DailyEntrySchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meals: z.array(MealSchema),
  weight: z.number().min(30).max(300).optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
  activity: ActivitySchema.optional(),
})

export const KBJUGoalSchema = z.object({
  calories: z.number().min(0),
  protein: z.number().min(0),
  fat: z.number().min(0),
  carbs: z.number().min(0),
})

export function validateProfile(data: unknown): { success: boolean; data?: any; error?: string } {
  try {
    const validated = UserProfileSchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') }
    }
    return { success: false, error: 'Ошибка валидации профиля' }
  }
}

export function validateEntry(data: unknown): { success: boolean; data?: any; error?: string } {
  try {
    const validated = DailyEntrySchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') }
    }
    return { success: false, error: 'Ошибка валидации записи' }
  }
}

export function validateGoal(data: unknown): { success: boolean; data?: any; error?: string } {
  try {
    const validated = KBJUGoalSchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') }
    }
    return { success: false, error: 'Ошибка валидации цели' }
  }
}

