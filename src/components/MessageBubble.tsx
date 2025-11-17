import ReactMarkdown from 'react-markdown'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/lib/types'
import { format } from 'date-fns'
import { KBJUCard } from './KBJUCard'
import { StatsCard } from './StatsCard'
import type { KBJUGoal, Stats } from '@/lib/types'

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  const renderContent = () => {
    if (message.type === 'data' && message.data) {
      const data = message.data as { type: string; data: KBJUGoal | Stats }
      if (data.type === 'kbju' && 'calories' in data.data) {
        return <KBJUCard goal={data.data as KBJUGoal} />
      }
      if (data.type === 'stats' && 'period' in data.data) {
        return <StatsCard stats={data.data as Stats} />
      }
    }

    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex gap-2.5 px-2 py-2 transition-all',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <Avatar className="h-8 w-8 shrink-0 transition-transform hover:scale-110">
        <AvatarFallback className={cn('text-xs rounded-full', isUser ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted shadow-sm')}>
          {isUser ? 'Я' : 'AI'}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn('flex flex-col gap-1 max-w-[80%]', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-xl px-4 py-2.5 text-sm shadow-sm transition-all duration-200',
            isUser
              ? 'bg-primary text-primary-foreground hover:shadow-md'
              : 'bg-muted text-foreground hover:shadow-md',
            message.type === 'data' && 'p-0 bg-transparent shadow-none hover:shadow-none'
          )}
        >
          {renderContent()}
        </div>
        <span className="text-xs text-muted-foreground px-2">
          {format(new Date(message.timestamp), 'HH:mm')}
        </span>
      </div>
    </div>
  )
}

