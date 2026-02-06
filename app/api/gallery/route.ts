import { NextResponse } from "next/server";

export const revalidate = 86400;

const NASA_IMAGES = "https://images-api.nasa.gov/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "space";
  const page = searchParams.get("page") ?? "1";

  const url = `${NASA_IMAGES}?q=${encodeURIComponent(q)}&media_type=image&page=${encodeURIComponent(
    page
  )}`;
  try {
    const response = await fetch(url, { next: { revalidate: 86400 } });
    if (!response.ok) return NextResponse.json({ items: [], page: Number(page) });
    const json = await response.json();
    const items =
      json?.collection?.items?.map((item: any) => {
        const data = item?.data?.[0];
        const link = item?.links?.[0]?.href ?? null;
        return {
          nasaId: data?.nasa_id ?? "",
          title: data?.title ?? "Untitled",
          description: data?.description ?? "",
          image: link
        };
      }) ?? [];
    return NextResponse.json({ items, page: Number(page) });
  } catch (error) {
    return NextResponse.json({ items: [], page: Number(page) });
  }
}
