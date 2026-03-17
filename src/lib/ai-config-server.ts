import { getPocketBaseAdmin } from "./pb-admin";

export async function getEventAIKey(eventId: string): Promise<{ provider: string; apiKey: string } | null> {
  try {
    const pb = getPocketBaseAdmin();
    const event = await pb.collection("events").getOne(eventId, { fields: "ai_key,ai_provider" });
    if (event.ai_key && event.ai_provider) {
      return { provider: event.ai_provider, apiKey: event.ai_key };
    }
  } catch { /* field doesn't exist yet */ }
  return null;
}

export async function saveEventAIKey(eventId: string, provider: string, apiKey: string): Promise<void> {
  const pb = getPocketBaseAdmin();
  await pb.collection("events").update(eventId, { ai_key: apiKey, ai_provider: provider });
}

export async function clearEventAIKey(eventId: string): Promise<void> {
  const pb = getPocketBaseAdmin();
  await pb.collection("events").update(eventId, { ai_key: null, ai_provider: null });
}
