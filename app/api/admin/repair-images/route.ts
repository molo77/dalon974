import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";
import prisma from "@/lib/prismaClient";

export async function POST() {
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null;
    const isAdmin = (session?.user as any)?.role === "admin";
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const badAnnonceUrls = [
      "/images/annonce-placeholder.jpg",
      "/images/annonce-placeholder.png",
      "/images/annonce-holder.png",
    ];
    const badColocUrls = [
      "/images/coloc-placeholder.png",
    ];

    const [annonceRes, colocRes, annonceImgRes, colocImgRes] = await Promise.all([
      prisma.annonce.updateMany({
        where: { imageUrl: { in: badAnnonceUrls } },
        data: { imageUrl: "/images/annonce-holder.svg" },
      }),
      prisma.colocProfile.updateMany({
        where: { imageUrl: { in: badColocUrls } },
        data: { imageUrl: "/images/coloc-holder.svg" },
      }),
      prisma.annonceImage.updateMany({
        where: { url: { in: badAnnonceUrls } },
        data: { url: "/images/annonce-holder.svg" },
      }),
      prisma.colocImage.updateMany({
        where: { url: { in: badColocUrls } },
        data: { url: "/images/coloc-holder.svg" },
      }),
    ]);

    return NextResponse.json({ repaired: { annonces: annonceRes.count, colocs: colocRes.count, annonceImages: annonceImgRes.count, colocImages: colocImgRes.count } });
  } catch (e) {
    console.error("[API][admin][repair-images]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
