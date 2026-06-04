import { NextRequest, NextResponse } from "next/server";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

function getBaseUrl(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/**
 * Create-time calendar scan: initiates OAuth carrying the scan config (encoded)
 * in `state`. The callback regenerates candidate slots from that config and
 * returns the free ones to the draft — distinct from the vote-flow endpoint,
 * which filters an existing event's slots.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const config = searchParams.get("config");

  if (!config) {
    return NextResponse.json({ error: "Missing config" }, { status: 400 });
  }
  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 });
  }

  const redirectUri = `${getBaseUrl(request)}/api/gcal/create/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    access_type: "online",
    prompt: "select_account",
    state: config,
  });

  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params}`);
}
