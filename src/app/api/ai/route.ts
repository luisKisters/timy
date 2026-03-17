import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject, generateText, LanguageModel } from "ai";
import { z } from "zod";
import { NextRequest } from "next/server";

function getModel(provider: string, apiKey: string): LanguageModel {
  if (provider === "google") {
    return createGoogleGenerativeAI({ apiKey })("gemini-2.0-flash");
  } else if (provider === "openai") {
    return createOpenAI({ apiKey })("gpt-4o-mini");
  } else if (provider === "anthropic") {
    return createAnthropic({ apiKey })("claude-haiku-4-5-20251001");
  }
  throw new Error(`Unknown provider: ${provider}`);
}

const SuggestedSlotSchema = z.array(z.object({
  date: z.string().describe("YYYY-MM-DD"),
  startTime: z.string().describe("HH:MM 24-hour"),
  endTime: z.string().describe("HH:MM 24-hour"),
}));

const SlotIdsSchema = z.array(z.string()).describe("Array of slot IDs the user is available for");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, provider, apiKey, ...data } = body;

    if (!apiKey) {
      return Response.json({ error: "No API key provided" }, { status: 400 });
    }

    const model = getModel(provider, apiKey);

    if (action === "suggest-slots") {
      const prompt = `Today is ${data.today}.
The user wants to schedule a group event and said: "${data.userText}"

Extract the time slots they want to offer. Return a JSON array where each item has:
- date: "YYYY-MM-DD" (infer from context; weekdays = nearest future weekday)
- startTime: "HH:MM" (24-hour; use sensible defaults if vague — lunch = 12:00, morning = 09:00, afternoon = 14:00)
- endTime: "HH:MM" (default duration: 1 hour if not specified)`;

      const { object } = await generateObject({ model, schema: SuggestedSlotSchema, prompt });
      return Response.json({ slots: object });
    }

    if (action === "parse-availability") {
      const slotList = (data.slots as Array<{ id: string; date: string; startTime: string; endTime: string }>)
        .map((s) => {
          const d = new Date(`${s.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
          return `- id="${s.id}" → ${d} ${s.startTime}–${s.endTime}`;
        }).join("\n");

      const prompt = `The user said about their availability: "${data.userText}"

Available time slots:
${slotList}

Return a JSON array of slot IDs the user IS available for based on their message.
If they say "free on Wednesday" include all Wednesday slots. If they say "not free Thursday" exclude Thursday slots.`;

      const { object } = await generateObject({ model, schema: SlotIdsSchema, prompt });
      return Response.json({ ids: object });
    }

    if (action === "suggest-best") {
      const slotDescriptions = (data.ranked as Array<{ slot: { start: string; end: string }; availableCount: number; totalCount: number; percentage: number }>)
        .slice(0, 5).map((r, i) => {
          const start = new Date(r.slot.start);
          const end = new Date(r.slot.end);
          const day = start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
          const time = `${start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}–${end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
          return `${i + 1}. ${day} ${time}: ${r.availableCount}/${r.totalCount} available (${r.percentage}%)`;
        }).join("\n");

      const prompt = `You're helping schedule "${data.eventTitle}" with participants: ${(data.participantNames as string[]).join(", ")}.

Ranked time slots by availability:
${slotDescriptions}

In 1-2 sentences, explain which slot is best and why. Be concise and friendly. Don't use markdown.`;

      const { text } = await generateText({ model, prompt });
      return Response.json({ text });
    }

    if (action === "transcribe-slots") {
      if (provider === "google") {
        const prompt = `Today is ${data.today}. The user recorded a voice message about scheduling a group event.
Listen to the audio and extract the time slots they want to offer.
Return a JSON array where each item has date (YYYY-MM-DD), startTime (HH:MM 24-hour), endTime (HH:MM 24-hour; default 1-hour duration if not specified).`;

        const googleModel = createGoogleGenerativeAI({ apiKey: data.apiKey ?? apiKey })("gemini-2.0-flash");
        const { object } = await generateObject({
          model: googleModel,
          schema: SuggestedSlotSchema,
          messages: [{
            role: "user",
            content: [
              { type: "file", data: data.audioBase64, mediaType: data.audioMimeType },
              { type: "text", text: prompt },
            ],
          }],
        });
        return Response.json({ slots: object });
      } else if (provider === "openai") {
        // OpenAI: transcribe with Whisper then extract slots
        const audioBuffer = Buffer.from(data.audioBase64, "base64");
        const { createOpenAI: openaiCreate } = await import("@ai-sdk/openai");

        // Use fetch to call Whisper API directly
        const formData = new FormData();
        const audioBlob = new Blob([audioBuffer], { type: data.audioMimeType });
        formData.append("file", audioBlob, "audio.webm");
        formData.append("model", "whisper-1");

        const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: formData,
        });

        if (!whisperRes.ok) {
          const err = await whisperRes.text();
          throw new Error(`Whisper API error: ${err}`);
        }

        const { text: transcript } = await whisperRes.json();
        const textModel = openaiCreate({ apiKey })("gpt-4o-mini");
        const today = data.today;
        const prompt = `Today is ${today}. The user said: "${transcript}"
Extract time slots for a scheduling event. Return a JSON array with date (YYYY-MM-DD), startTime (HH:MM), endTime (HH:MM).`;
        const { object } = await generateObject({ model: textModel, schema: SuggestedSlotSchema, prompt });
        return Response.json({ slots: object });
      }
      return Response.json({ error: "Audio transcription not supported for this provider" }, { status: 400 });
    }

    if (action === "transcribe-availability") {
      const slotList = (data.slots as Array<{ id: string; date: string; startTime: string; endTime: string }>)
        .map((s) => {
          const d = new Date(`${s.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
          return `- id="${s.id}" → ${d} ${s.startTime}–${s.endTime}`;
        }).join("\n");

      if (provider === "google") {
        const prompt = `The user recorded a voice message about their availability.
Available slots:\n${slotList}
Return a JSON array of slot IDs the user IS available for. Only return valid JSON array of strings.`;

        const googleModel = createGoogleGenerativeAI({ apiKey })("gemini-2.0-flash");
        const { object } = await generateObject({
          model: googleModel,
          schema: SlotIdsSchema,
          messages: [{
            role: "user",
            content: [
              { type: "file", data: data.audioBase64, mediaType: data.audioMimeType },
              { type: "text", text: prompt },
            ],
          }],
        });
        return Response.json({ ids: object });
      } else if (provider === "openai") {
        const audioBuffer = Buffer.from(data.audioBase64, "base64");
        const formData = new FormData();
        const audioBlob = new Blob([audioBuffer], { type: data.audioMimeType });
        formData.append("file", audioBlob, "audio.webm");
        formData.append("model", "whisper-1");

        const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: formData,
        });
        if (!whisperRes.ok) throw new Error(`Whisper error: ${await whisperRes.text()}`);
        const { text: transcript } = await whisperRes.json();

        const openaiModel = createOpenAI({ apiKey })("gpt-4o-mini");
        const prompt = `The user said: "${transcript}"\n\nAvailable slots:\n${slotList}\nReturn a JSON array of slot IDs the user IS available for.`;
        const { object } = await generateObject({ model: openaiModel, schema: SlotIdsSchema, prompt });
        return Response.json({ ids: object });
      }
      return Response.json({ error: "Audio transcription not supported for this provider" }, { status: 400 });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    // Parse provider-specific error messages
    const friendly = formatAIError(message);
    return Response.json({ error: friendly }, { status: 500 });
  }
}

function formatAIError(message: string): string {
  if (message.includes("API_KEY_INVALID") || message.includes("invalid api key") || message.includes("Incorrect API key")) {
    return "Invalid API key. Please check your key in the settings (🔑).";
  }
  if (message.includes("quota") || message.includes("rate limit") || message.includes("429")) {
    return "Rate limit exceeded. Please wait a moment and try again.";
  }
  if (message.includes("model") && message.includes("not found")) {
    return "AI model not available. Try a different provider.";
  }
  return message;
}
