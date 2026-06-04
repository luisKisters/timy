import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import type { NextRequest } from "next/server";
import { GET } from "@/app/api/gcal/create/callback/route";
import { type CalendarConfig, decodeSlots, encodeConfig } from "@/lib/calendar-config";

const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
  process.env.GOOGLE_CLIENT_ID = "test-client";
  process.env.GOOGLE_CLIENT_SECRET = "test-secret";
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("create-time gcal callback", () => {
  test("returns free slots that exclude busy intervals (DST-aware)", async () => {
    // Berlin 2024-03-29 (CET): 09:00→08:00Z–09:00Z, 10:00→09:00Z–10:00Z
    const config: CalendarConfig = {
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      windowStart: "09:00",
      windowEnd: "11:00",
      intervalMin: 60,
      tz: "Europe/Berlin",
      fromISO: "2024-03-29T00:00:00.000Z",
      horizonDays: 1,
    };

    server.use(
      http.post("https://oauth2.googleapis.com/token", () =>
        HttpResponse.json({ access_token: "tok", token_type: "Bearer" }),
      ),
      http.get(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList",
        () => HttpResponse.json({ items: [{ id: "primary" }] }),
      ),
      http.post("https://www.googleapis.com/calendar/v3/freeBusy", () =>
        HttpResponse.json({
          kind: "calendar#freeBusy",
          calendars: {
            primary: {
              busy: [
                { start: "2024-03-29T08:00:00.000Z", end: "2024-03-29T09:00:00.000Z" },
              ],
            },
          },
        }),
      ),
    );

    const url = `http://localhost:3000/api/gcal/create/callback?code=abc&state=${encodeConfig(config)}`;
    const res = await GET(new Request(url) as unknown as NextRequest);

    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    const location = res.headers.get("location");
    expect(location).toBeTruthy();
    const free = decodeSlots(
      new URL(location as string).searchParams.get("gcal_free") as string,
    );
    expect(free).toEqual([
      { start: "2024-03-29T09:00:00.000Z", end: "2024-03-29T10:00:00.000Z" },
    ]);
  });

  test("denies cleanly when the user rejects consent", async () => {
    const url =
      "http://localhost:3000/api/gcal/create/callback?error=access_denied";
    const res = await GET(new Request(url) as unknown as NextRequest);
    expect(res.headers.get("location")).toContain("gcal_error=denied");
  });
});
