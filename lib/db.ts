import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

const dataDir = join(process.cwd(), ".data");
const dbPath = join(dataDir, "cj.sqlite");

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS extra_bodies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    image_override TEXT,
    distance_ly REAL,
    distance_au REAL,
    semi_major_au REAL,
    created_at TEXT NOT NULL
  );
`);

export function listExtraBodies() {
  return db
    .prepare("SELECT * FROM extra_bodies ORDER BY created_at DESC")
    .all();
}

export function addExtraBodies(items: any[]) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO extra_bodies
    (id, name, type, description, image_override, distance_ly, distance_au, semi_major_au, created_at)
    VALUES (@id, @name, @type, @description, @image_override, @distance_ly, @distance_au, @semi_major_au, @created_at)
  `);
  const existingNames = new Set(
    db
      .prepare("SELECT name FROM extra_bodies")
      .all()
      .map((row: any) => row.name.toLowerCase())
  );
  const now = new Date().toISOString();
  const tx = db.transaction((rows) => {
    rows.forEach((row) => {
      if (!row?.id || !row?.name) return;
      const normalized = String(row.name).toLowerCase();
      if (existingNames.has(normalized)) return;
      stmt.run({
        id: row.id,
        name: row.name,
        type: row.type,
        description: row.description ?? null,
        image_override: row.imageOverride ?? null,
        distance_ly: row.distanceLy ?? null,
        distance_au: row.distanceAuFromEarthAvg ?? null,
        semi_major_au: row.semiMajorAxisAu ?? null,
        created_at: row.createdAt ?? now
      });
      existingNames.add(normalized);
    });
  });
  tx(items);
}

export function removeExtraBody(id: string) {
  db.prepare("DELETE FROM extra_bodies WHERE id = ?").run(id);
}
