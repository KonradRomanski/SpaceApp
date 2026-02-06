import { NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/events/${mm}/${dd}`;
  try {
    const response = await fetch(url, {
      headers: {
        "Api-User-Agent": "cosmic-journey/0.1 (local)"
      },
      next: { revalidate: 3600 }
    });
    if (!response.ok) {
      return NextResponse.json({ error: "Facts fetch failed" }, { status: 500 });
    }
    const json = await response.json();
    const events = (json?.events ?? []).slice(0, 20).map((event: any) => ({
      year: event.year,
      text: event.text,
      page: event.pages?.[0]?.content_urls?.desktop?.page ?? null,
      image: event.pages?.[0]?.thumbnail?.source ?? null
    }));

    return NextResponse.json({ date: `${mm}/${dd}`, events });
  } catch (error) {
    return NextResponse.json({ error: "Facts fetch failed" }, { status: 500 });
  }
}
