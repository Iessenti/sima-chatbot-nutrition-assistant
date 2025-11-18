import { callLLM } from "@/lib/openrouter";
import type { ChatMessage, UserProfile, DailyEntry, KBJUGoal, UserContext } from "@/lib/types";

export interface LLMContext {
  profile?: UserProfile;
  entries: DailyEntry[];
  goal?: KBJUGoal;
  context?: UserContext;
}

export interface LLMConfig {
  apiKey: string;
  model?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function callLLMWithContext(
  messages: ChatMessage[],
  config: LLMConfig,
  userData?: LLMContext,
  retries = MAX_RETRIES
): Promise<string> {
  try {
    return await callLLM(messages, config, userData);
  } catch (error) {
    if (retries > 0) {
      await delay(RETRY_DELAY);
      return callLLMWithContext(messages, config, userData, retries - 1);
    }
    throw error;
  }
}

