import { NextResponse } from "next/server";
import fallbackFacts from "../../../data/facts.json";

export const revalidate = 21600;

const APOD_ENDPOINT = "https://api.nasa.gov/planetary/apod";
const FALLBACK_KEY = "DEMO_KEY";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const apiKey = process.env.NASA_API_KEY ?? FALLBACK_KEY;
  const date = params.slug;
  const url = `${APOD_ENDPOINT}?api_key=${apiKey}&date=${encodeURIComponent(date)}&thumbs=true`;

  try {
    const response = await fetch(url, { next: { revalidate: 21600 } });
    if (!response.ok) {
      const fallback = (fallbackFacts as any[]).find((item) => item.date === date);
      return NextResponse.json(fallback ?? null);
    }
    const json: any = await response.json();
    if (json?.error) {
      const fallback = (fallbackFacts as any[]).find((item) => item.date === date);
      return NextResponse.json(fallback ?? null);
    }
    const fallback = (fallbackFacts as any[]).find((item) => item.date === date) ?? null;
    return NextResponse.json({
      date: json.date ?? fallback?.date ?? date,
      title: json.title ?? fallback?.title ?? "Astronomy Picture of the Day",
      description: json.explanation ?? fallback?.description ?? null,
      mediaType: json.media_type ?? "image",
      image:
        json.media_type === "image"
          ? json.url
          : json.thumbnail_url ?? fallback?.image ?? null
    });
  } catch {
    const fallback = (fallbackFacts as any[]).find((item) => item.date === date);
    return NextResponse.json(fallback ?? null);
  }
}
