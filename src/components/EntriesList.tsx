import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDataStore } from '@/store/dataStore'
import { EntryEditor } from './EntryEditor'
import { ActivityLogView } from './ActivityLogView'
import { ActivityKBJUChart } from './ActivityKBJUChart'
import { format, parseISO } from 'date-fns'
import { Pencil, Trash2, Download, History, Calendar } from 'lucide-react'
import type { DailyEntry } from '@/lib/types'
import { exportToJSON, exportToCSV, exportToPDF } from '@/lib/export'
import { calculateDailyKBJUWithActivity } from '@/lib/calculations'

export function EntriesList() {
  const { entries, deleteEntry, profile, goal } = useDataStore()
  const [editingEntry, setEditingEntry] = useState<DailyEntry | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [viewMode, setViewMode] = useState<'entries' | 'history'>('history')

  const sortedEntries = [...entries].sort((a, b) => 
    parseISO(b.date).getTime() - parseISO(a.date).getTime()
  )

  const handleDelete = (entryId: string) => {
    deleteEntry(entryId)
  }

  const totalKBJU = (entry: DailyEntry) => {
    const kbju = calculateDailyKBJUWithActivity(entry)
    return kbju.net
  }

  if (entries.length === 0 && viewMode === 'entries') {
    return (
      <>
        <div className="mb-4 flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'history' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('history')}
              className="gap-2"
            >
              История действий
            </Button>
            <Button
              variant={viewMode === 'entries' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('entries')}
              className="gap-2"
            >
              Записи по дням
            </Button>
          </div>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Нет записей
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'history' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('history')}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            История действий
          </Button>
          <Button
            variant={viewMode === 'entries' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('entries')}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            Записи по дням
          </Button>
        </div>
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Экспорт
          </Button>
          {showExportMenu && (
            <>
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 z-[9999] bg-card border border-border rounded-lg shadow-lg p-1 min-w-[150px]">
                <button
                  onClick={() => {
                    exportToJSON(profile, entries, goal)
                    setShowExportMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-accent text-sm"
                >
                  JSON
                </button>
                <button
                  onClick={() => {
                    exportToCSV(entries)
                    setShowExportMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-accent text-sm"
                >
                  CSV
                </button>
                <button
                  onClick={() => {
                    exportToPDF(profile, entries, goal)
                    setShowExportMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-accent text-sm"
                >
                  PDF
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {viewMode === 'history' ? (
        <ActivityLogView />
      ) : (
        <>
          <div className="space-y-4">
            {sortedEntries.map((entry) => {
              const kbju = totalKBJU(entry)
              const kbjuFull = calculateDailyKBJUWithActivity(entry)
              return (
                <Card key={entry.id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">
                      {format(parseISO(entry.date), 'd MMM yyyy')}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingEntry(entry)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Удалить эту запись?')) {
                            handleDelete(entry.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {entry.weight && (
                      <div className="text-sm mb-2">
                        <span className="font-medium">Вес: </span>
                        {entry.weight} кг
                      </div>
                    )}
                    {entry.activity && (
                      <div className="text-sm mb-2">
                        <span className="font-medium">Активность: </span>
                        {entry.activity.type === 'walking' && 'Ходьба'}
                        {entry.activity.type === 'running' && 'Бег'}
                        {entry.activity.type === 'gym' && 'Тренировка в зале'}
                        {entry.activity.type === 'cycling' && 'Велосипед'}
                        {entry.activity.type === 'other' && 'Другое'}
                        {entry.activity.duration && ` (${entry.activity.duration} мин)`}
                        {entry.activity.calories && ` - ${entry.activity.calories} ккал сожжено`}
                      </div>
                    )}
                    {(entry.meals || []).length > 0 && (
                      <div className="space-y-1 mb-2">
                        <div className="text-sm font-medium">Блюда:</div>
                        {(entry.meals || []).map((meal) => (
                          <div key={meal.id} className="text-xs text-muted-foreground">
                            • {meal.name} ({meal.calories} ккал)
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground border-t pt-2 space-y-1">
                      <div>
                        Потреблено: {kbjuFull.consumed.calories} ккал | Б: {kbjuFull.consumed.protein.toFixed(1)}г Ж: {kbjuFull.consumed.fat.toFixed(1)}г У: {kbjuFull.consumed.carbs.toFixed(1)}г
                      </div>
                      {kbjuFull.burned > 0 && (
                        <div className="text-red-500">
                          Сожжено: {kbjuFull.burned} ккал
                        </div>
                      )}
                      <div className="font-medium">
                        Баланс: {kbju.calories} ккал | Б: {kbju.protein.toFixed(1)}г Ж: {kbju.fat.toFixed(1)}г У: {kbju.carbs.toFixed(1)}г
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {entries.length > 0 && (
            <div className="mt-6 space-y-6">
              <WeightChart entries={entries} />
              <ActivityKBJUChart entries={entries} />
            </div>
          )}
        </>
      )}

      {editingEntry && (
        <EntryEditor
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onDelete={() => {
            handleDelete(editingEntry.id)
            setEditingEntry(null)
          }}
        />
      )}
    </>
  )
}

