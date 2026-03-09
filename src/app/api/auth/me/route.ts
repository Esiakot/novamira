import { NextResponse } from "next/server";
import { apiHandler } from "@/libs/apiHandler";

export const GET = apiHandler(async (_request, { user }) => {
  return NextResponse.json({ user });
});
