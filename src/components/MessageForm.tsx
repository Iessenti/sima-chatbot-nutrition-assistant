import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { UserProfile, DailyEntry, Meal, Gender, ActivityLevel, Goal } from '@/lib/types'

interface StartFormProps {
  onSubmit: (profile: UserProfile) => void
}

export function StartForm({ onSubmit }: StartFormProps) {
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    height: 170,
    weight: 70,
    age: 30,
    gender: 'male',
    activityLevel: 'moderate',
    goal: 'maintain',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      formData.height &&
      formData.weight &&
      formData.age &&
      formData.gender &&
      formData.activityLevel &&
      formData.goal
    ) {
      onSubmit({
        height: formData.height,
        weight: formData.weight,
        age: formData.age,
        gender: formData.gender,
        activityLevel: formData.activityLevel,
        goal: formData.goal,
      })
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Создание профиля</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="height">Рост (см)</Label>
            <Input
              id="height"
              type="number"
              value={formData.height}
              onChange={(e) =>
                setFormData({ ...formData, height: parseInt(e.target.value) })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">Вес (кг)</Label>
            <Input
              id="weight"
              type="number"
              value={formData.weight}
              onChange={(e) =>
                setFormData({ ...formData, weight: parseFloat(e.target.value) })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Возраст</Label>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) =>
                setFormData({ ...formData, age: parseInt(e.target.value) })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Пол</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value as Gender })
                  }
                />
                Мужской
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value as Gender })
                  }
                />
                Женский
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activityLevel">Уровень активности</Label>
            <select
              id="activityLevel"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.activityLevel}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  activityLevel: e.target.value as ActivityLevel,
                })
              }
              required
            >
              <option value="sedentary">Малоподвижный</option>
              <option value="light">Лёгкая активность</option>
              <option value="moderate">Умеренная активность</option>
              <option value="active">Высокая активность</option>
              <option value="very_active">Очень высокая активность</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Цель</Label>
            <select
              id="goal"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.goal}
              onChange={(e) =>
                setFormData({ ...formData, goal: e.target.value as Goal })
              }
              required
            >
              <option value="lose">Похудение</option>
              <option value="maintain">Поддержание веса</option>
              <option value="gain">Набор веса</option>
            </select>
          </div>

          <Button type="submit" className="w-full">
            Сохранить профиль
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

interface UpdateFormProps {
  onSubmit: (entry: DailyEntry) => void
  date?: string
}

export function UpdateForm({ onSubmit, date }: UpdateFormProps) {
  const [meals, setMeals] = useState<Meal[]>([])
  const [currentMeal, setCurrentMeal] = useState<Partial<Meal>>({
    name: '',
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  })
  const [weight, setWeight] = useState<number | undefined>()

  const handleAddMeal = () => {
    if (currentMeal.name && currentMeal.calories !== undefined) {
      const meal: Meal = {
        id: `meal-${Date.now()}`,
        name: currentMeal.name,
        calories: currentMeal.calories || 0,
        protein: currentMeal.protein || 0,
        fat: currentMeal.fat || 0,
        carbs: currentMeal.carbs || 0,
      }
      setMeals([...meals, meal])
      setCurrentMeal({
        name: '',
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const entry: DailyEntry = {
      id: `entry-${Date.now()}`,
      date: date || new Date().toISOString().split('T')[0],
      meals,
      weight,
    }
    onSubmit(entry)
    setMeals([])
    setWeight(undefined)
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Добавить запись</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Вес (кг, опционально)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={weight || ''}
              onChange={(e) =>
                setWeight(e.target.value ? parseFloat(e.target.value) : undefined)
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Приёмы пищи</Label>
            <div className="space-y-2 border p-2 rounded-md">
              {meals.map((meal) => (
                <div key={meal.id} className="text-sm">
                  {meal.name}: {meal.calories} ккал
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Название блюда"
                value={currentMeal.name}
                onChange={(e) =>
                  setCurrentMeal({ ...currentMeal, name: e.target.value })
                }
              />
              <Input
                type="number"
                placeholder="Калории"
                value={currentMeal.calories || ''}
                onChange={(e) =>
                  setCurrentMeal({
                    ...currentMeal,
                    calories: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <Input
                type="number"
                step="0.1"
                placeholder="Белки (г)"
                value={currentMeal.protein || ''}
                onChange={(e) =>
                  setCurrentMeal({
                    ...currentMeal,
                    protein: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <Input
                type="number"
                step="0.1"
                placeholder="Жиры (г)"
                value={currentMeal.fat || ''}
                onChange={(e) =>
                  setCurrentMeal({
                    ...currentMeal,
                    fat: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <Input
                type="number"
                step="0.1"
                placeholder="Углеводы (г)"
                value={currentMeal.carbs || ''}
                onChange={(e) =>
                  setCurrentMeal({
                    ...currentMeal,
                    carbs: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <Button type="button" onClick={handleAddMeal} variant="outline">
                Добавить
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={meals.length === 0}>
            Сохранить запись
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

