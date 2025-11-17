import { useCallback } from "react";
import { useChatStore } from "@/store/chatStore";
import { useDataStore } from "@/store/dataStore";
import type {
  ChatMessage,
  UserProfile,
  DailyEntry,
  Meal,
  KBJUGoal,
} from "@/lib/types";
import { callLLM } from "@/lib/openrouter";
import { extractUserData, extractMealData } from "@/lib/dataExtraction";
import { enrichMealData } from "@/lib/mealEstimation";
import { extractWeight } from "@/lib/weightExtraction";
import { extractContext } from "@/lib/contextExtraction";
import { extractGoalData } from "@/lib/goalExtraction";
import {
  updateProfileFromExtractedData,
  shouldRecalculateGoal,
  getChangedFields,
} from "@/lib/profileUpdate";
import { calculateKBJUGoal, calculateStats } from "@/lib/calculations";
import { useCommands } from "./useCommands";

const OPENROUTER_API_KEY =
  "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";

export function useChat() {
  const { messages, isLoading, addMessage, updateLastMessage, setLoading } =
    useChatStore();
  const {
    profile,
    entries,
    goal,
    setProfile,
    updateProfile,
    addEntry,
    setGoal,
    updateContext,
  } = useDataStore();
  const { handleCommand, handleResetConfirmation } = useCommands();

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const trimmedContent = content.trim().toLowerCase();

      if (
        trimmedContent === "подтверждаю" ||
        trimmedContent === "да" ||
        trimmedContent === "yes"
      ) {
        handleResetConfirmation(true);
        return;
      }

      if (
        trimmedContent === "отмена" ||
        trimmedContent === "нет" ||
        trimmedContent === "no"
      ) {
        handleResetConfirmation(false);
        return;
      }

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };

      addMessage(userMessage);

      const commandHandled = handleCommand("", content.trim());
      if (commandHandled) {
        return;
      }

      setLoading(true);

      try {
        if (!OPENROUTER_API_KEY) {
          updateLastMessage(
            "Ошибка: не настроен API ключ OpenRouter. Пожалуйста, установите переменную окружения VITE_OPENROUTER_API_KEY."
          );
          setLoading(false);
          return;
        }

        if (!profile) {
          const extractedData = await extractUserData(content.trim());
          if (extractedData) {
            // Проверяем минимально необходимые данные для создания профиля
            const hasMinimalData =
              extractedData.age && extractedData.weight && extractedData.goal;

            if (hasMinimalData) {
              // Используем дефолтные значения для недостающих полей
              const newProfile: UserProfile = {
                height: extractedData.height || 175, // Дефолтный рост
                weight: extractedData.weight!,
                age: extractedData.age!,
                gender: extractedData.gender || "male", // Дефолтный пол
                activityLevel: extractedData.activityLevel || "sedentary", // Дефолтная активность (малоподвижный)
                goal: extractedData.goal!,
                targetWeight: extractedData.targetWeight,
              };
              setProfile(newProfile);
              const calculatedGoal = calculateKBJUGoal(newProfile);
              setGoal(calculatedGoal);

              const assistantMessage: ChatMessage = {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: "",
                timestamp: Date.now(),
              };
              addMessage(assistantMessage);

              // Формируем сообщение о том, что было использовано
              const missingFields = [];
              if (!extractedData.height) missingFields.push("рост");
              if (!extractedData.gender) missingFields.push("пол");
              if (!extractedData.activityLevel)
                missingFields.push("уровень активности");

              const contextMessage =
                missingFields.length > 0
                  ? `\n\nПримечание: использовал дефолтные значения для ${missingFields.join(
                      ", "
                    )}. Можешь уточнить эти данные позже через /profile`
                  : "";

              const currentContext = useDataStore.getState().context;
              const response = await callLLM(
                [...messages, userMessage],
                {
                  apiKey: OPENROUTER_API_KEY,
                },
                {
                  profile: newProfile,
                  entries: [],
                  goal: calculatedGoal,
                  context: currentContext || undefined,
                }
              );

              updateLastMessage(response + contextMessage);
              setLoading(false);
              return;
            }
          }
        }

        // Извлекаем контекст из каждого сообщения (имя, предпочтения)
        const extractedContext = await extractContext(content.trim());
        if (extractedContext) {
          updateContext(extractedContext);
        }

        // Если профиль уже есть, проверяем обновления данных
        if (profile) {
          const extractedData = await extractUserData(content.trim());
          if (extractedData) {
            // Проверяем, есть ли изменения в данных профиля
            const hasChanges =
              (extractedData.height != null &&
                extractedData.height !== profile.height) ||
              (extractedData.weight != null &&
                extractedData.weight !== profile.weight) ||
              (extractedData.age != null &&
                extractedData.age !== profile.age) ||
              (extractedData.gender != null &&
                extractedData.gender !== profile.gender) ||
              (extractedData.activityLevel != null &&
                extractedData.activityLevel !== profile.activityLevel) ||
              (extractedData.goal != null &&
                extractedData.goal !== profile.goal) ||
              (extractedData.targetWeight != null &&
                extractedData.targetWeight !== profile.targetWeight);

            if (hasChanges) {
              const updatedProfile = updateProfileFromExtractedData(
                extractedData,
                profile
              );
              updateProfile(updatedProfile);

              if (shouldRecalculateGoal(extractedData, profile)) {
                const newGoal = calculateKBJUGoal(updatedProfile);
                setGoal(newGoal);
              }

              const changedFields = getChangedFields(extractedData, profile);

              const assistantMessage: ChatMessage = {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: "",
                timestamp: Date.now(),
              };
              addMessage(assistantMessage);

              const currentContext = useDataStore.getState().context;
              const response = await callLLM(
                [...messages, userMessage],
                {
                  apiKey: OPENROUTER_API_KEY,
                },
                {
                  profile: updatedProfile,
                  entries,
                  goal: shouldRecalculateGoal(extractedData, profile)
                    ? calculateKBJUGoal(updatedProfile)
                    : goal || undefined,
                  context: currentContext || undefined,
                }
              );

              const updateMessage =
                changedFields.length > 0
                  ? `\n\nОбновлено: ${changedFields.join(", ")}.`
                  : "";

              updateLastMessage(response + updateMessage);
              setLoading(false);
              return;
            }
          }

          // Проверяем изменение целей КБЖУ
          const extractedGoal = await extractGoalData(content.trim());
          if (extractedGoal) {
            if (!goal) {
              // Если целей нет, но пользователь хочет их установить - нужно сначала создать профиль
              const assistantMessage: ChatMessage = {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: "",
                timestamp: Date.now(),
              };
              addMessage(assistantMessage);

              const currentContext = useDataStore.getState().context;
              const response = await callLLM(
                [...messages, userMessage],
                {
                  apiKey: OPENROUTER_API_KEY,
                },
                {
                  profile: profile || undefined,
                  entries,
                  goal: undefined,
                  context: currentContext || undefined,
                }
              );

              updateLastMessage(response);
              setLoading(false);
              return;
            }
            const hasGoalChanges =
              (extractedGoal.calories != null &&
                extractedGoal.calories !== goal.calories) ||
              (extractedGoal.protein != null &&
                extractedGoal.protein !== goal.protein) ||
              (extractedGoal.fat != null && extractedGoal.fat !== goal.fat) ||
              (extractedGoal.carbs != null &&
                extractedGoal.carbs !== goal.carbs);

            if (hasGoalChanges) {
              const updatedGoal: KBJUGoal = {
                calories: extractedGoal.calories ?? goal.calories,
                protein: extractedGoal.protein ?? goal.protein,
                fat: extractedGoal.fat ?? goal.fat,
                carbs: extractedGoal.carbs ?? goal.carbs,
              };
              setGoal(updatedGoal);

              const goalChanges: string[] = [];
              if (
                extractedGoal.calories != null &&
                extractedGoal.calories !== goal.calories
              ) {
                goalChanges.push(
                  `калории: ${goal.calories} → ${extractedGoal.calories} ккал`
                );
              }
              if (
                extractedGoal.protein != null &&
                extractedGoal.protein !== goal.protein
              ) {
                goalChanges.push(
                  `белки: ${goal.protein} → ${extractedGoal.protein} г`
                );
              }
              if (extractedGoal.fat != null && extractedGoal.fat !== goal.fat) {
                goalChanges.push(`жиры: ${goal.fat} → ${extractedGoal.fat} г`);
              }
              if (
                extractedGoal.carbs != null &&
                extractedGoal.carbs !== goal.carbs
              ) {
                goalChanges.push(
                  `углеводы: ${goal.carbs} → ${extractedGoal.carbs} г`
                );
              }

              const assistantMessage: ChatMessage = {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: "",
                timestamp: Date.now(),
              };
              addMessage(assistantMessage);

              const currentContext = useDataStore.getState().context;
              const response = await callLLM(
                [...messages, userMessage],
                {
                  apiKey: OPENROUTER_API_KEY,
                },
                {
                  profile: profile || undefined,
                  entries,
                  goal: updatedGoal,
                  context: currentContext || undefined,
                }
              );

              const updateMessage =
                goalChanges.length > 0
                  ? `\n\nОбновлены цели: ${goalChanges.join(", ")}.`
                  : "";

              updateLastMessage(response + updateMessage);
              setLoading(false);
              return;
            }
          }

          const extractedMeals = await extractMealData(content.trim());
          const extractedWeight = await extractWeight(content.trim());

          if (extractedMeals && extractedMeals.length > 0) {
            const enrichedMeals = await enrichMealData(extractedMeals);
            const meals: Meal[] = enrichedMeals.map((m, idx) => ({
              id: `meal-${Date.now()}-${idx}`,
              name: m.name,
              calories: m.calories || 0,
              protein: m.protein || 0,
              fat: m.fat || 0,
              carbs: m.carbs || 0,
            }));

            const today = new Date().toISOString().split("T")[0];
            const existingEntry = entries.find((e) => e.date === today);

            if (existingEntry) {
              const updatedEntry: DailyEntry = {
                ...existingEntry,
                meals: [...existingEntry.meals, ...meals],
                weight: extractedWeight ?? existingEntry.weight,
              };
              useDataStore.getState().updateEntry(updatedEntry);
            } else {
              const newEntry: DailyEntry = {
                id: `entry-${Date.now()}`,
                date: today,
                meals,
                weight: extractedWeight ?? undefined,
              };
              addEntry(newEntry);
            }

            const assistantMessage: ChatMessage = {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: "",
              timestamp: Date.now(),
            };
            addMessage(assistantMessage);

            const updatedEntries = useDataStore.getState().entries;
            const currentContext = useDataStore.getState().context;
            const response = await callLLM(
              [...messages, userMessage],
              {
                apiKey: OPENROUTER_API_KEY,
              },
              {
                profile: profile || undefined,
                entries: updatedEntries,
                goal: goal || undefined,
                context: currentContext || undefined,
              }
            );

            updateLastMessage(response);
            setLoading(false);
            return;
          }

          if (extractedWeight && !extractedMeals) {
            const today = new Date().toISOString().split("T")[0];
            const existingEntry = entries.find((e) => e.date === today);

            if (existingEntry) {
              const updatedEntry: DailyEntry = {
                ...existingEntry,
                weight: extractedWeight ?? undefined,
              };
              useDataStore.getState().updateEntry(updatedEntry);
            } else {
              const newEntry: DailyEntry = {
                id: `entry-${Date.now()}`,
                date: today,
                meals: [],
                weight: extractedWeight ?? undefined,
              };
              addEntry(newEntry);
            }

            const assistantMessage: ChatMessage = {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: "",
              timestamp: Date.now(),
            };
            addMessage(assistantMessage);

            const updatedEntries = useDataStore.getState().entries;
            const currentContext = useDataStore.getState().context;
            const response = await callLLM(
              [...messages, userMessage],
              {
                apiKey: OPENROUTER_API_KEY,
              },
              {
                profile: profile || undefined,
                entries: updatedEntries,
                goal: goal || undefined,
                context: currentContext || undefined,
              }
            );

            updateLastMessage(response);
            setLoading(false);
            return;
          }
        }

        const lowerMessage = content.trim().toLowerCase();
        const isStatsQuery =
          lowerMessage.includes("статистик") ||
          lowerMessage.includes("прогресс") ||
          lowerMessage.includes("результат") ||
          lowerMessage.includes("как дела") ||
          lowerMessage.includes("как идут дела");

        const isGoalQuery =
          lowerMessage.includes("цель") ||
          lowerMessage.includes("норма") ||
          lowerMessage.includes("кбжу") ||
          lowerMessage.includes("сколько нужно");

        if (isStatsQuery && profile && entries.length > 0) {
          const stats = calculateStats(entries);
          const statsText = `\n\n📊 Статистика:
- Всего записей: ${entries.length}
${
  stats.averageWeight
    ? `- Средний вес: ${stats.averageWeight.toFixed(1)} кг`
    : ""
}
${
  stats.weightChange
    ? `- Изменение веса: ${
        stats.weightChange > 0 ? "+" : ""
      }${stats.weightChange.toFixed(1)} кг`
    : ""
}
- Средне за день:
  • Калории: ${stats.averageDailyCalories} ккал
  • Белки: ${stats.averageDailyProtein} г
  • Жиры: ${stats.averageDailyFat} г
  • Углеводы: ${stats.averageDailyCarbs} г`;

          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: "",
            timestamp: Date.now(),
          };
          addMessage(assistantMessage);

          const currentContext = useDataStore.getState().context;
          const response = await callLLM(
            [...messages, userMessage],
            {
              apiKey: OPENROUTER_API_KEY,
            },
            {
              profile: profile || undefined,
              entries,
              goal: goal || undefined,
              context: currentContext || undefined,
            }
          );

          updateLastMessage(`${response}${statsText}`);
          setLoading(false);
          return;
        }

        if (isGoalQuery && profile && goal) {
          const goalText = `\n\n🎯 Твои цели КБЖУ:
- Калории: ${goal.calories} ккал
- Белки: ${goal.protein} г
- Жиры: ${goal.fat} г
- Углеводы: ${goal.carbs} г`;

          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: "",
            timestamp: Date.now(),
          };
          addMessage(assistantMessage);

          const currentContext = useDataStore.getState().context;
          const response = await callLLM(
            [...messages, userMessage],
            {
              apiKey: OPENROUTER_API_KEY,
            },
            {
              profile: profile || undefined,
              entries,
              goal: goal || undefined,
              context: currentContext || undefined,
            }
          );

          updateLastMessage(`${response}${goalText}`);
          setLoading(false);
          return;
        }

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "",
          timestamp: Date.now(),
        };

        addMessage(assistantMessage);

        const currentContext = useDataStore.getState().context;
        const response = await callLLM(
          [...messages, userMessage],
          {
            apiKey: OPENROUTER_API_KEY,
          },
          {
            profile: profile || undefined,
            entries,
            goal: goal || undefined,
            context: currentContext || undefined,
          }
        );

        updateLastMessage(response);
      } catch (error) {
        console.error("Error calling LLM:", error);
        updateLastMessage(
          `Извините, произошла ошибка при обработке запроса: ${
            error instanceof Error ? error.message : "Неизвестная ошибка"
          }`
        );
      } finally {
        setLoading(false);
      }
    },
    [
      messages,
      isLoading,
      profile,
      entries,
      goal,
      addMessage,
      updateLastMessage,
      setLoading,
      handleCommand,
      handleResetConfirmation,
      setProfile,
      addEntry,
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
