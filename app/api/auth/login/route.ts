import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validar datos
    if (!email || !password) {
      return NextResponse.json(
        { error: "Correo electrónico y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Crear token JWT
    const token = await encrypt({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Guardar token en cookies
    (
      await // Guardar token en cookies
      cookies()
    ).set("token", token, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 día
    });

    // Devolver respuesta sin incluir la contraseña
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      role: user.role,
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return NextResponse.json(
      { error: "Error al iniciar sesión" },
      { status: 500 }
    );
  }
}
