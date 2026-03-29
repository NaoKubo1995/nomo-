import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.provider_token) {
    return NextResponse.json({ events: [], error: "no_token" });
  }

  const now = new Date();
  const timeMin = new Date(now);
  timeMin.setHours(0, 0, 0, 0);
  const timeMax = new Date(now);
  timeMax.setDate(timeMax.getDate() + 3);
  timeMax.setHours(0, 0, 0, 0);

  try {
    const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    url.searchParams.set("timeMin", timeMin.toISOString());
    url.searchParams.set("timeMax", timeMax.toISOString());
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("maxResults", "50");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${session.provider_token}` },
    });

    if (!res.ok) {
      return NextResponse.json({ events: [], error: "api_error" });
    }

    const data = await res.json();
    const events = (data.items || [])
      .filter((item: any) => item.start?.dateTime)
      .map((item: any) => ({
        id: item.id,
        summary: item.summary || "予定あり",
        start: item.start.dateTime,
        end: item.end.dateTime,
      }));

    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json({ events: [], error: "fetch_error" });
  }
}
