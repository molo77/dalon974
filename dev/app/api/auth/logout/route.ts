import { NextResponse } from "next/server";

export async function POST() {
  // Avec NextAuth, la déconnexion se fait côté client via /api/auth/signout
  return NextResponse.json({ ok: true });
}
