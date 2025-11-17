import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { KBJUGoal } from '@/lib/types'

interface KBJUCardProps {
  goal: KBJUGoal
  current?: KBJUGoal
  title?: string
}

export function KBJUCard({ goal, current, title = 'КБЖУ' }: KBJUCardProps) {
  const items = [
    { label: 'Калории', value: goal.calories, current: current?.calories, unit: 'ккал' },
    { label: 'Белки', value: goal.protein, current: current?.protein, unit: 'г' },
    { label: 'Жиры', value: goal.fat, current: current?.fat, unit: 'г' },
    { label: 'Углеводы', value: goal.carbs, current: current?.carbs, unit: 'г' },
  ]

  return (
    <Card className="text-sm">
      <CardHeader className="pb-2 px-3 pt-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 px-3 pb-3">
        {items.map((item) => {
          const percentage = current && item.value > 0
            ? Math.min((item.current || 0) / item.value * 100, 100)
            : 0

          return (
            <div key={item.label} className="space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">
                  {current ? `${item.current || 0}` : ''} / {item.value} {item.unit}
                </span>
              </div>
              {current && (
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

