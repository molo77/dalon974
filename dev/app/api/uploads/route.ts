import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    // Supporte soit "file" (unique) soit "files" (multiple)
    const single = form.get("file") as File | null;
    const multiRaw = form.getAll("files") as File[];

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    async function saveOne(file: File) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = path.extname(file.name) || "";
      const name = crypto.randomBytes(16).toString("hex") + ext;
      const filePath = path.join(uploadDir, name);
      await fs.writeFile(filePath, buffer);
      return `/uploads/${name}`;
    }

    if (single) {
      const url = await saveOne(single);
      // Retourne à la fois url (pour uploadPhoto) et files (pour PhotoUploader)
      return NextResponse.json({ url, files: [url] });
    }

    if (multiRaw && multiRaw.length) {
      const files: string[] = [];
      for (const f of multiRaw) {
        if (f && typeof (f as any).arrayBuffer === "function") {
          files.push(await saveOne(f));
        }
      }
      if (!files.length) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
      return NextResponse.json({ files });
    }

    return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload échoué" }, { status: 500 });
  }
}

// Suppression d'un fichier via ?path=/uploads/xxx
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const p = url.searchParams.get("path");
    if (!p) return NextResponse.json({ error: "missing path" }, { status: 400 });
    if (!p.startsWith("/uploads/")) return NextResponse.json({ error: "invalid path" }, { status: 400 });
    const abs = path.join(process.cwd(), "public", p.replace(/^\//, ""));
    await fs.unlink(abs);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
