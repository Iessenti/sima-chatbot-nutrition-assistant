import type {
  ChatMessage,
  UserProfile,
  DailyEntry,
  Meal,
  KBJUGoal,
  Activity,
  LLMResponse,
  LLMProfileData,
  LLMMealData,
} from "@/lib/types";
import { enrichMealData } from "@/lib/mealEstimation";
import { calculateKBJUGoal } from "@/lib/calculations";
import { calculateActivityCalories } from "@/lib/activityCalories";
import {
  updateProfileFromExtractedData,
  shouldRecalculateGoal,
  getChangedFields,
} from "@/lib/profileUpdate";
import type { UserContext } from "@/lib/types";
import { callLLMWithContext, type LLMContext } from "./llmService";
import { useActivityLogStore } from "@/store/activityLogStore";

export interface ProcessResult {
  type:
    | "profile_created"
    | "profile_updated"
    | "goal_updated"
    | "entry_added"
    | "stats_shown"
    | "goal_shown"
    | "general";
  response: string;
}

export interface MessageProcessorDependencies {
  profile: UserProfile | null;
  entries: DailyEntry[];
  goal: KBJUGoal | null;
  context: UserContext | null;
  messages: ChatMessage[];
  userMessage: ChatMessage;
  apiKey: string;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addEntry: (entry: DailyEntry) => void;
  updateEntry: (entry: DailyEntry) => void;
  setGoal: (goal: KBJUGoal) => void;
  updateContext: (updates: Partial<UserContext>) => void;
}

function parseLLMResponse(text: string): LLMResponse | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }
    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.action && parsed.response) {
      return parsed as LLMResponse;
    }
  } catch (error) {
    console.error("Error parsing LLM response:", error);
  }
  return null;
}

function createProfileFromData(data: LLMProfileData): UserProfile {
  return {
    height: data.height ?? 175,
    weight: data.weight ?? 70,
    age: data.age ?? 25,
    gender: data.gender ?? "male",
    activityLevel: data.activityLevel ?? "sedentary",
    goal: data.goal ?? "maintain",
    targetWeight: data.targetWeight,
  };
}

async function handleCreateProfile(
  deps: MessageProcessorDependencies,
  llmResponse: LLMResponse
): Promise<ProcessResult> {
  if (!llmResponse.data?.profile) {
    return { type: "general", response: llmResponse.response };
  }

  const newProfile = createProfileFromData(llmResponse.data.profile);
  deps.setProfile(newProfile);

  const calculatedGoal = calculateKBJUGoal(newProfile);
  deps.setGoal(calculatedGoal);

  useActivityLogStore.getState().addEntry({
    actionType: "profile_created",
    description: `Создан профиль: возраст ${newProfile.age}, рост ${
      newProfile.height
    } см, вес ${newProfile.weight} кг, цель: ${
      newProfile.goal === "lose"
        ? "похудение"
        : newProfile.goal === "gain"
        ? "набор веса"
        : "поддержание веса"
    }`,
    data: { profile: newProfile },
    messageId: deps.userMessage.id,
  });

  return { type: "profile_created", response: llmResponse.response };
}

async function handleUpdateProfile(
  deps: MessageProcessorDependencies,
  llmResponse: LLMResponse
): Promise<ProcessResult | null> {
  if (!deps.profile || !llmResponse.data?.profile) {
    return null;
  }

  const profileData = llmResponse.data.profile;
  const hasChanges =
    (profileData.height != null &&
      profileData.height !== deps.profile.height) ||
    (profileData.weight != null &&
      profileData.weight !== deps.profile.weight) ||
    (profileData.age != null && profileData.age !== deps.profile.age) ||
    (profileData.gender != null &&
      profileData.gender !== deps.profile.gender) ||
    (profileData.activityLevel != null &&
      profileData.activityLevel !== deps.profile.activityLevel) ||
    (profileData.goal != null && profileData.goal !== deps.profile.goal) ||
    (profileData.targetWeight != null &&
      profileData.targetWeight !== deps.profile.targetWeight);

  if (!hasChanges) {
    return null;
  }

  const updatedProfile = updateProfileFromExtractedData(
    profileData,
    deps.profile
  );
  deps.updateProfile(updatedProfile);

  let updatedGoal = deps.goal;
  if (shouldRecalculateGoal(profileData, deps.profile)) {
    updatedGoal = calculateKBJUGoal(updatedProfile);
    deps.setGoal(updatedGoal);
  }

  const changedFields = getChangedFields(profileData, deps.profile);

  if (changedFields.length > 0) {
    useActivityLogStore.getState().addEntry({
      actionType: "profile_updated",
      description: `Обновлен профиль: ${changedFields.join(", ")}`,
      data: { profile: updatedProfile },
      messageId: deps.userMessage.id,
    });
  }

  return { type: "profile_updated", response: llmResponse.response };
}

