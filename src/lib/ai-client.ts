import { getOrMigrateAIConfig, type AIConfig } from "./ai-config";

export interface SuggestedSlot { date: string; startTime: string; endTime: string; }
export interface SlotForParsing { id: string; date: string; startTime: string; endTime: string; }
export interface SlotScore {
  slot: { id: string; start: string; end: string };
  availableCount: number;
  totalCount: number;
  percentage: number;
}

async function callAI(action: string, config: AIConfig, data: Record<string, unknown>) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, provider: config.provider, apiKey: config.apiKey, ...data }),
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error ?? "AI request failed");
  return json;
}

function getConfig(): AIConfig {
  const config = getOrMigrateAIConfig();
  if (!config) throw new Error("No AI provider configured. Tap 🔑 to add your API key.");
  return config;
}

export async function suggestSlots(userText: string): Promise<SuggestedSlot[]> {
  const config = getConfig();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const { slots } = await callAI("suggest-slots", config, { today, userText });
  return slots;
}

export async function parseAvailability(userText: string, slots: SlotForParsing[]): Promise<string[]> {
  const config = getConfig();
  const { ids } = await callAI("parse-availability", config, { userText, slots });
  return ids;
}

export async function suggestBestSlot(ranked: SlotScore[], eventTitle: string, participantNames: string[]): Promise<string> {
  const config = getConfig();
  const { text } = await callAI("suggest-best", config, { ranked, eventTitle, participantNames });
  return text;
}

export async function transcribeAndSuggestSlots(audioBlob: Blob): Promise<SuggestedSlot[]> {
  const config = getConfig();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const audioBase64 = await blobToBase64(audioBlob);
  const { slots } = await callAI("transcribe-slots", config, { today, audioBase64, audioMimeType: audioBlob.type || "audio/webm" });
  return slots;
}

export async function transcribeAndParseAvailability(audioBlob: Blob, slots: SlotForParsing[]): Promise<string[]> {
  const config = getConfig();
  const audioBase64 = await blobToBase64(audioBlob);
  const { ids } = await callAI("transcribe-availability", config, { audioBase64, audioMimeType: audioBlob.type || "audio/webm", slots });
  return ids;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => { resolve((reader.result as string).split(",")[1]); };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
