import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const revalidate = 3600;

const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";

const TYPE_MAP: Record<string, string> = {
  Q634: "planet",
  Q2537: "moon",
  Q523: "star",
  Q318: "galaxy",
  Q589: "black-hole",
  Q3863: "asteroid",
  Q15978631: "dwarf-planet"
};

function buildQuery() {
  return `SELECT ?item ?itemLabel ?type ?typeLabel ?image ?description ?discoveryDate WHERE {
    VALUES ?type { wd:Q634 wd:Q2537 wd:Q523 wd:Q318 wd:Q589 wd:Q3863 wd:Q15978631 }
    ?item wdt:P31 ?type.
    OPTIONAL { ?item wdt:P18 ?image. }
    OPTIONAL { ?item wdt:P575 ?discoveryDate. }
    OPTIONAL { ?item schema:description ?description FILTER (lang(?description) = "en") }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  }
  ORDER BY DESC(?discoveryDate)
  LIMIT 24`;
}

export async function GET() {
  const query = buildQuery();
  const url = `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": "cosmic-journey-calculator/0.1 (contact: local)"
      },
      next: { revalidate: 3600 }
    });
    if (!response.ok) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }
    const json = await response.json();
    const items = (json?.results?.bindings ?? []).map((binding: any) => {
      const id = binding.item?.value?.split("/").pop() ?? `wd-${Math.random()}`;
      const typeQid = binding.type?.value?.split("/").pop() ?? "";
      const type = TYPE_MAP[typeQid] ?? "catalog";
      return {
        id,
        name: binding.itemLabel?.value ?? "Unknown",
        type,
        description: binding.description?.value ?? "Recent discovery.",
        imageOverride: binding.image?.value ?? undefined
      };
    });
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
