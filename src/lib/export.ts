import type { UserProfile, DailyEntry, KBJUGoal } from './types'
import { calculateDailyKBJU, calculateStats } from './calculations'
import { format } from 'date-fns'

export function exportToJSON(profile: UserProfile | null, entries: DailyEntry[], goal: KBJUGoal | null) {
  const data = {
    profile,
    entries,
    goal,
    exportedAt: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kbju-data-${format(new Date(), 'yyyy-MM-dd')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportToCSV(entries: DailyEntry[]) {
  const headers = ['Дата', 'Вес (кг)', 'Калории', 'Белки (г)', 'Жиры (г)', 'Углеводы (г)', 'Блюда']
  const rows = entries.map(entry => {
    const kbju = calculateDailyKBJU(entry)
    const meals = entry.meals.map(m => m.name).join('; ')
    return [
      entry.date,
      entry.weight?.toString() || '',
      kbju.calories.toString(),
      kbju.protein.toString(),
      kbju.fat.toString(),
      kbju.carbs.toString(),
      meals,
    ]
  })
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kbju-data-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportToPDF(profile: UserProfile | null, entries: DailyEntry[], goal: KBJUGoal | null) {
  const stats = entries.length > 0 ? calculateStats(entries) : null
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Отчёт КБЖУ</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; }
        h2 { color: #666; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .stats { margin-top: 20px; }
      </style>
    </head>
    <body>
      <h1>Отчёт КБЖУ</h1>
      <p>Дата экспорта: ${format(new Date(), 'dd.MM.yyyy HH:mm')}</p>
      
      ${profile ? `
        <h2>Профиль</h2>
        <p>Рост: ${profile.height} см<br>
        Вес: ${profile.weight} кг<br>
        Возраст: ${profile.age} лет<br>
        Пол: ${profile.gender === 'male' ? 'Мужской' : 'Женский'}<br>
        Активность: ${profile.activityLevel}<br>
        Цель: ${profile.goal === 'lose' ? 'Похудение' : profile.goal === 'gain' ? 'Набор веса' : 'Поддержание'}</p>
      ` : ''}
      
      ${goal ? `
        <h2>Цели КБЖУ</h2>
        <p>Калории: ${goal.calories} ккал<br>
        Белки: ${goal.protein} г<br>
        Жиры: ${goal.fat} г<br>
        Углеводы: ${goal.carbs} г</p>
      ` : ''}
      
      ${stats ? `
        <div class="stats">
          <h2>Статистика</h2>
          <p>Всего записей: ${entries.length}<br>
          ${stats.averageWeight ? `Средний вес: ${stats.averageWeight.toFixed(1)} кг<br>` : ''}
          ${stats.weightChange ? `Изменение веса: ${stats.weightChange > 0 ? '+' : ''}${stats.weightChange.toFixed(1)} кг<br>` : ''}
          Средне за день:<br>
          • Калории: ${stats.averageDailyCalories} ккал<br>
          • Белки: ${stats.averageDailyProtein} г<br>
          • Жиры: ${stats.averageDailyFat} г<br>
          • Углеводы: ${stats.averageDailyCarbs} г</p>
        </div>
      ` : ''}
      
      <h2>Записи</h2>
      <table>
        <thead>
          <tr>
            <th>Дата</th>
            <th>Вес</th>
            <th>Калории</th>
            <th>Белки</th>
            <th>Жиры</th>
            <th>Углеводы</th>
            <th>Блюда</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map(entry => {
            const kbju = calculateDailyKBJU(entry)
            return `
              <tr>
                <td>${entry.date}</td>
                <td>${entry.weight || ''}</td>
                <td>${kbju.calories}</td>
                <td>${kbju.protein}</td>
                <td>${kbju.fat}</td>
                <td>${kbju.carbs}</td>
                <td>${entry.meals.map(m => m.name).join(', ')}</td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `
  
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}

