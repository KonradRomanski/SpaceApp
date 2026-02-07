import { NextResponse } from "next/server";

const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";

function buildQuery(names: string[]) {
  const values = names
    .map((name) => `"${name.replace(/"/g, "\\\"")}"@en`)
    .join(" ");
  return `SELECT ?itemLabel ?semiMajor ?semiMajorUnitLabel WHERE {
    VALUES ?name { ${values} }
    ?item rdfs:label ?name.
    ?item wdt:P31/wdt:P279* wd:Q2537.
    OPTIONAL { ?item p:P2233/psv:P2233 ?semiMajorNode. ?semiMajorNode wikibase:quantityAmount ?semiMajor. ?semiMajorNode wikibase:quantityUnit ?semiMajorUnit. }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  }`;
}

function toKm(value: number, unitLabel?: string) {
  if (!unitLabel) return value;
  const unit = unitLabel.toLowerCase();
  if (unit.includes("kilomet")) return value;
  if (unit.includes("meter")) return value / 1000;
  if (unit.includes("astronomical")) return value * 149597870.7;
  return value;
}

export async function POST(request: Request) {
  const body = await request.json();
  const names = Array.isArray(body?.names) ? body.names : [];
  if (!names.length) return NextResponse.json({ items: {} });

  const query = buildQuery(names);
  const url = `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": "cosmic-journey/0.1 (local)"
      },
      next: { revalidate: 86400 }
    });
    if (!response.ok) return NextResponse.json({ items: {} });
    const json = await response.json();
    const items: Record<string, number> = {};
    for (const row of json?.results?.bindings ?? []) {
      const name = row.itemLabel?.value;
      const value = row.semiMajor?.value ? Number(row.semiMajor.value) : null;
      if (!name || !value || !Number.isFinite(value)) continue;
      const unitLabel = row.semiMajorUnitLabel?.value;
      items[name] = toKm(value, unitLabel);
    }
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: {} });
  }
}
