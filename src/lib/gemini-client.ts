import { getGeminiApiKey } from "@/lib/gemini";

const MODEL = "gemini-2.0-flash";

async function generateJSON<T>(prompt: string): Promise<T> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("No Gemini API key set");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
  return JSON.parse(text) as T;
}

export interface SuggestedSlot {
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
}

export async function suggestSlots(userText: string): Promise<SuggestedSlot[]> {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const prompt = `Today is ${today}.
The user wants to schedule a group event and said: "${userText}"

Extract the time slots they want to offer. Return a JSON array where each item has:
- date: "YYYY-MM-DD" (infer from context; weekdays = nearest future weekday)
- startTime: "HH:MM" (24-hour; use sensible defaults if vague — lunch = 12:00, morning = 09:00, afternoon = 14:00)
- endTime: "HH:MM" (default duration: 1 hour if not specified)

Only return valid JSON array, nothing else. Example:
[{"date":"2026-03-18","startTime":"12:00","endTime":"13:00"},{"date":"2026-03-19","startTime":"12:00","endTime":"13:00"}]`;

  return generateJSON<SuggestedSlot[]>(prompt);
}

export interface SlotForParsing {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

export async function parseAvailability(
  userText: string,
  slots: SlotForParsing[]
): Promise<string[]> {
  const slotList = slots
    .map((s) => {
      const d = new Date(`${s.date}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric",
      });
      return `- id="${s.id}" → ${d} ${s.startTime}–${s.endTime}`;
    })
    .join("\n");

  const prompt = `The user said about their availability: "${userText}"

Available time slots:
${slotList}

Return a JSON array of slot IDs the user IS available for based on their message.
If they say "free on Wednesday" include all Wednesday slots. If they say "not free Thursday" exclude Thursday slots.
Only return a JSON array of strings (the IDs), nothing else. Example: ["abc123","def456"]`;

  return generateJSON<string[]>(prompt);
}
