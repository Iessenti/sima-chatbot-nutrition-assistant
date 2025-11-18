import { useCallback } from "react";
import { useChatStore } from "@/store/chatStore";
import { useDataStore } from "@/store/dataStore";
import type { ChatMessage } from "@/lib/types";
import {
  processMessage,
  type MessageProcessorDependencies,
} from "@/services/messageProcessor";
import { showToast } from "@/components/Toast";
import { getApiKey } from "@/lib/env";

const OPENROUTER_API_KEY = getApiKey();

export function useChat() {
  const {
    messages,
    isLoading,
    addMessage,
    updateLastMessage,
    setLoading,
    setProcessingState,
  } = useChatStore();
  const {
    profile,
    entries,
    goal,
    setProfile,
    updateProfile,
    addEntry,
    updateEntry,
    setGoal,
    updateContext,
    context,
  } = useDataStore();

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };

      addMessage(userMessage);

      setLoading(true);
      setProcessingState("extracting", "Анализирую данные...");

      try {
        if (!OPENROUTER_API_KEY) {
          updateLastMessage(
            "Ошибка: не настроен API ключ OpenRouter. Пожалуйста, установите переменную окружения VITE_OPENROUTER_API_KEY."
          );
          setLoading(false);
          setProcessingState("idle");
          return;
        }

        setProcessingState("processing", "Обрабатываю запрос...");

        const deps: MessageProcessorDependencies = {
          profile,
          entries,
          goal,
          context,
          messages,
          userMessage,
          apiKey: OPENROUTER_API_KEY,
          setProfile,
          updateProfile,
          addEntry,
          updateEntry,
          setGoal,
          updateContext,
        };

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "",
          timestamp: Date.now(),
        };
        addMessage(assistantMessage);

        setProcessingState("saving", "Сохраняю данные...");
        const result = await processMessage(deps);
        updateLastMessage(result.response);
      } catch (error) {
        console.error("Error calling LLM:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Неизвестная ошибка";
        showToast(`Ошибка: ${errorMessage}`, "error");
        updateLastMessage(
          `Извините, произошла ошибка при обработке запроса: ${errorMessage}`
        );
      } finally {
        setLoading(false);
        setProcessingState("idle");
      }
    },
    [
      messages,
      isLoading,
      profile,
      entries,
      goal,
      context,
      addMessage,
      updateLastMessage,
      setLoading,
      setProcessingState,
      setProfile,
      addEntry,
      updateEntry,
      setGoal,
      updateProfile,
      updateContext,
    ]
  );

  return {
    isLoading,
    sendMessage,
  };
}
