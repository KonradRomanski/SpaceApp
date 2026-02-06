import { NextResponse } from "next/server";

const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";

const typeMap: Record<string, string> = {
  planet: "Q634",
  moon: "Q2537",
  star: "Q523",
  galaxy: "Q318",
  "black-hole": "Q589"
};

function buildQuery(qid: string, limit: number) {
  return `SELECT ?item ?itemLabel ?image ?description WHERE {
    ?item wdt:P31/wdt:P279* wd:${qid}.
    OPTIONAL { ?item wdt:P18 ?image. }
    OPTIONAL { ?item schema:description ?description FILTER (lang(?description) = "en") }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  } LIMIT ${limit}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "planet";
  const limit = Number(searchParams.get("limit") ?? "20");
  const qid = typeMap[type];

  if (!qid) {
    return NextResponse.json({ error: "Unsupported type" }, { status: 400 });
  }

  const query = buildQuery(qid, Math.min(100, Math.max(5, limit)));
  const url = `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": "cosmic-journey/0.1 (local)"
      },
      next: { revalidate: 86400 }
    });
    if (!response.ok) {
      return NextResponse.json({ error: "Discover failed" }, { status: 500 });
    }
    const json = await response.json();
    const items = (json?.results?.bindings ?? []).map((row: any) => ({
      id: row.item?.value?.split("/").pop() ?? row.itemLabel?.value,
      name: row.itemLabel?.value,
      image: row.image?.value ?? null,
      description: row.description?.value ?? null
    }));
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: "Discover failed" }, { status: 500 });
  }
}
