import { NextResponse } from "next/server";
import bodies from "../../data/bodies.json";

export const revalidate = 86400;

const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";
const NASA_IMAGES = "https://images-api.nasa.gov/search";

type Body = {
  id: string;
  name: string;
  type?: string;
  imageOverride?: string;
  descriptionOverride?: string;
  wikiUrlOverride?: string;
  wikiTitleOverride?: string;
};

const bodyIndex = new Map((bodies as Body[]).map((body) => [body.id, body]));

const TYPE_QIDS: Record<string, string[]> = {
  planet: ["Q634"],
  moon: ["Q2537"],
  star: ["Q523"],
  galaxy: ["Q318"],
  "black-hole": ["Q589"],
  asteroid: ["Q3863"],
  "dwarf-planet": ["Q15978631"]
};

const WIKI_SUFFIX: Record<string, string> = {
  moon: " (moon)",
  asteroid: " (asteroid)",
  "dwarf-planet": " (dwarf planet)",
  galaxy: " (galaxy)",
  "black-hole": " (black hole)",
  star: " (star)"
};

function buildWikidataQuery(name: string, type?: string) {
  const safeName = name.replace(/"/g, '\\"');
  const typeValues = type && TYPE_QIDS[type] ? TYPE_QIDS[type] : [];
  const typeClause = typeValues.length
    ? `?item wdt:P31/wdt:P279* ?type. VALUES ?type { ${typeValues
        .map((qid) => `wd:${qid}`)
        .join(" ")} }`
    : "";
  return `SELECT ?item ?itemLabel ?image ?description
    ?mass ?massUnitLabel
    ?radius ?radiusUnitLabel
    ?density ?densityUnitLabel
    ?surfaceGravity ?surfaceGravityUnitLabel
    ?orbitalPeriod ?orbitalPeriodUnitLabel
    ?rotationPeriod ?rotationPeriodUnitLabel
    ?semiMajor ?semiMajorUnitLabel
    ?albedo
    ?eccentricity
    ?periapsis ?periapsisUnitLabel
    ?distanceEarth ?distanceEarthUnitLabel
    WHERE {
    ?item rdfs:label "${safeName}"@en.
    ${typeClause}
    OPTIONAL { ?item wdt:P18 ?image. }
    OPTIONAL { ?item schema:description ?description FILTER (lang(?description) = "en") }
    OPTIONAL { ?item p:P2067/psv:P2067 ?massNode. ?massNode wikibase:quantityAmount ?mass. ?massNode wikibase:quantityUnit ?massUnit. }
    OPTIONAL { ?item p:P2120/psv:P2120 ?radiusNode. ?radiusNode wikibase:quantityAmount ?radius. ?radiusNode wikibase:quantityUnit ?radiusUnit. }
    OPTIONAL { ?item p:P2054/psv:P2054 ?densityNode. ?densityNode wikibase:quantityAmount ?density. ?densityNode wikibase:quantityUnit ?densityUnit. }
    OPTIONAL { ?item p:P7015/psv:P7015 ?surfaceGravityNode. ?surfaceGravityNode wikibase:quantityAmount ?surfaceGravity. ?surfaceGravityNode wikibase:quantityUnit ?surfaceGravityUnit. }
    OPTIONAL { ?item p:P2146/psv:P2146 ?orbitalPeriodNode. ?orbitalPeriodNode wikibase:quantityAmount ?orbitalPeriod. ?orbitalPeriodNode wikibase:quantityUnit ?orbitalPeriodUnit. }
    OPTIONAL { ?item p:P2147/psv:P2147 ?rotationPeriodNode. ?rotationPeriodNode wikibase:quantityAmount ?rotationPeriod. ?rotationPeriodNode wikibase:quantityUnit ?rotationPeriodUnit. }
    OPTIONAL { ?item p:P2233/psv:P2233 ?semiMajorNode. ?semiMajorNode wikibase:quantityAmount ?semiMajor. ?semiMajorNode wikibase:quantityUnit ?semiMajorUnit. }
    OPTIONAL { ?item wdt:P4501 ?albedo. }
    OPTIONAL { ?item wdt:P1096 ?eccentricity. }
    OPTIONAL { ?item p:P2244/psv:P2244 ?periapsisNode. ?periapsisNode wikibase:quantityAmount ?periapsis. ?periapsisNode wikibase:quantityUnit ?periapsisUnit. }
    OPTIONAL { ?item p:P2583/psv:P2583 ?distanceNode. ?distanceNode wikibase:quantityAmount ?distanceEarth. ?distanceNode wikibase:quantityUnit ?distanceEarthUnit. }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  } LIMIT 1`;
}

async function fetchWikidata(name: string, type?: string) {
  const query = buildWikidataQuery(name, type);
  const url = `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "cosmic-journey-calculator/0.1 (contact: local)"
    },
    next: { revalidate: 86400 }
  });
  if (!response.ok) return null;
  const json = await response.json();
  const binding = json?.results?.bindings?.[0];
  if (!binding) return null;
  return {
    image: binding.image?.value ?? null,
    description: binding.description?.value ?? null,
    facts: {
      mass: valueWithUnit(binding.mass, binding.massUnitLabel),
      radius: valueWithUnit(binding.radius, binding.radiusUnitLabel),
      density: valueWithUnit(binding.density, binding.densityUnitLabel),
      surfaceGravity: valueWithUnit(binding.surfaceGravity, binding.surfaceGravityUnitLabel),
      orbitalPeriod: valueWithUnit(binding.orbitalPeriod, binding.orbitalPeriodUnitLabel),
      rotationPeriod: valueWithUnit(binding.rotationPeriod, binding.rotationPeriodUnitLabel),
      semiMajorAxis: valueWithUnit(binding.semiMajor, binding.semiMajorUnitLabel),
      albedo: binding.albedo?.value ?? null,
      eccentricity: binding.eccentricity?.value ?? null,
      periapsis: valueWithUnit(binding.periapsis, binding.periapsisUnitLabel),
      distanceFromEarth: valueWithUnit(binding.distanceEarth, binding.distanceEarthUnitLabel)
    }
  };
}

function valueWithUnit(valueNode: any, unitNode: any) {
  if (!valueNode?.value) return null;
  const value = valueNode.value;
  const unit = unitNode?.value ?? null;
  return unit ? `${value} ${unit}` : value;
}

async function fetchNasaImage(name: string) {
  const url = `${NASA_IMAGES}?q=${encodeURIComponent(name)}&media_type=image`;
  const response = await fetch(url, { next: { revalidate: 86400 } });
  if (!response.ok) return null;
  const json = await response.json();
  const item = json?.collection?.items?.[0];
  const link = item?.links?.[0]?.href ?? null;
  return link;
}

async function fetchWikipedia(name: string, type?: string, overrideTitle?: string) {
  const suffix = type && WIKI_SUFFIX[type] ? `${name}${WIKI_SUFFIX[type]}` : null;
  const candidates = [overrideTitle, suffix, name].filter(Boolean) as string[];

  for (const title of candidates) {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const response = await fetch(url, { next: { revalidate: 86400 } });
    if (!response.ok) continue;
    const json = await response.json();
    return {
      description: json.extract ?? null,
      image: json.thumbnail?.source ?? null,
      wikiUrl: json.content_urls?.desktop?.page ?? null
    };
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const id = searchParams.get("id");

  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  try {
    const override = id ? bodyIndex.get(id) : null;
    const type = override?.type;
    const [wikidata, nasaImage, wikipedia] = await Promise.all([
      fetchWikidata(name, type),
      fetchNasaImage(name),
      fetchWikipedia(name, type, override?.wikiTitleOverride)
    ]);

    return NextResponse.json({
      name,
      image:
        override?.imageOverride ??
        wikipedia?.image ??
        wikidata?.image ??
        nasaImage ??
        null,
      description:
        override?.descriptionOverride ??
        wikipedia?.description ??
        wikidata?.description ??
        null,
      wikiUrl: override?.wikiUrlOverride ?? wikipedia?.wikiUrl ?? null,
      facts: wikidata?.facts ?? null
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to enrich data" }, { status: 500 });
  }
}
