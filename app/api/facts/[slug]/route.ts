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
    return NextResponse.json({
      date: json.date,
      title: json.title,
      description: json.explanation,
      mediaType: json.media_type,
      image: json.media_type === "image" ? json.url : json.thumbnail_url ?? null
    });
  } catch {
    const fallback = (fallbackFacts as any[]).find((item) => item.date === date);
    return NextResponse.json(fallback ?? null);
  }
}
