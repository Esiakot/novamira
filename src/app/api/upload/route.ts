import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { apiHandler } from "@/libs/apiHandler";
import {
  ALLOWED_UPLOAD_TYPES_SET,
  ALLOWED_UPLOAD_EXTENSIONS,
  VALID_UPLOAD_TYPE,
  MAX_UPLOAD_SIZE,
} from "@/libs/constants";

export const POST = apiHandler(async (request: NextRequest, { user }) => {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string | null;

  if (!file) {
    return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
  }

  if (!type || !VALID_UPLOAD_TYPE.has(type)) {
    return NextResponse.json(
      { error: "Type d'upload invalide. Utilisez 'avatar' ou 'banner'" },
      { status: 400 },
    );
  }

  if (!ALLOWED_UPLOAD_TYPES_SET.has(file.type)) {
    return NextResponse.json(
      { error: "Format non supporté. Utilisez JPG, PNG, WebP ou GIF" },
      { status: 400 },
    );
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json(
      { error: "Le fichier ne doit pas dépasser 5 Mo" },
      { status: 400 },
    );
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  if (!ALLOWED_UPLOAD_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: "Extension de fichier non autorisée" },
      { status: 400 },
    );
  }

  const filename = `${type}-${user.account.id}-${crypto.randomBytes(8).toString("hex")}.${ext}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(uploadDir, filename);
  await writeFile(filePath, buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
});
