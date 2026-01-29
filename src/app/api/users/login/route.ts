// app/api/login/route.ts (ou là où est ta route)
import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/libs/validations/users/auth.schema";
import { authenticateUser } from "@/libs/services/users/auth.service";

export async function POST(req: NextRequest) {
  try {
    // 1. Récupération et Validation des données (Zod)
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      // Renvoie les erreurs de validation formatées
      return NextResponse.json(
        {
          message: "Données invalides",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    // 2. Appel du Service
    const { email, password } = validation.data;
    const result = await authenticateUser(email, password);

    // 3. Gestion des erreurs métier
    if (!result.success) {
      const status = result.type === "AUTH_ERROR" ? 401 : 500;
      return NextResponse.json({ message: result.error }, { status });
    }

    // 4. Succès et Création du Cookie
    // Note: Stocker juste l'ID en clair est risqué (voir note sécurité plus bas)
    const response = NextResponse.json({ success: true }, { status: 200 });

    response.cookies.set("auth_token", result.user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 jour
    });

    return response;
  } catch (e) {
    return NextResponse.json(
      { message: "Erreur serveur inattendue" },
      { status: 500 },
    );
  }
}
