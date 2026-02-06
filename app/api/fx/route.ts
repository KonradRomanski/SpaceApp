import { NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const base = searchParams.get("base") ?? "USD";
  const symbols = searchParams.get("symbols") ?? "EUR,PLN,GBP,JPY";

  try {
    const url = `https://api.frankfurter.app/latest?base=${encodeURIComponent(
      base
    )}&symbols=${encodeURIComponent(symbols)}`;
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      return NextResponse.json({ error: "FX fetch failed" }, { status: 500 });
    }
    const json = await response.json();
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json({ error: "FX fetch failed" }, { status: 500 });
  }
}
