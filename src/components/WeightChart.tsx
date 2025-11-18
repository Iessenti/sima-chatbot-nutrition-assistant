import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DailyEntry } from '@/lib/types'
import { format, parseISO } from 'date-fns'

interface WeightChartProps {
  entries: DailyEntry[]
}

export function WeightChart({ entries }: WeightChartProps) {
  const weightEntries = entries
    .filter(e => e.weight)
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())

  if (weightEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">График веса</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Нет данных о весе</p>
        </CardContent>
      </Card>
    )
  }

  const weights = weightEntries.map(e => e.weight!)
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const range = maxWeight - minWeight || 1

  const maxHeight = 200

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">График веса</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-end gap-1 h-[200px] border-b border-l">
            {weightEntries.map((entry, index) => {
              const height = ((entry.weight! - minWeight) / range) * maxHeight
              return (
                <div
                  key={entry.id}
                  className="flex-1 flex flex-col items-center group relative"
                  style={{ height: `${maxHeight}px` }}
                >
                  <div
                    className="w-full bg-primary rounded-t transition-all hover:bg-primary/80 min-h-[4px]"
                    style={{ height: `${Math.max(height, 4)}px` }}
                  />
                  {index % Math.ceil(weightEntries.length / 5) === 0 && (
                    <span className="text-xs text-muted-foreground mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                      {format(parseISO(entry.date), 'dd.MM')}
                    </span>
                  )}
                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded px-2 py-1 text-xs shadow-lg z-10">
                    {format(parseISO(entry.date), 'dd.MM.yyyy')}: {entry.weight} кг
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{minWeight.toFixed(1)} кг</span>
            <span>{maxWeight.toFixed(1)} кг</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

