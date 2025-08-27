import { NextResponse } from "next/server";

// Handler minimal pour valider le module et permettre le build
export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Scrape LBC endpoint placeholder" });
}

