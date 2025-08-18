import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || "";
    const name = crypto.randomBytes(16).toString("hex") + ext;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, name);
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ url: `/uploads/${name}` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload échoué" }, { status: 500 });
  }
}
