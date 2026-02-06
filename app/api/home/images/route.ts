import { NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "nebula";
  const page = Number(searchParams.get("page") ?? "1");

  const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image&page=${page}`;
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      return NextResponse.json({ error: "Image fetch failed" }, { status: 500 });
    }
    const json = await response.json();
    const items = (json?.collection?.items ?? []).slice(0, 12).map((item: any) => ({
      title: item?.data?.[0]?.title ?? "NASA image",
      description: item?.data?.[0]?.description ?? "",
      image: item?.links?.[0]?.href ?? null
    }));

    return NextResponse.json({ items, page });
  } catch (error) {
    return NextResponse.json({ error: "Image fetch failed" }, { status: 500 });
  }
}
