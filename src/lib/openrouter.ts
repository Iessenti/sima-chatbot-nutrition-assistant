import type { ChatMessage } from './types'
import { getSystemPrompt } from './systemPrompt'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export interface OpenRouterConfig {
  apiKey: string
  model?: string
}

export async function callLLM(
  messages: ChatMessage[],
  config: OpenRouterConfig,
  userData?: { profile?: unknown; entries: unknown[]; goal?: unknown; context?: unknown }
): Promise<string> {
  const { apiKey, model = 'openai/gpt-4o-mini' } = config
  
  const systemPrompt = getSystemPrompt(
    userData?.profile as any,
    (userData?.entries || []) as any[],
    userData?.goal as any,
    userData?.context as any
  )

  const systemMessage: ChatMessage = {
    id: 'system',
    role: 'assistant',
    content: systemPrompt,
    timestamp: Date.now(),
  }

  const apiMessages = [
    {
      role: 'system',
      content: systemMessage.content,
    },
    ...messages
      .filter((m) => m.role !== 'assistant' || m.content)
      .map((m) => ({
        role: m.role,
        content: m.content,
      })),
  ]

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'KBJU Calculator',
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
        temperature: 0.9,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error?.message || `API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'Извините, не удалось получить ответ.'
  } catch (error) {
    console.error('OpenRouter API error:', error)
    throw error
  }
}

