// app/api/users/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserProfile } from "@/libs/services/users/profile.service";

export async function GET(req: NextRequest) {
  try {
    // 1. Récupération de l'identité (Actuellement via cookie brut)
    // ⚠️ RAPPEL SÉCURITÉ : Lire l'ID directement du cookie est dangereux.
    // Idéalement, ici on décodera un JWT plus tard.
    const authId = req.cookies.get("auth_token")?.value;

    if (!authId) {
      return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
    }

    // 2. Appel du Service (Logique métier)
    const profile = await getUserProfile(authId);

    // 3. Gestion du résultat (404 ou 200)
    if (!profile) {
      return NextResponse.json(
        { message: "Profil introuvable" },
        { status: 404 },
      );
    }

    return NextResponse.json(profile, { status: 200 });
  } catch (e) {
    // Gestion d'erreur 500 centralisée pour cette route
    return NextResponse.json(
      { message: "Erreur serveur lors de la récupération du profil" },
      { status: 500 },
    );
  }
}
