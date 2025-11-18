import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DailyEntry } from '@/lib/types'
import { format, parseISO } from 'date-fns'
import { calculateDailyKBJUWithActivity } from '@/lib/calculations'

interface ActivityKBJUChartProps {
  entries: DailyEntry[]
  days?: number
}

export function ActivityKBJUChart({ entries, days = 7 }: ActivityKBJUChartProps) {
  const sortedEntries = [...entries]
    .filter(e => e.meals.length > 0 || e.activity)
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
    .slice(-days)

  if (sortedEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">График КБЖУ с активностью</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Нет данных для отображения</p>
        </CardContent>
      </Card>
    )
  }

  const chartData = sortedEntries.map(entry => {
    const kbju = calculateDailyKBJUWithActivity(entry)
    return {
      date: entry.date,
      consumed: kbju.consumed.calories,
      burned: kbju.burned,
      net: kbju.net.calories,
    }
  })

  const maxCalories = Math.max(
    ...chartData.map(d => Math.max(d.consumed, d.net)),
    2000
  )
  const maxHeight = 200

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">График КБЖУ с активностью</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-end gap-1 h-[200px] border-b border-l">
            {chartData.map((data, index) => {
              const consumedHeight = (data.consumed / maxCalories) * maxHeight
              const burnedHeight = (data.burned / maxCalories) * maxHeight
              const netHeight = (data.net / maxCalories) * maxHeight
              
              return (
                <div
                  key={data.date}
                  className="flex-1 flex flex-col items-center group relative"
                  style={{ height: `${maxHeight}px` }}
                >
                  <div className="flex flex-col items-center w-full h-full justify-end gap-0.5">
                    {data.consumed > 0 && (
                      <div
                        className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600 min-h-[2px]"
                        style={{ height: `${Math.max(consumedHeight, 2)}px` }}
                        title={`Потреблено: ${data.consumed} ккал`}
                      />
                    )}
                    {data.burned > 0 && (
                      <div
                        className="w-full bg-red-500 rounded transition-all hover:bg-red-600 min-h-[2px]"
                        style={{ height: `${Math.max(burnedHeight, 2)}px` }}
                        title={`Сожжено: ${data.burned} ккал`}
                      />
                    )}
                    {data.net > 0 && (
                      <div
                        className="w-full bg-green-500 rounded-b transition-all hover:bg-green-600 min-h-[2px]"
                        style={{ height: `${Math.max(netHeight, 2)}px` }}
                        title={`Чистый баланс: ${data.net} ккал`}
                      />
                    )}
                  </div>
                  {index % Math.ceil(chartData.length / 5) === 0 && (
                    <span className="text-xs text-muted-foreground mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                      {format(parseISO(data.date), 'dd.MM')}
                    </span>
                  )}
                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded px-2 py-1 text-xs shadow-lg z-10 whitespace-nowrap">
                    <div>{format(parseISO(data.date), 'dd.MM.yyyy')}</div>
                    <div>Потреблено: {data.consumed} ккал</div>
                    {data.burned > 0 && <div>Сожжено: {data.burned} ккал</div>}
                    <div>Баланс: {data.net} ккал</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 ккал</span>
            <span>{maxCalories} ккал</span>
          </div>
          <div className="flex gap-4 justify-center text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span>Потреблено</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span>Сожжено</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span>Баланс</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

