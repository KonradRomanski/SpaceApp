import { NextResponse } from "next/server";
import { addExtraBodies, listExtraBodies } from "../../../lib/db";

export async function GET() {
  const rows = listExtraBodies();
  const items = rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description ?? "Discovered body.",
    imageOverride: row.image_override ?? undefined,
    distanceLy: row.distance_ly ?? undefined,
    distanceAuFromEarthAvg: row.distance_au ?? undefined,
    semiMajorAxisAu: row.semi_major_au ?? undefined,
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
  addExtraBodies(items);
  return NextResponse.json({ added: items.map((item: any) => item.id) });
}
