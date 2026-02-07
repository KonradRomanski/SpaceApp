import { NextResponse } from "next/server";
import fallbackFacts from "../../data/facts.json";

export const revalidate = 21600;

const APOD_ENDPOINT = "https://api.nasa.gov/planetary/apod";
const FALLBACK_KEY = "DEMO_KEY";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shiftDate(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() - days);
  return next;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") ?? "range";
  const count = Number(searchParams.get("count") ?? "8");
  const page = Number(searchParams.get("page") ?? "0");
  const pageSize = Number(searchParams.get("pageSize") ?? "12");
  const apiKey = process.env.NASA_API_KEY ?? FALLBACK_KEY;

  let url = "";
  if (mode === "random") {
    const safeCount = Math.min(12, Math.max(4, count));
    url = `${APOD_ENDPOINT}?api_key=${apiKey}&count=${safeCount}&thumbs=true`;
  } else {
    const now = new Date();
    const end = shiftDate(now, page * pageSize);
    const start = shiftDate(end, pageSize - 1);
    url = `${APOD_ENDPOINT}?api_key=${apiKey}&start_date=${isoDate(start)}&end_date=${isoDate(end)}&thumbs=true`;
  }

  try {
    const response = await fetch(url, { next: { revalidate: 21600 } });
    if (!response.ok) {
      return NextResponse.json({ items: fallbackFacts });
    }
    const json = await response.json();
    if ((json as any)?.error) {
      return NextResponse.json({ items: fallbackFacts });
    }
    const items = (Array.isArray(json) ? json : [json])
      .filter((item) => item)
      .map((item) => ({
        date: item.date,
        title: item.title,
        description: item.explanation,
        mediaType: item.media_type,
        image:
          item.media_type === "image"
            ? item.url
            : item.thumbnail_url ?? null
      }));
    if (!items.length) {
      return NextResponse.json({ items: fallbackFacts });
    }
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: fallbackFacts });
  }
}
