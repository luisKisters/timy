export const en = {
  // Home
  "home.title": "Timy",
  "home.subtitle": "AI-assisted scheduling, made simple.",
  "home.cta": "Create Event",
  // Create
  "create.title": "Create Event",
  "create.subtitle": "Name your event and set the poll expiry.",
  "create.label.title": "Event name",
  "create.label.description": "Description",
  "create.label.description.hint": "optional",
  "create.label.expiry": "Poll closes",
  "create.btn.next": "Next",
  // Slots
  "slots.subtitle": "Pick the time slots participants can vote on.",
  "slots.btn.create": "Create Event",
  "slots.expiry.auto": "1 week after last slot",
  // Event
  "event.label.name": "Your name",
  "event.label.availability": "Your availability",
  "event.hint.tap": "tap to select",
  "event.hint.clear": "Esc to clear",
  "event.btn.submit": "Submit Availability",
  "event.btn.update": "Update Availability",
  "event.btn.edit": "Edit",
  "event.btn.viewResults": "View Results",
  "event.share.title": "Share this event",
  "event.share.hint": "Share with participants to collect their availability.",
  // Results
  "results.subtitle": "{n} participant{s} voted",
  "results.confirmed": "Confirmed",
  "results.best": "Best slot",
  "results.top": "Top slots",
  "results.confirm.tap": "tap to confirm",
  "results.btn.back": "← Back to Event",
  "results.btn.addCalendar": "Add to Calendar",
  "results.btn.refresh": "Refresh",
  "results.ai.btn": "Ask AI which slot is best",
  "results.ai.asking": "Asking AI…",
  "results.ai.label": "AI Suggestion",
  // AI Bar
  "ai.placeholder.slots": "e.g. 'Wednesday and Thursday lunches next week'",
  "ai.placeholder.availability": "Tell AI your availability, e.g. 'I'm free Tuesday'",
  "ai.recording": "Recording… tap ■ to send",
  // Errors
  "error.noKey": "Set your AI API key first (🔑 button)",
  "error.ai": "AI request failed",
} as const;

export type TranslationKey = keyof typeof en;

export function t(key: TranslationKey, vars?: Record<string, string | number>): string {
  let str = en[key] as string;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}
