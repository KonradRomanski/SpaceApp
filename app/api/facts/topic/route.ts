import { NextResponse } from "next/server";

export const revalidate = 21600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title");
  if (!title) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const response = await fetch(url, { next: { revalidate: 21600 } });
  if (!response.ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const json = await response.json();
  return NextResponse.json({
    title: json.title ?? title,
    description: json.extract ?? "",
    image: json.thumbnail?.source ?? null,
    wikiUrl: json.content_urls?.desktop?.page ?? null
  });
}
