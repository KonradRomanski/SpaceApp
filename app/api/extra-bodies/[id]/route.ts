import { NextResponse } from "next/server";
import { removeExtraBody } from "../../../../lib/db";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!params.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  removeExtraBody(params.id);
  return NextResponse.json({ ok: true });
}
