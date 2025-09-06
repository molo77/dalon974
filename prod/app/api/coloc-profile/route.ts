import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { getColocProfile, saveColocProfile, deleteColocProfile, type ColocProfileData } from "@/core/business/colocProfileService";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const profile = await getColocProfile(session.user.id);
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Erreur lors de la récupération du profil coloc:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const data: ColocProfileData = await request.json();
    const profile = await saveColocProfile(session.user.id, data);
    
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du profil coloc:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    await deleteColocProfile(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression du profil coloc:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
