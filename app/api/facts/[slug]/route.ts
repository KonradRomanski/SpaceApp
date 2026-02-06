import { NextResponse } from "next/server";

export const revalidate = 21600;

const APOD_ENDPOINT = "https://api.nasa.gov/planetary/apod";
const FALLBACK_KEY = "DEMO_KEY";

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const apiKey = process.env.NASA_API_KEY ?? FALLBACK_KEY;
  const date = params.slug;
  const url = `${APOD_ENDPOINT}?api_key=${apiKey}&date=${encodeURIComponent(date)}&thumbs=true`;
  try {
    const response = await fetch(url, { next: { revalidate: 21600 } });
    if (!response.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const json = await response.json();
    return NextResponse.json({
      date: json.date,
      title: json.title,
      description: json.explanation,
      image: json.media_type === "image" ? json.url : json.thumbnail_url ?? null,
      mediaType: json.media_type
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
