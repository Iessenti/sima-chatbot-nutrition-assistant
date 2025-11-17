import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Stats } from '@/lib/types'

interface StatsCardProps {
  stats: Stats
}

export function StatsCard({ stats }: StatsCardProps) {
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
      </CardContent>
    </Card>
  )
}

