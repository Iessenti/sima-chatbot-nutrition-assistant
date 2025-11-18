import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { useActivityLogStore } from '@/store/activityLogStore'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { ru } from 'date-fns/locale/ru'
import type { ActivityLogActionType } from '@/lib/types'
import {
  User,
  Utensils,
  Weight,
  Activity,
  Target,
  MessageSquare,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const actionIcons: Record<ActivityLogActionType, typeof User> = {
  profile_created: User,
  profile_updated: User,
  meal_added: Utensils,
  weight_recorded: Weight,
  activity_recorded: Activity,
  goal_updated: Target,
  context_updated: MessageSquare,
}

const actionLabels: Record<ActivityLogActionType, string> = {
  profile_created: 'Создан профиль',
  profile_updated: 'Обновлен профиль',
  meal_added: 'Добавлена еда',
  weight_recorded: 'Записан вес',
  activity_recorded: 'Записана активность',
  goal_updated: 'Обновлены цели',
  context_updated: 'Обновлен контекст',
}

export function ActivityLogView() {
  const { entries, deleteEntry, loadLog } = useActivityLogStore()
  const [filter, setFilter] = useState<ActivityLogActionType | 'all'>('all')

  useEffect(() => {
    loadLog()
  }, [loadLog])

  const filteredEntries = filter === 'all'
    ? (entries || [])
    : (entries || []).filter(e => e.actionType === filter)

  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    const date = entry.date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(entry)
    return acc
  }, {} as Record<string, typeof filteredEntries>)

  const sortedDates = Object.keys(groupedEntries).sort((a, b) => 
    parseISO(b).getTime() - parseISO(a).getTime()
  )

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'Сегодня'
    if (isYesterday(date)) return 'Вчера'
    return format(date, 'd MMMM yyyy', { locale: ru })
  }

  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp), 'HH:mm')
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          История действий пуста
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Все
        </Button>
        <Button
          variant={filter === 'meal_added' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('meal_added')}
        >
          Еда
        </Button>
        <Button
          variant={filter === 'activity_recorded' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('activity_recorded')}
        >
          Активность
        </Button>
        <Button
          variant={filter === 'weight_recorded' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('weight_recorded')}
        >
          Вес
        </Button>
        <Button
          variant={filter === 'profile_updated' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('profile_updated')}
        >
          Профиль
        </Button>
      </div>

      <div className="space-y-6">
        {sortedDates.map(date => (
          <div key={date}>
            <h3 className="text-sm font-semibold mb-3 text-foreground">
              {formatDate(date)}
            </h3>
            <div className="space-y-2">
              {(groupedEntries[date] || [])
                .sort((a, b) => b.timestamp - a.timestamp)
                .map(entry => {
                  const Icon = actionIcons[entry.actionType]
                  return (
                    <Card key={entry.id} className="hover:bg-accent/50 transition-colors">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1">
                                <div className="text-sm font-medium">
                                  {actionLabels[entry.actionType]}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {entry.description}
                                </div>
                                {entry.data && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {entry.data.meals && (
                                      <div>
                                        Блюда: {entry.data.meals.map(m => m.name).join(', ')}
                                      </div>
                                    )}
                                    {entry.data.weight !== undefined && (
                                      <div>Вес: {entry.data.weight} кг</div>
                                    )}
                                    {entry.data.activity && (
                                      <div>
                                        Активность: {entry.data.activity.type}{' '}
                                        {entry.data.activity.duration && `(${entry.data.activity.duration} мин)`}
                                        {entry.data.activity.calories && ` - ${entry.data.activity.calories} ккал`}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatTime(entry.timestamp)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm('Удалить эту запись из истории?')) {
                                      deleteEntry(entry.id)
                                    }
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

