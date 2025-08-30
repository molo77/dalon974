import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";
import prisma from "@/lib/prismaClient";

export async function GET() {
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null;
    const isAdmin = (session?.user as any)?.role === "admin";
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const users = await prisma.user.findMany();
    return NextResponse.json(users);
  } catch (e) {
    console.error("[API][admin][users][GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null;
    const isAdmin = (session?.user as any)?.role === "admin";
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await req.json();
    const data: any = {
      email: String(body.email),
      role: String(body.role || "user"),
      displayName: body.displayName ? String(body.displayName) : "",
    };
    const created = await prisma.user.create({ data });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("[API][admin][users][POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
