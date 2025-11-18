import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Stats } from '@/lib/types'

interface StatsCardProps {
  stats: Stats
  showCharts?: boolean
}

export function StatsCard({ stats, showCharts = false }: StatsCardProps) {
  return (
    <Card className="text-sm">
      <CardHeader className="pb-2 px-3 pt-3">
        <CardTitle className="text-base">Статистика</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-3 pb-3">
        {stats.averageWeight !== undefined && (
          <div>
            <div className="text-xs text-muted-foreground">Средний вес</div>
            <div className="text-xl font-bold">{stats.averageWeight.toFixed(1)} кг</div>
            {stats.weightChange !== undefined && stats.weightChange !== 0 && (
              <div className={`text-xs ${stats.weightChange > 0 ? 'text-destructive' : 'text-primary'}`}>
                {stats.weightChange > 0 ? '+' : ''}{stats.weightChange.toFixed(1)} кг
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Всего калорий</div>
            <div className="text-lg font-semibold">{stats.totalCalories} ккал</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Средне за день</div>
            <div className="text-lg font-semibold">{stats.averageDailyCalories} ккал</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-muted-foreground">Белки</div>
            <div className="font-semibold">{stats.averageDailyProtein} г</div>
          </div>
          <div>
            <div className="text-muted-foreground">Жиры</div>
            <div className="font-semibold">{stats.averageDailyFat} г</div>
          </div>
          <div>
            <div className="text-muted-foreground">Углеводы</div>
            <div className="font-semibold">{stats.averageDailyCarbs} г</div>
          </div>
        </div>

        {showCharts && (
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="text-xs font-medium mb-2">Прогресс по макронутриентам:</div>
            {[
              { label: 'Белки', value: stats.averageDailyProtein, goal: 100, color: 'bg-blue-500' },
              { label: 'Жиры', value: stats.averageDailyFat, goal: 80, color: 'bg-yellow-500' },
              { label: 'Углеводы', value: stats.averageDailyCarbs, goal: 200, color: 'bg-green-500' },
            ].map((item) => {
              const percentage = Math.min((item.value / item.goal) * 100, 100)
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span>{item.value} / {item.goal} г</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

