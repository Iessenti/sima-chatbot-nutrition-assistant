import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DailyEntry, Meal } from '@/lib/types'
import { useDataStore } from '@/store/dataStore'
import { X } from 'lucide-react'

interface EntryEditorProps {
  entry: DailyEntry
  onClose: () => void
  onDelete: () => void
}

export function EntryEditor({ entry, onClose, onDelete }: EntryEditorProps) {
  const { updateEntry } = useDataStore()
  const [meals, setMeals] = useState<Meal[]>(entry.meals)
  const [weight, setWeight] = useState<number | undefined>(entry.weight)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [newMeal, setNewMeal] = useState<Partial<Meal>>({
    name: '',
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  })

  const handleSave = () => {
    const updatedEntry: DailyEntry = {
      ...entry,
      meals,
      weight,
    }
    updateEntry(updatedEntry)
    onClose()
  }

  const handleDeleteMeal = (mealId: string) => {
    setMeals(meals.filter(m => m.id !== mealId))
  }

  const handleAddMeal = () => {
    if (newMeal.name && newMeal.calories !== undefined) {
      const meal: Meal = {
        id: `meal-${Date.now()}`,
        name: newMeal.name,
        calories: newMeal.calories || 0,
        protein: newMeal.protein || 0,
        fat: newMeal.fat || 0,
        carbs: newMeal.carbs || 0,
      }
      setMeals([...meals, meal])
      setNewMeal({
        name: '',
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
      })
    }
  }

  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal)
    setNewMeal({
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      fat: meal.fat,
      carbs: meal.carbs,
    })
  }

  const handleUpdateMeal = () => {
    if (editingMeal && newMeal.name) {
      setMeals(meals.map(m => 
        m.id === editingMeal.id 
          ? {
              ...m,
              name: newMeal.name!,
              calories: newMeal.calories || 0,
              protein: newMeal.protein || 0,
              fat: newMeal.fat || 0,
              carbs: newMeal.carbs || 0,
            }
          : m
      ))
      setEditingMeal(null)
      setNewMeal({
        name: '',
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
      })
    }
  }

  const handleDelete = () => {
    if (confirm('Удалить эту запись?')) {
      onDelete()
      onClose()
    }
  }

  const totalKBJU = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      fat: acc.fat + meal.fat,
      carbs: acc.carbs + meal.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Редактировать запись за {entry.date}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Вес (кг)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={weight || ''}
              onChange={(e) => setWeight(e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>

          <div className="space-y-2">
            <Label>Приёмы пищи</Label>
            <div className="space-y-2 border rounded-md p-2">
              {meals.map((meal) => (
                <div key={meal.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex-1">
                    <div className="font-medium">{meal.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {meal.calories} ккал | Б: {meal.protein}г Ж: {meal.fat}г У: {meal.carbs}г
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditMeal(meal)}>
                      Изменить
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteMeal(meal.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 border rounded-md p-2">
            <Label>{editingMeal ? 'Изменить блюдо' : 'Добавить блюдо'}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Название"
                value={newMeal.name}
                onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Калории"
                value={newMeal.calories || ''}
                onChange={(e) => setNewMeal({ ...newMeal, calories: parseFloat(e.target.value) || 0 })}
              />
              <Input
                type="number"
                step="0.1"
                placeholder="Белки (г)"
                value={newMeal.protein || ''}
                onChange={(e) => setNewMeal({ ...newMeal, protein: parseFloat(e.target.value) || 0 })}
              />
              <Input
                type="number"
                step="0.1"
                placeholder="Жиры (г)"
                value={newMeal.fat || ''}
                onChange={(e) => setNewMeal({ ...newMeal, fat: parseFloat(e.target.value) || 0 })}
              />
              <Input
                type="number"
                step="0.1"
                placeholder="Углеводы (г)"
                value={newMeal.carbs || ''}
                onChange={(e) => setNewMeal({ ...newMeal, carbs: parseFloat(e.target.value) || 0 })}
              />
              <Button
                type="button"
                onClick={editingMeal ? handleUpdateMeal : handleAddMeal}
                variant="outline"
              >
                {editingMeal ? 'Сохранить' : 'Добавить'}
              </Button>
            </div>
            {editingMeal && (
              <Button variant="ghost" size="sm" onClick={() => {
                setEditingMeal(null)
                setNewMeal({ name: '', calories: 0, protein: 0, fat: 0, carbs: 0 })
              }}>
                Отмена
              </Button>
            )}
          </div>

          <div className="border-t pt-2">
            <div className="text-sm font-medium">Итого за день:</div>
            <div className="text-xs text-muted-foreground">
              {totalKBJU.calories} ккал | Б: {totalKBJU.protein.toFixed(1)}г Ж: {totalKBJU.fat.toFixed(1)}г У: {totalKBJU.carbs.toFixed(1)}г
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              Сохранить
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Удалить запись
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

