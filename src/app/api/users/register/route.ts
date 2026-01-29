import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/libs/validations/users/auth.schema";
import { registerUser } from "@/libs/services/users/auth.service";

export async function POST(req: NextRequest) {
  try {
    // 1. Parsing et Validation
    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      // On renvoie la première erreur trouvée pour simplifier l'affichage front
      const firstError = validation.error.issues[0].message;
      return NextResponse.json({ message: firstError }, { status: 400 });
    }

    // 2. Appel du Service
    const result = await registerUser(validation.data);

    if (!result.success) {
      return NextResponse.json(
        { message: result.error },
        { status: result.status },
      );
    }

    // 3. Succès et Cookie
    const response = NextResponse.json({ success: true }, { status: 201 });

    // Configuration du cookie (sécurisé)
    // Note: Utilise result.userId renvoyé par le service
    response.cookies.set("auth_token", result.userId!, {
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
