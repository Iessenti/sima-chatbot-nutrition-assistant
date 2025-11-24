import { parseCommand, type Command } from "@/lib/commandHandler";
import {
  calculateDailyKBJU,
  calculateStats,
  calculateKBJUGoal,
} from "@/lib/calculations";
import type {
  ActivityLogEntry,
  DailyEntry,
  KBJUGoal,
  UserProfile,
} from "@/lib/types";

interface CommandContext {
  profile: UserProfile | null;
  entries: DailyEntry[];
  goal: KBJUGoal | null;
  activityLog: ActivityLogEntry[];
}

interface CommandResult {
  handled: boolean;
  response?: string;
  command?: Command;
}

const directCommands: Command[] = [
  "help",
  "profile",
  "goal",
  "stats",
  "today",
  "activity",
];

export function processCommandMessage(
  message: string,
  ctx: CommandContext
): CommandResult {
  const command = parseCommand(message);

  if (!command) {
    return { handled: false };
  }

  if (!directCommands.includes(command)) {
    return { handled: false, command };
  }

  const handler = commandHandlers[command];

  if (!handler) {
    return { handled: false, command };
  }

  const response = handler(ctx);

  if (!response) {
    return { handled: false, command };
  }

  return {
    handled: true,
    response,
    command,
  };
}

type CommandHandler = (ctx: CommandContext) => string | null;

const commandHandlers: Partial<Record<Command, CommandHandler>> = {
  help: () => buildHelpMessage(),
  profile: ({ profile }) => buildProfileMessage(profile),
  goal: ({ profile, goal }) => buildGoalMessage(profile, goal),
  stats: ({ entries }) => buildStatsMessage(entries),
  today: ({ entries, goal }) => buildTodayMessage(entries, goal),
  activity: ({ activityLog }) => buildActivityMessage(activityLog),
};

function buildHelpMessage(): string {
  const commandsList = [
    "🔹 /start — начать работу и создать профиль",
    "🔹 /profile — показать профиль",
    "🔹 /add — добавить запись о еде, весе или активности",
    "🔹 /today — показать прогресс за сегодня",
    "🔹 /stats — статистика за последние дни",
    "🔹 /goal — показать текущие цели КБЖУ",
    "🔹 /activity — история действий",
    "🔹 /export — экспорт данных",
    "🔹 /reset — сбросить данные",
  ];

  return [
    "Доступные команды:",
    ...commandsList,
    "",
    "Ты всегда можешь писать естественным языком — я пойму.",
  ].join("\n");
}

function buildProfileMessage(profile: UserProfile | null): string | null {
  if (!profile) {
    return "Профиль ещё не создан. Используй /start, чтобы заполнить данные.";
  }

  const lines = [
    "Текущий профиль:",
    `• Рост: ${profile.height} см`,
    `• Вес: ${profile.weight} кг`,
    `• Возраст: ${profile.age} лет`,
    `• Пол: ${profile.gender === "male" ? "мужской" : "женский"}`,
    `• Активность: ${profile.activityLevel}`,
    `• Цель: ${
      profile.goal === "lose"
        ? "похудение"
        : profile.goal === "gain"
        ? "набор веса"
        : "поддержание веса"
    }`,
  ];

  if (profile.targetWeight) {
    lines.push(`• Целевой вес: ${profile.targetWeight} кг`);
  }

  lines.push("", "Чтобы изменить что-то, просто напиши об этом.");

  return lines.join("\n");
}

function buildGoalMessage(
  profile: UserProfile | null,
  goal: KBJUGoal | null
): string | null {
  if (!profile) {
    return "Сначала создай профиль через /start.";
  }

  const goalData = goal ?? calculateKBJUGoal(profile);

  const lines = [
    "Текущие цели КБЖУ:",
    `• Калории: ${goalData.calories} ккал`,
    `• Белки: ${goalData.protein} г`,
    `• Жиры: ${goalData.fat} г`,
    `• Углеводы: ${goalData.carbs} г`,
    "",
    "Если хочешь изменить цели, напиши новые значения или обнови профиль.",
  ];

  return lines.join("\n");
}

function buildStatsMessage(entries: DailyEntry[]): string | null {
  if (entries.length === 0) {
    return "Пока нет записей. Используй /add, чтобы добавить первую запись.";
  }

  const stats = calculateStats(entries.slice(-14));

  const lines = [
    "Статистика (последние записи):",
    `• Записей: ${entries.length}`,
    stats.averageWeight
      ? `• Средний вес: ${stats.averageWeight.toFixed(1)} кг`
      : "• Средний вес: недостаточно данных",
    stats.weightChange
      ? `• Изменение веса: ${
          stats.weightChange > 0 ? "+" : ""
        }${stats.weightChange.toFixed(1)} кг`
      : "• Нет динамики веса",
    "",
    "В среднем за день:",
    `• Калории: ${stats.averageDailyCalories} ккал`,
    `• Белки: ${stats.averageDailyProtein} г`,
    `• Жиры: ${stats.averageDailyFat} г`,
    `• Углеводы: ${stats.averageDailyCarbs} г`,
  ];

  return lines.join("\n");
}

function buildTodayMessage(
  entries: DailyEntry[],
  goal: KBJUGoal | null
): string | null {
  const today = new Date().toISOString().split("T")[0];
  const entry = entries.find((e) => e.date === today);

  if (!entry) {
    return "Сегодня ещё нет записей. Используй /add, чтобы добавить еду, вес или активность.";
  }

  const totals = calculateDailyKBJU(entry);
  const lines = [
    `Записи за ${today}:`,
    entry.meals.length
      ? `• Блюда: ${entry.meals.map((m) => m.name).join(", ")}`
      : "• Блюда: пока ничего",
    entry.weight ? `• Вес: ${entry.weight} кг` : "• Вес: не записан",
    entry.activity
      ? `• Активность: ${entry.activity.type}${
          entry.activity.duration ? `, ${entry.activity.duration} мин` : ""
        }`
      : "• Активность: не добавлена",
    "",
    "Фактические КБЖУ:",
    `• Калории: ${totals.calories} ккал`,
    `• Белки: ${totals.protein} г`,
    `• Жиры: ${totals.fat} г`,
    `• Углеводы: ${totals.carbs} г`,
  ];

  if (goal) {
    lines.push("", "Осталось до цели:");
    lines.push(
      `• Калории: ${Math.max(goal.calories - totals.calories, 0)} ккал`
    );
    lines.push(`• Белки: ${Math.max(goal.protein - totals.protein, 0)} г`);
    lines.push(`• Жиры: ${Math.max(goal.fat - totals.fat, 0)} г`);
    lines.push(`• Углеводы: ${Math.max(goal.carbs - totals.carbs, 0)} г`);
  }

  return lines.join("\n");
}

function buildActivityMessage(activityLog: ActivityLogEntry[]): string | null {
  if (activityLog.length === 0) {
    return "История действий пуста. Всё, что ты будешь делать, появится здесь.";
  }

  const recent = activityLog.slice(0, 5);

  const lines = ["Последние действия:"];

  recent.forEach((entry) => {
    const time = new Date(entry.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    lines.push(`• [${time}] ${entry.description}`);
  });

  return lines.join("\n");
}