async function handleUpdateGoal(
  deps: MessageProcessorDependencies,
  llmResponse: LLMResponse
): Promise<ProcessResult | null> {
  if (!deps.goal || !llmResponse.data?.goal) {
    return null;
  }

  const goalData = llmResponse.data.goal;
  const hasGoalChanges =
    (goalData.calories != null && goalData.calories !== deps.goal.calories) ||
    (goalData.protein != null && goalData.protein !== deps.goal.protein) ||
    (goalData.fat != null && goalData.fat !== deps.goal.fat) ||
    (goalData.carbs != null && goalData.carbs !== deps.goal.carbs);

  if (!hasGoalChanges) {
    return null;
  }

  const updatedGoal: KBJUGoal = {
    calories: goalData.calories ?? deps.goal.calories,
    protein: goalData.protein ?? deps.goal.protein,
    fat: goalData.fat ?? deps.goal.fat,
    carbs: goalData.carbs ?? deps.goal.carbs,
  };

  deps.setGoal(updatedGoal);

  useActivityLogStore.getState().addEntry({
    actionType: "goal_updated",
    description: `Обновлены цели КБЖУ: ${updatedGoal.calories} ккал, Б: ${updatedGoal.protein}г, Ж: ${updatedGoal.fat}г, У: ${updatedGoal.carbs}г`,
    data: { goal: updatedGoal },
    messageId: deps.userMessage.id,
  });

  return { type: "goal_updated", response: llmResponse.response };
}

