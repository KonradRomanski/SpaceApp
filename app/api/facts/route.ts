import { NextResponse } from "next/server";

export const revalidate = 21600;

const TOPICS = [
  "Voyager 1",
  "Voyager 2",
  "Hubble Space Telescope",
  "James Webb Space Telescope",
  "Apollo 11",
  "Mars",
  "Jupiter",
  "Saturn",
  "Europa (moon)",
  "Titan (moon)",
  "Proxima Centauri",
  "Andromeda Galaxy",
  "Milky Way",
  "Black hole",
  "Exoplanet",
  "International Space Station",
  "SpaceX",
  "Asteroid belt",
  "Kuiper belt",
  "Oort cloud"
];

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function fetchSummary(title: string) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const response = await fetch(url, { next: { revalidate: 21600 } });
  if (!response.ok) return null;
  const json = await response.json();
  return {
    title: json.title ?? title,
    description: json.extract ?? "",
    image: json.thumbnail?.source ?? null,
    wikiUrl: json.content_urls?.desktop?.page ?? null
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "8");
  const offset = Number(searchParams.get("offset") ?? "0");
  const slice = TOPICS.slice(offset, offset + limit);

  const results = await Promise.all(
    slice.map(async (title) => {
      const summary = await fetchSummary(title);
      return {
        slug: slugify(title),
        title,
        description: summary?.description ?? "",
        image: summary?.image ?? null,
        wikiUrl: summary?.wikiUrl ?? null
      };
    })
  );

  return NextResponse.json({
    items: results,
    total: TOPICS.length
  });
}
