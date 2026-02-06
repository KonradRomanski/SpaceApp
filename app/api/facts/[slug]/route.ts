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

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const match = TOPICS.find((title) => slugify(title) === params.slug);
  if (!match) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const summary = await fetchSummary(match);
  return NextResponse.json({
    slug: params.slug,
    title: summary?.title ?? match,
    description: summary?.description ?? "",
    image: summary?.image ?? null,
    wikiUrl: summary?.wikiUrl ?? null
  });
}
