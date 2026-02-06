import { NextResponse } from "next/server";
import { removeExtraShip } from "../../../../lib/db";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!params.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  await removeExtraShip(params.id);
  return NextResponse.json({ ok: true });
}
