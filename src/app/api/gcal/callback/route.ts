import { NextRequest, NextResponse } from "next/server";

function getBaseUrl(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

interface SlotRef {
  id: string;
  start: string;
  end: string;
}

interface BusyInterval {
  start: string;
  end: string;
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(`${baseUrl}/?gcal_error=denied`);
  }

  let eventId: string;
  let slots: SlotRef[];

  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString());
    eventId = parsed.eventId;
    slots = parsed.slots;
  } catch {
    return NextResponse.redirect(`${baseUrl}/?gcal_error=state`);
  }

  const redirectUri = `${baseUrl}/api/gcal/callback`;

  // Exchange code for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return NextResponse.redirect(`${baseUrl}/event/${eventId}?gcal_error=token`);
  }

  // Sort slots to get overall time range
  const sorted = [...slots].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
  // Normalize to proper ISO 8601 (PocketBase uses space instead of T)
  const timeMin = new Date(sorted[0].start).toISOString();
  const timeMax = new Date(sorted[sorted.length - 1].end).toISOString();

  // List all calendars the user has access to
  const calListRes = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
  );
  const calListData = await calListRes.json();
  const calendarItems: { id: string }[] =
    calListData.items?.map((c: { id: string }) => ({ id: c.id })) ?? [{ id: "primary" }];

  // Query freebusy across ALL calendars at once
  const freebusyRes = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: calendarItems,
    }),
  });

  const freebusyData = await freebusyRes.json();

  // Merge busy intervals from all calendars
  const busy: BusyInterval[] = Object.values(
    (freebusyData.calendars ?? {}) as Record<string, { busy?: BusyInterval[] }>
  ).flatMap((cal) => cal.busy ?? []);

  // Mark slots that don't overlap with any busy interval as available
  const availableIds = slots
    .filter((slot) => {
      const slotStart = new Date(slot.start).getTime();
      const slotEnd = new Date(slot.end).getTime();
      return !busy.some((b) => {
        const busyStart = new Date(b.start).getTime();
        const busyEnd = new Date(b.end).getTime();
        return busyStart < slotEnd && busyEnd > slotStart;
      });
    })
    .map((s) => s.id);

  if (availableIds.length === 0) {
    return NextResponse.redirect(
      `${baseUrl}/event/${eventId}?gcal_available=none`
    );
  }

  return NextResponse.redirect(
    `${baseUrl}/event/${eventId}?gcal_available=${availableIds.join(",")}`
  );
}
