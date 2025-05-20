import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  // Eliminar la cookie de token
  (
    await // Eliminar la cookie de token
    cookies()
  ).set("token", "", {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });

  return NextResponse.json({ success: true });
}
