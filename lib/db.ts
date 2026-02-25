import seedShips from "../app/data/ships.json";

type ExtraBodyRow = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  image_override: string | null;
  distance_ly: number | null;
  distance_au: number | null;
  semi_major_au: number | null;
  created_at: string;
};

type ExtraShipRow = {
  id: string;
  name: string;
  org: string | null;
  mass_kg: number | null;
  max_accel_g: number | null;
  image: string | null;
  note: string | null;
  source_url: string | null;
  created_at: string;
};

const extraBodies = new Map<string, ExtraBodyRow>();
const extraShips = new Map<string, ExtraShipRow>();
let shipsSeeded = false;

function nowIso() {
  return new Date().toISOString();
}

function byCreatedDesc<T extends { created_at: string }>(rows: T[]) {
  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function ensureSeedShips() {
  if (shipsSeeded) return;
  for (const ship of seedShips as any[]) {
    if (!ship?.id || !ship?.name) continue;
    extraShips.set(ship.id, {
      id: ship.id,
      name: ship.name,
      org: ship.org ?? null,
      mass_kg: ship.massKg ?? null,
      max_accel_g: ship.maxAccelG ?? null,
      image: ship.image ?? null,
      note: ship.note ?? null,
      source_url: ship.sourceUrl ?? null,
      created_at: ship.createdAt ?? nowIso()
    });
  }
  shipsSeeded = true;
}

export async function listExtraBodies() {
  return byCreatedDesc([...extraBodies.values()]);
}

export async function addExtraBodies(items: any[]) {
  const existingNames = new Set(
    [...extraBodies.values()].map((row) => row.name.toLowerCase())
  );

  for (const row of items) {
    if (!row?.id || !row?.name) continue;
    const normalized = String(row.name).toLowerCase();
    if (existingNames.has(normalized) || extraBodies.has(String(row.id))) continue;

    extraBodies.set(String(row.id), {
      id: String(row.id),
      name: String(row.name),
      type: String(row.type ?? "catalog"),
      description: row.description ?? null,
      image_override: row.imageOverride ?? null,
      distance_ly: Number.isFinite(row.distanceLy) ? Number(row.distanceLy) : null,
      distance_au: Number.isFinite(row.distanceAuFromEarthAvg)
        ? Number(row.distanceAuFromEarthAvg)
        : null,
      semi_major_au: Number.isFinite(row.semiMajorAxisAu)
        ? Number(row.semiMajorAxisAu)
        : null,
      created_at: row.createdAt ?? nowIso()
    });

    existingNames.add(normalized);
  }
}

export async function removeExtraBody(id: string) {
  extraBodies.delete(id);
}

export async function listExtraShips() {
  ensureSeedShips();
  return byCreatedDesc([...extraShips.values()]);
}

export async function addExtraShips(items: any[]) {
  ensureSeedShips();
  for (const row of items) {
    if (!row?.id || !row?.name) continue;
    if (extraShips.has(String(row.id))) continue;

    extraShips.set(String(row.id), {
      id: String(row.id),
      name: String(row.name),
      org: row.org ?? null,
      mass_kg: Number.isFinite(row.massKg) ? Number(row.massKg) : null,
      max_accel_g: Number.isFinite(row.maxAccelG) ? Number(row.maxAccelG) : null,
      image: row.image ?? null,
      note: row.note ?? null,
      source_url: row.sourceUrl ?? null,
      created_at: row.createdAt ?? nowIso()
    });
  }
}

export async function removeExtraShip(id: string) {
  extraShips.delete(id);
}
