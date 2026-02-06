import { NextResponse } from "next/server";
import { addExtraShips, listExtraShips } from "../../../lib/db";

export async function GET() {
  const rows = await listExtraShips();
  const items = rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    org: row.org ?? undefined,
    massKg: row.mass_kg ?? undefined,
    maxAccelG: row.max_accel_g ?? undefined,
    image: row.image ?? undefined,
    note: row.note ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    createdAt: row.created_at
  }));
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const body = await request.json();
  const items = Array.isArray(body?.items) ? body.items : [body];
  if (!items.length) {
    return NextResponse.json({ error: "No items" }, { status: 400 });
  }
  await addExtraShips(items);
  return NextResponse.json({ added: items.map((item: any) => item.id) });
}
