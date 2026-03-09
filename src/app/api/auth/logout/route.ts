import { NextResponse } from "next/server";
import { deleteSession } from "@/libs/session";
import { apiHandler } from "@/libs/apiHandler";

export const POST = apiHandler(async () => {
  await deleteSession();
  return NextResponse.json({ success: true });
});
