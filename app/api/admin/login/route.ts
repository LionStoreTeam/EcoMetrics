import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validar que todos los campos estén presentes
    if (!email || !password) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    // Buscar el usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Verificar si el usuario existe y es administrador
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Credenciales inválidas o usuario no es administrador" },
        { status: 401 }
      );
    }

    // Verificar la contraseña
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

    return NextResponse.json(
      {
        message: "Inicio de sesión exitoso",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return NextResponse.json(
      { error: "Error al iniciar sesión" },
      { status: 500 }
    );
  }
}
