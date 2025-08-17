import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

// POST: accept multipart/form-data with field name "files" (multiple)
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const entries = formData.getAll("files");

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.promises.mkdir(uploadDir, { recursive: true });

    const saved: string[] = [];

    for (const entry of entries) {
      // entry is a File-like object in the web runtime
      // @ts-ignore
      const file = entry as File | undefined;
      if (!file || typeof file.name !== "string") continue;
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}-${safeName}`;
      const dest = path.join(uploadDir, filename);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.promises.writeFile(dest, buffer);

      saved.push(`/uploads/${filename}`);
    }

    return NextResponse.json({ files: saved });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE: ?path=/uploads/xxx
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const filePath = url.searchParams.get("path");
    if (!filePath) return NextResponse.json({ error: "missing path" }, { status: 400 });

    if (!filePath.startsWith("/uploads/")) {
      return NextResponse.json({ error: "invalid path" }, { status: 400 });
    }

    const diskPath = path.join(process.cwd(), "public", filePath.replace(/^\//, ""));
    await fs.promises.unlink(diskPath);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
