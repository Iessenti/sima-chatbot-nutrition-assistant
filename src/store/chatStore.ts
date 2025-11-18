import { create } from 'zustand'
import type { ChatMessage } from '@/lib/types'
import { getChatHistory, saveChatHistory } from '@/lib/storage'

export type ProcessingState = 'idle' | 'extracting' | 'processing' | 'saving'

interface ChatStore {
  messages: ChatMessage[]
  isLoading: boolean
  processingState: ProcessingState
  processingMessage: string
  addMessage: (message: ChatMessage) => void
  updateLastMessage: (content: string) => void
  clearChat: () => void
  setLoading: (loading: boolean) => void
  setProcessingState: (state: ProcessingState, message?: string) => void
  loadHistory: () => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,
  processingState: 'idle',
  processingMessage: '',
  
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
  
  setProcessingState: (state, message = '') => {
    set({ processingState: state, processingMessage: message })
  },
  
  loadHistory: () => {
    const history = getChatHistory()
    set({ messages: history })
  },
}))

