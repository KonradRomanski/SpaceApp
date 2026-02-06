import { NextResponse } from "next/server";

export const revalidate = 86400;

const NASA_IMAGES = "https://images-api.nasa.gov/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nasaId = searchParams.get("nasa_id");
  if (!nasaId) {
    return NextResponse.json({ error: "Missing nasa_id" }, { status: 400 });
  }
  const url = `${NASA_IMAGES}?nasa_id=${encodeURIComponent(nasaId)}`;
  try {
    const response = await fetch(url, { next: { revalidate: 86400 } });
    if (!response.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const json = await response.json();
    const item = json?.collection?.items?.[0];
    const data = item?.data?.[0];
    const link = item?.links?.[0]?.href ?? null;
    return NextResponse.json({
      nasaId,
      title: data?.title ?? "Untitled",
      description: data?.description ?? "",
      image: link,
      keywords: data?.keywords ?? [],
      center: data?.center ?? null,
      dateCreated: data?.date_created ?? null
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
