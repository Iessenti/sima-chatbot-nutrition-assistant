import { useCallback } from "react";
import { useChatStore } from "@/store/chatStore";
import { useDataStore } from "@/store/dataStore";
import type { ChatMessage } from "@/lib/types";
import {
  processMessage,
  type MessageProcessorDependencies,
} from "@/services/messageProcessor";
import { showToast } from "@/components/Toast";
import { getApiKey, getLLMModel } from "@/lib/env";
import { processCommandMessage } from "@/services/commandProcessor";
import { useActivityLogStore } from "@/store/activityLogStore";
import { clearAllData } from "@/lib/storage";
import { parseCommand } from "@/lib/commandHandler";

const OPENROUTER_API_KEY = getApiKey();

export function useChat() {
  const {
    messages,
    isLoading,
    addMessage,
    updateLastMessage,
    setLoading,
    setProcessingState,
    clearChat,
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
    loadData,
  } = useDataStore();
  const { entries: activityLog } = useActivityLogStore();

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

      const trimmedContent = content.trim().toLowerCase();
      const command = parseCommand(trimmedContent);

      if (command === "reset") {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            '⚠️ Внимание! Это удалит все данные: профиль, записи, цели, историю чата.\n\nНапиши "подтверждаю" или "да" для подтверждения, или "отмена" для отмены.',
          timestamp: Date.now(),
        };
        addMessage(assistantMessage);
        return;
      }

      const userMessages = messages.filter((m) => m.role === "user");
      const lastUserMessage = userMessages[userMessages.length - 1];
      const previousUserMessage = userMessages[userMessages.length - 2];

      const wasResetCommand =
        (lastUserMessage &&
          parseCommand(lastUserMessage.content) === "reset") ||
        (previousUserMessage &&
          parseCommand(previousUserMessage.content) === "reset");

      const isResetConfirmation =
        wasResetCommand &&
        (trimmedContent === "подтверждаю" ||
          trimmedContent === "да" ||
          trimmedContent === "подтверждаю сброс" ||
          trimmedContent.includes("подтверждаю"));

      if (isResetConfirmation) {
        clearAllData();
        clearChat();
        loadData();
        useActivityLogStore.getState().loadLog();

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            "✅ Все данные удалены. Используй /start для создания нового профиля.",
          timestamp: Date.now(),
        };
        addMessage(assistantMessage);
        showToast("Все данные сброшены", "success");
        return;
      }

      const isResetCancellation =
        (trimmedContent === "отмена" &&
          lastUserMessage &&
          parseCommand(lastUserMessage.content) === "reset") ||
        (trimmedContent === "отмена" &&
          previousUserMessage &&
          parseCommand(previousUserMessage.content) === "reset");

      if (isResetCancellation) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "Отменено. Данные сохранены.",
          timestamp: Date.now(),
        };
        addMessage(assistantMessage);
        return;
      }

      if (command === "start") {
        if (profile) {
          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content:
              "У тебя уже есть профиль. Используй /profile для просмотра или изменения.",
            timestamp: Date.now(),
          };
          addMessage(assistantMessage);
          return;
        } else {
          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content:
              "Давай создадим твой профиль! Мне нужно узнать:\n- Рост (см)\n- Вес (кг)\n- Возраст\n- Пол (мужской/женский)\n- Уровень активности (sedentary/light/moderate/active/very_active)\n- Цель (похудение/поддержание/набор веса)\n\nНапиши эти данные, или я могу задать вопросы по очереди.",
            timestamp: Date.now(),
          };
          addMessage(assistantMessage);
          return;
        }
      }

      if (command === "export") {
        try {
          const { exportToJSON, exportToCSV, exportToPDF } = await import(
            "@/lib/export"
          );
          exportToJSON(profile, entries, goal);
          exportToCSV(entries);
          exportToPDF(profile, entries, goal);

          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content:
              "✅ Данные экспортированы в форматах JSON, CSV и PDF. Файлы должны начать загружаться автоматически.",
            timestamp: Date.now(),
          };
          addMessage(assistantMessage);
          showToast("Данные экспортированы", "success");
          return;
        } catch (error) {
          console.error("Error exporting data:", error);
          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content:
              "❌ Произошла ошибка при экспорте данных. Попробуй еще раз.",
            timestamp: Date.now(),
          };
          addMessage(assistantMessage);
          return;
        }
      }

      const commandResult = processCommandMessage(userMessage.content, {
        profile,
        entries,
        goal,
        activityLog,
      });

      if (commandResult.handled && commandResult.response) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: commandResult.response,
          timestamp: Date.now(),
        };
        addMessage(assistantMessage);
        return;
      }

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
      activityLog,
      clearChat,
      loadData,
    ]
  );

  return {
    isLoading,
    sendMessage,
  };
}
