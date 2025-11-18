import { useChatStore } from "@/store/chatStore"

const processingMessages: Record<string, string> = {
  extracting: "Анализирую данные...",
  processing: "Обрабатываю запрос...",
  saving: "Сохраняю данные...",
}

export function ProcessingIndicator() {
  const { processingState, processingMessage } = useChatStore()

  if (processingState === 'idle') return null

  const message = processingMessage || processingMessages[processingState] || "Обработка..."

  return (
    <div className="flex gap-2.5 px-2 py-2 animate-in fade-in slide-in-from-bottom-2">
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse shadow-sm flex items-center justify-center">
        <div className="h-3 w-3 rounded-full bg-primary" />
      </div>
      <div className="rounded-xl px-4 py-2 bg-muted text-sm text-muted-foreground shadow-sm">
        {message}
      </div>
    </div>
  )
}