async function handleAddEntry(
  deps: MessageProcessorDependencies,
  llmResponse: LLMResponse
): Promise<ProcessResult | null> {
  if (!llmResponse.data) {
    return null;
  }

  const targetDate =
    llmResponse.data.targetDate || new Date().toISOString().split("T")[0];
  const existingEntry = deps.entries.find((e) => e.date === targetDate);

  let hasMeals = false;
  let hasWeight = false;
  let hasActivity = false;

  if (llmResponse.data.meals && llmResponse.data.meals.length > 0) {
    hasMeals = true;
    const enrichedMeals = await enrichMealData(
      llmResponse.data.meals as LLMMealData[]
    );
    const meals: Meal[] = enrichedMeals.map((m, idx) => ({
      id: `meal-${Date.now()}-${idx}`,
      name: m.name,
      calories: m.calories || 0,
      protein: m.protein || 0,
      fat: m.fat || 0,
      carbs: m.carbs || 0,
    }));

    if (existingEntry) {
      const updatedEntry: DailyEntry = {
        ...existingEntry,
        meals: [...existingEntry.meals, ...meals],
        weight: llmResponse.data.weight ?? existingEntry.weight,
      };
      deps.updateEntry(updatedEntry);
    } else {
      const newEntry: DailyEntry = {
        id: `entry-${Date.now()}`,
        date: targetDate,
        meals,
        weight: llmResponse.data.weight,
      };
      deps.addEntry(newEntry);
    }

    const mealNames = meals.map((m) => m.name).join(", ");
    const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
    useActivityLogStore.getState().addEntry({
      actionType: "meal_added",
      description: `Добавлена еда: ${mealNames} (${totalCalories} ккал)`,
      data: { meals },
      messageId: deps.userMessage.id,
    });
  }

  if (llmResponse.data.weight != null) {
    hasWeight = true;
    if (existingEntry) {
      const updatedEntry: DailyEntry = {
        ...existingEntry,
        weight: llmResponse.data.weight,
      };
      deps.updateEntry(updatedEntry);
    } else {
      const newEntry: DailyEntry = {
        id: `entry-${Date.now()}`,
        date: targetDate,
        meals: [],
        weight: llmResponse.data.weight,
      };
      deps.addEntry(newEntry);
    }

    useActivityLogStore.getState().addEntry({
      actionType: "weight_recorded",
      description: `Записан вес: ${llmResponse.data.weight} кг`,
      data: { weight: llmResponse.data.weight },
      messageId: deps.userMessage.id,
    });
  }

  if (llmResponse.data.activity) {
    hasActivity = true;
    const userWeight = deps.profile?.weight || 70;
    const activityData = llmResponse.data.activity;
    const calculatedCalories = calculateActivityCalories(
      activityData as Activity,
      userWeight
    );

    const activity: Activity = {
      type: activityData.type,
      duration: activityData.duration,
      calories: activityData.calories ?? calculatedCalories,
      description: activityData.description,
    };

    if (existingEntry) {
      const updatedEntry: DailyEntry = {
        ...existingEntry,
        activity: activity,
        weight: llmResponse.data.weight ?? existingEntry.weight,
      };
      deps.updateEntry(updatedEntry);
    } else {
      const newEntry: DailyEntry = {
        id: `entry-${Date.now()}`,
        date: targetDate,
        meals: [],
        weight: llmResponse.data.weight,
        activity: activity,
      };
      deps.addEntry(newEntry);
    }

    const activityTypeNames: Record<string, string> = {
      walking: "ходьба",
      running: "бег",
      gym: "тренировка в зале",
      cycling: "езда на велосипеде",
      other: "активность",
    };

    useActivityLogStore.getState().addEntry({
      actionType: "activity_recorded",
      description: `Записана активность: ${activityTypeNames[activity.type]}${
        activity.duration ? ` (${activity.duration} мин)` : ""
      }${activity.calories ? ` - ${activity.calories} ккал` : ""}`,
      data: { activity },
      messageId: deps.userMessage.id,
    });
  }

  if (llmResponse.data.context) {
    deps.updateContext(llmResponse.data.context);
    const contextChanges: string[] = [];
    if (llmResponse.data.context.name) {
      contextChanges.push(`имя: ${llmResponse.data.context.name}`);
    }
    if (
      llmResponse.data.context.preferences &&
      llmResponse.data.context.preferences.length > 0
    ) {
      contextChanges.push(
        `предпочтения: ${llmResponse.data.context.preferences.join(", ")}`
      );
    }
    if (llmResponse.data.context.notes) {
      contextChanges.push(`заметки: ${llmResponse.data.context.notes}`);
    }
    if (contextChanges.length > 0) {
      useActivityLogStore.getState().addEntry({
        actionType: "context_updated",
        description: `Обновлен контекст: ${contextChanges.join(", ")}`,
        data: { context: llmResponse.data.context },
        messageId: deps.userMessage.id,
      });
    }
  }

  if (!hasMeals && !hasWeight && !hasActivity) {
    return null;
  }

  return { type: "entry_added", response: llmResponse.response };
}

export async function processMessage(
  deps: MessageProcessorDependencies
): Promise<ProcessResult> {
  const llmContext: LLMContext = {
    profile: deps.profile || undefined,
    entries: deps.entries,
    goal: deps.goal || undefined,
    context: deps.context || undefined,
  };

  const response = await callLLMWithContext(
    [...deps.messages, deps.userMessage],
    { apiKey: deps.apiKey },
    llmContext
  );

  const parsedResponse = parseLLMResponse(response);

  if (!parsedResponse) {
    return { type: "general", response };
  }

  switch (parsedResponse.action) {
    case "create_profile":
      return await handleCreateProfile(deps, parsedResponse);

    case "update_profile": {
      const result = await handleUpdateProfile(deps, parsedResponse);
      if (result) return result;
      break;
    }

    case "update_goal": {
      const result = await handleUpdateGoal(deps, parsedResponse);
      if (result) return result;
      break;
    }

    case "add_entry": {
      const result = await handleAddEntry(deps, parsedResponse);
      if (result) return result;
      break;
    }

    case "show_stats":
      return { type: "stats_shown", response: parsedResponse.response };

    case "show_goal":
      return { type: "goal_shown", response: parsedResponse.response };

    case "general":
    default:
      return { type: "general", response: parsedResponse.response };
  }

  return { type: "general", response: parsedResponse.response };
}
