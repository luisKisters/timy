const STORAGE_KEY = "timy-gemini-api-key";

export function getGeminiApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setGeminiApiKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key);
}

export function removeGeminiApiKey() {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasGeminiApiKey(): boolean {
  return !!getGeminiApiKey();
}
