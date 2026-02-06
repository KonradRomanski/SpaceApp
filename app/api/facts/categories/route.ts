import { NextResponse } from "next/server";

export const revalidate = 21600;

const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";

const TYPE_QIDS: Record<string, string> = {
  planet: "Q634",
  mission: "Q40218",
  galaxy: "Q318"
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
  const limit = Number(searchParams.get("limit") ?? "24");
  const qid = TYPE_QIDS[type];
  if (!qid) {
    return NextResponse.json({ items: [] });
  }

  const query = buildQuery(qid, Math.min(48, Math.max(6, limit)));
  const url = `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": "cosmic-journey/0.1 (local)"
      },
      next: { revalidate: 21600 }
    });
    if (!response.ok) return NextResponse.json({ items: [] });
    const json = await response.json();
    const items =
      json?.results?.bindings?.map((row: any) => ({
        id: row.item?.value?.split("/").pop() ?? row.itemLabel?.value,
        title: row.itemLabel?.value ?? "Unknown",
        description: row.description?.value ?? "",
        image: row.image?.value ?? null
      })) ?? [];
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
