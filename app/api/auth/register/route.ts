import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, userType } = body;

    // Validar datos
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "El correo electrónico ya está registrado" },
        { status: 400 }
      );
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        userType: userType || "INDIVIDUAL",
        profile: {
          create: {},
        },
      },
    });

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
    console.error("Error al registrar usuario:", error);
    return NextResponse.json(
      { error: "Error al registrar usuario" },
      { status: 500 }
    );
  }
}
