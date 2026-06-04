import { NextRequest, NextResponse } from "next/server";
import { decodeConfig, encodeSlots } from "@/lib/calendar-config";
import { generateSlots } from "@/lib/domain/time";
import { freeBusyToFreeSlots, mergeBusy } from "@/lib/domain/freebusy";

function getBaseUrl(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(`${baseUrl}/create/times?gcal_error=denied`);
  }

  let config;
  try {
    config = decodeConfig(state);
  } catch {
    return NextResponse.redirect(`${baseUrl}/create/times?gcal_error=state`);
  }

  const redirectUri = `${baseUrl}/api/gcal/create/callback`;

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
    return NextResponse.redirect(`${baseUrl}/create/times?gcal_error=token`);
  }

  const calListRes = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
  );
  const calListData = await calListRes.json();
  const items: { id: string }[] =
    calListData.items?.map((c: { id: string }) => ({ id: c.id })) ?? [{ id: "primary" }];

  const from = new Date(config.fromISO);
  const timeMin = from.toISOString();
  const timeMax = new Date(
    from.getTime() + config.horizonDays * 86_400_000,
  ).toISOString();

  const freebusyRes = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ timeMin, timeMax, timeZone: config.tz, items }),
  });
  const freebusyData = await freebusyRes.json();

  const busy = mergeBusy(freebusyData.calendars);
  const candidates = generateSlots({
    weekdays: config.weekdays,
    windowStart: config.windowStart,
    windowEnd: config.windowEnd,
    intervalMin: config.intervalMin,
    tz: config.tz,
    from,
    horizonDays: config.horizonDays,
  });
  const free = freeBusyToFreeSlots(busy, candidates);

  return NextResponse.redirect(
    `${baseUrl}/create/times?gcal_free=${encodeSlots(free)}`,
  );
}
