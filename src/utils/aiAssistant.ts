import * as SecureStore from 'expo-secure-store';

const API_KEY_STORE_KEY = 'anthropic_api_key';
const MODEL = 'claude-haiku-4-5-20251001';

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface EventContext {
  eventName: string;
  eventDate: string | null;
  daysUntil: number | null;
  totalBudget: number | null;
  guestCount: number | null;
  completedTasks: number;
  totalTasks: number;
}

export async function getApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(API_KEY_STORE_KEY);
}

export async function saveApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(API_KEY_STORE_KEY, key.trim());
}

export async function deleteApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(API_KEY_STORE_KEY);
}

export async function sendMessage(
  messages: AiMessage[],
  ctx: EventContext,
): Promise<{ reply?: string; error?: string }> {
  const apiKey = await getApiKey();
  if (!apiKey) return { error: 'no_key' };

  const system = buildSystemPrompt(ctx);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system,
        messages: messages.slice(-20).map(m => ({ role: m.role, content: m.content })),
      }),
    });

    const data = await response.json();
    if (!response.ok) return { error: data.error?.message ?? 'API error' };
    return { reply: data.content?.[0]?.text ?? '' };
  } catch (e) {
    return { error: 'Network error. Please try again.' };
  }
}

function buildSystemPrompt(ctx: EventContext): string {
  const phase = ctx.daysUntil
    ? ctx.daysUntil > 365 ? '12+ months out'
    : ctx.daysUntil > 270 ? '9 months out'
    : ctx.daysUntil > 180 ? '6 months out'
    : ctx.daysUntil > 90  ? '3 months out'
    : ctx.daysUntil > 30  ? '1 month out'
    : 'final stretch'
    : 'early planning';

  return `You are a warm, experienced wedding planning assistant named Aisle.
You are helping plan a wedding called "${ctx.eventName}".
Wedding date: ${ctx.eventDate ?? 'not set yet'}.
Days until wedding: ${ctx.daysUntil ?? 'unknown'}.
Current planning phase: ${phase}.
Total budget: ${ctx.totalBudget ? `$${ctx.totalBudget.toLocaleString()}` : 'not set'}.
Guest count: ${ctx.guestCount ?? 'not set'}.
Checklist progress: ${ctx.completedTasks} of ${ctx.totalTasks} tasks complete.

Your role:
- Answer wedding planning questions with warmth and expertise
- Help draft emails to vendors (write complete, copy-paste ready emails)
- Suggest what to prioritize based on the current phase
- Give budget advice and typical cost breakdowns
- Help with etiquette questions
- Create day-of timelines when asked

Keep responses concise and actionable. Use bullet points for lists.
When drafting vendor emails, always write the complete email ready to copy-paste.
Be encouraging — planning a wedding is exciting!`;
}
