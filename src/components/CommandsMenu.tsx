import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useChat } from '@/hooks/useChat'
import type { Command } from '@/lib/commandHandler'
import { getCommandDescription } from '@/lib/commandHandler'

const commands: { key: Command; label: string; icon: string }[] = [
  { key: 'start', label: 'Старт', icon: '🚀' },
  { key: 'profile', label: 'Профиль', icon: '👤' },
  { key: 'update', label: 'Добавить запись', icon: '➕' },
  { key: 'stats', label: 'Статистика', icon: '📊' },
  { key: 'goal', label: 'Цели', icon: '🎯' },
  { key: 'help', label: 'Помощь', icon: '❓' },
  { key: 'reset', label: 'Сброс', icon: '🔄' },
]

export function CommandsMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { sendMessage } = useChat()

  const handleCommand = (command: Command) => {
    sendMessage(`/${command}`)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-1.5 h-10 text-xs px-3 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm"
      >
        <span>⚡</span>
        <span>Команды</span>
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 z-[9999] w-80 bg-card border border-border rounded-xl shadow-2xl p-2 max-h-[60vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5 mb-1">
              Быстрые команды
            </div>
            <div className="space-y-0.5">
              {commands.map((cmd, index) => (
                <button
                  key={cmd.key}
                  onClick={() => handleCommand(cmd.key)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-accent hover:text-accent-foreground transition-all duration-150 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] animate-in fade-in slide-in-from-left-2"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <span className="text-base">{cmd.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{cmd.label}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {getCommandDescription(cmd.key)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

