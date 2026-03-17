export type AIProvider = "google" | "openai" | "anthropic";

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
}

const STORAGE_KEY = "timy-ai-config";

export function getAIConfig(): AIConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setAIConfig(config: AIConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function removeAIConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

// Legacy Gemini key migration: if old key exists, migrate on first call
export function getOrMigrateAIConfig(): AIConfig | null {
  const existing = getAIConfig();
  if (existing) return existing;
  // Migrate old Gemini key
  const legacyKey = localStorage.getItem("timy-gemini-api-key");
  if (legacyKey) {
    const config: AIConfig = { provider: "google", apiKey: legacyKey };
    setAIConfig(config);
    localStorage.removeItem("timy-gemini-api-key");
    return config;
  }
  return null;
}
