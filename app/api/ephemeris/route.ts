import { NextResponse } from "next/server";

export const revalidate = 3600;

const HORIZONS_ENDPOINT = "https://ssd.jpl.nasa.gov/api/horizons.api";
const AU_KM = 149597870.7;

function buildUrl(command: string, start: string, stop: string, step: string) {
  const params = new URLSearchParams({
    format: "json",
    COMMAND: command,
    CENTER: "500@0",
    EPHEM_TYPE: "VECTORS",
    START_TIME: start,
    STOP_TIME: stop,
    STEP_SIZE: step
  });
  return `${HORIZONS_ENDPOINT}?${params.toString()}`;
}

function parseVectors(result: string) {
  const lines = result.split("\n");
  const startIndex = lines.findIndex((line) => line.includes("$$SOE"));
  const endIndex = lines.findIndex((line) => line.includes("$$EOE"));
  if (startIndex < 0 || endIndex < 0) return null;
  const dataLines = lines.slice(startIndex + 1, endIndex);
  const vectors = dataLines
    .map((line) => {
      const numbers = line.match(/[-+]?\\d*\\.?\\d+(?:[Ee][+-]?\\d+)?/g);
      if (!numbers || numbers.length < 3) return null;
      const xyz = numbers.slice(-3).map((value) => Number(value));
      if (xyz.some((value) => Number.isNaN(value))) return null;
      return { x: xyz[0], y: xyz[1], z: xyz[2], raw: line.trim() };
    })
    .filter(Boolean) as { x: number; y: number; z: number; raw: string }[];
  return vectors.length ? vectors : null;
}

async function fetchVectors(command: string, start: string, stop: string, step: string) {
  const url = buildUrl(command, start, stop, step);
  const response = await fetch(url, { next: { revalidate: 3600 } });
  if (!response.ok) return null;
  const json = await response.json();
  const result = json?.result;
  if (!result) return null;
  return parseVectors(result);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("target");
  const center = searchParams.get("center") ?? "399";
  const date = searchParams.get("date");
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const step = searchParams.get("step") ?? "1 d";

  if (!target) {
    return NextResponse.json({ error: "Missing target" }, { status: 400 });
  }

  try {
    if (start && end) {
      const [centerVecs, body] = await Promise.all([
        fetchVectors(center, start, end, step),
        fetchVectors(target, start, end, step)
      ]);
      if (!centerVecs || !body || centerVecs.length !== body.length) {
        return NextResponse.json({ error: "No ephemeris data" }, { status: 404 });
      }
      let best = { date: start, distanceKm: Number.POSITIVE_INFINITY };
      centerVecs.forEach((vec, index) => {
        const b = body[index];
        const dx = b.x - vec.x;
        const dy = b.y - vec.y;
        const dz = b.z - vec.z;
        const distanceKm = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (distanceKm < best.distanceKm) {
          best = { date: vec.raw.split(" ")[0], distanceKm };
        }
      });
      return NextResponse.json({
        start,
        end,
        step,
        bestDate: best.date,
        bestDistanceKm: best.distanceKm,
        bestDistanceAu: best.distanceKm / AU_KM,
        source: "JPL Horizons"
      });
    }

    if (!date) {
      return NextResponse.json({ error: "Missing date" }, { status: 400 });
    }
    const [centerVecs, body] = await Promise.all([
      fetchVectors(center, date, date, "1 d"),
      fetchVectors(target, date, date, "1 d")
    ]);
    if (!centerVecs || !body || !centerVecs[0] || !body[0]) {
      return NextResponse.json({ error: "No ephemeris data" }, { status: 404 });
    }
    const dx = body[0].x - centerVecs[0].x;
    const dy = body[0].y - centerVecs[0].y;
    const dz = body[0].z - centerVecs[0].z;
    const distanceKm = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return NextResponse.json({
      date,
      distanceKm,
      distanceAu: distanceKm / AU_KM,
      source: "JPL Horizons"
    });
  } catch {
    return NextResponse.json({ error: "Ephemeris lookup failed" }, { status: 500 });
  }
}
