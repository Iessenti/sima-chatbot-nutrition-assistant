import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { KBJUGoal, DailyEntry } from '@/lib/types'
import { calculateDailyKBJU } from '@/lib/calculations'

interface KBJUChartProps {
  goal: KBJUGoal
  entry: DailyEntry
}

export function KBJUChart({ goal, entry }: KBJUChartProps) {
  const current = calculateDailyKBJU(entry)

  const items = [
    { label: 'Калории', current: current.calories, goal: goal.calories, unit: 'ккал' },
    { label: 'Белки', current: current.protein, goal: goal.protein, unit: 'г' },
    { label: 'Жиры', current: current.fat, goal: goal.fat, unit: 'г' },
    { label: 'Углеводы', current: current.carbs, goal: goal.carbs, unit: 'г' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">КБЖУ за день</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => {
          const percentage = Math.min((item.current / item.goal) * 100, 100)
          const isOver = item.current > item.goal

          return (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">
                  {item.current.toFixed(1)} / {item.goal} {item.unit}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    isOver ? 'bg-destructive' : 'bg-primary'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

