import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({ connectionString });
let initialized = false;

async function init() {
  if (initialized) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS extra_bodies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      image_override TEXT,
      distance_ly DOUBLE PRECISION,
      distance_au DOUBLE PRECISION,
      semi_major_au DOUBLE PRECISION,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS extra_ships (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      org TEXT,
      mass_kg DOUBLE PRECISION,
      max_accel_g DOUBLE PRECISION,
      image TEXT,
      note TEXT,
      source_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  initialized = true;
}

export async function listExtraBodies() {
  await init();
  const { rows } = await pool.query(
    "SELECT * FROM extra_bodies ORDER BY created_at DESC"
  );
  return rows;
}

export async function addExtraBodies(items: any[]) {
  await init();
  const now = new Date().toISOString();
  const existing = await pool.query("SELECT name FROM extra_bodies");
  const existingNames = new Set(
    existing.rows.map((row) => String(row.name).toLowerCase())
  );

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const row of items) {
      if (!row?.id || !row?.name) continue;
      const normalized = String(row.name).toLowerCase();
      if (existingNames.has(normalized)) continue;
      await client.query(
        `
        INSERT INTO extra_bodies
        (id, name, type, description, image_override, distance_ly, distance_au, semi_major_au, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (id) DO NOTHING
      `,
        [
          row.id,
          row.name,
          row.type,
          row.description ?? null,
          row.imageOverride ?? null,
          row.distanceLy ?? null,
          row.distanceAuFromEarthAvg ?? null,
          row.semiMajorAxisAu ?? null,
          row.createdAt ?? now
        ]
      );
      existingNames.add(normalized);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function removeExtraBody(id: string) {
  await init();
  await pool.query("DELETE FROM extra_bodies WHERE id = $1", [id]);
}

export async function listExtraShips() {
  await init();
  const { rows } = await pool.query(
    "SELECT * FROM extra_ships ORDER BY created_at DESC"
  );
  return rows;
}

export async function addExtraShips(items: any[]) {
  await init();
  const now = new Date().toISOString();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const row of items) {
      if (!row?.id || !row?.name) continue;
      await client.query(
        `
        INSERT INTO extra_ships
        (id, name, org, mass_kg, max_accel_g, image, note, source_url, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (id) DO NOTHING
      `,
        [
          row.id,
          row.name,
          row.org ?? null,
          row.massKg ?? null,
          row.maxAccelG ?? null,
          row.image ?? null,
          row.note ?? null,
          row.sourceUrl ?? null,
          row.createdAt ?? now
        ]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function removeExtraShip(id: string) {
  await init();
  await pool.query("DELETE FROM extra_ships WHERE id = $1", [id]);
}
