import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { MessageBubble } from './MessageBubble'
import { ProcessingIndicator } from './ProcessingIndicator'
import { EntriesList } from './EntriesList'
import { useChat } from '@/hooks/useChat'
import { useChatStore } from '@/store/chatStore'
import { useDataStore } from '@/store/dataStore'
import { useActivityLogStore } from '@/store/activityLogStore'
import { Calendar } from 'lucide-react'

export function ChatInterface() {
  const [input, setInput] = useState('')
  const [showEntries, setShowEntries] = useState(false)
  const { isLoading, sendMessage } = useChat()
  const { messages, loadHistory, processingState } = useChatStore()
  const { loadData, entries } = useDataStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
    loadHistory()
    useActivityLogStore.getState().loadLog()
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      sendMessage(input)
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="flex flex-col w-full max-w-4xl h-[90vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="border-b border-border bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm px-5 py-3.5 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">КБЖУ Калькулятор</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEntries(!showEntries)}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            Записи ({entries.length})
          </Button>
        </div>

        <div className="flex-1 overflow-auto px-5" ref={scrollRef}>
          {showEntries ? (
            <div className="py-5">
              <EntriesList />
            </div>
          ) : (
            <div className="py-5 space-y-2">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className="animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <MessageBubble message={message} />
                </div>
              ))}
              <ProcessingIndicator />
              {isLoading && processingState === 'idle' && (
                <div className="flex gap-2.5 px-2 animate-in fade-in">
                  <div className="h-8 w-8 rounded-full bg-muted animate-pulse shadow-sm" />
                  <div className="rounded-xl px-4 py-2 bg-muted animate-pulse h-8 w-32 shadow-sm" />
                </div>
              )}
            </div>
          )}
        </div>

        <Separator className="opacity-50" />

        <div className="p-4 bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2.5">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Напишите сообщение..."
                disabled={isLoading}
                className="flex-1 h-10 text-sm rounded-xl transition-all focus:ring-2 focus:ring-primary/30 border-border/50 shadow-sm"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                size="sm"
                className="h-10 px-5 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                Отправить
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

