import { create } from 'zustand'
import type { ChatMessage } from '@/lib/types'
import { getChatHistory, saveChatHistory } from '@/lib/storage'

interface ChatStore {
  messages: ChatMessage[]
  isLoading: boolean
  addMessage: (message: ChatMessage) => void
  updateLastMessage: (content: string) => void
  clearChat: () => void
  setLoading: (loading: boolean) => void
  loadHistory: () => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,
  
  addMessage: (message) => {
    set((state) => {
      const newMessages = [...state.messages, message]
      saveChatHistory(newMessages)
      return { messages: newMessages }
    })
  },
  
  updateLastMessage: (content) => {
    set((state) => {
      if (state.messages.length === 0) return state
      const newMessages = [...state.messages]
      newMessages[newMessages.length - 1] = {
        ...newMessages[newMessages.length - 1],
        content,
      }
      saveChatHistory(newMessages)
      return { messages: newMessages }
    })
  },
  
  clearChat: () => {
    set({ messages: [] })
    saveChatHistory([])
  },
  
  setLoading: (loading) => {
    set({ isLoading: loading })
  },
  
  loadHistory: () => {
    const history = getChatHistory()
    set({ messages: history })
  },
}))

