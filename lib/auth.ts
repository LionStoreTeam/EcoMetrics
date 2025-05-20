import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import type { User } from "@prisma/client";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

const secretKey = process.env.JWT_SECRET || "your-secret-key";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(key);
}

export async function decrypt(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Correo y contraseña son requeridos" };
  }

  try {
    // Buscar usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Verificar si el usuario existe
    if (!user) {
      return { error: "Credenciales inválidas" };
    }

    // Verificar la contraseña
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return { error: "Credenciales inválidas" };
    }

    // Crear y guardar el token
    const token = await encrypt({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    (await cookies()).set("token", token, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 día
    });

    return { success: "Inicio de sesión exitoso" };
  } catch (error) {
    console.error("Error en login:", error);
    return { error: "Error al iniciar sesión" };
  }
}

export async function logout() {
  (await cookies()).set("token", "", {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}

export async function getSession() {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;
  return await decrypt(token);
}

export async function updateSession(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export type SessionUser = Pick<User, "id" | "email" | "name" | "role">;
