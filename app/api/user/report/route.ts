// File: app/api/user/report/route.ts

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth"; // Asegúrate de que tu helper de sesión sea correcto
import prisma from "@/lib/prisma";
import {
  Activity,
  Badge,
  Redemption,
  Reward,
  User,
  Profile,
} from "@prisma/client";

// Interfaz actualizada para la respuesta del reporte, basada en tu schema.prisma
export interface UserReportData {
  user: {
    name: string | null;
    email: string | null;
    totalPoints: number;
    level: number;
    memberSince: string;
    accountType: string;
  };
  activities: Activity[];
  redeemedRewards: (Redemption & { reward: Reward })[];
  obtainedBadges: Badge[];
}

export async function GET() {
  const session = await getSession();
  if (!session?.id) {
    return new NextResponse(JSON.stringify({ message: "No autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session?.id;

  try {
    // 1. Obtener datos del usuario, su perfil y las actividades
    const userData = await prisma.user.findUnique({
      where: { id: userId as any },
      include: {
        activities: {
          orderBy: { date: "desc" },
        },
        profile: {
          include: {
            badges: true, // Incluimos las insignias a través del perfil
          },
        },
      },
    });

    if (!userData) {
      return new NextResponse(
        JSON.stringify({ message: "Usuario no encontrado" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Obtener las recompensas canjeadas (modelo Redemption) por separado
    const userRedemptions = await prisma.redemption.findMany({
      where: { userId: userId },
      include: {
        reward: true, // Incluimos la información de la recompensa
      },
      orderBy: {
        redeemedAt: "desc",
      },
    });

    // 3. Organizar los datos para el reporte

    // Datos generales del usuario, usando los campos de tu schema (ej. 'points')
    const userProfile = {
      name: userData.name,
      email: userData.email,
      totalPoints: userData.points, // Corregido de 'score' a 'points'
      level: userData.level,
      memberSince: userData.createdAt.toLocaleDateString("es-MX"),
      accountType: userData.role, // Usamos el campo 'role' de tu schema
    };

    // Insignias obtenidas (a través de la relación Profile -> Badge)
    const obtainedBadges = userData.profile?.badges || [];

    // Construir el objeto de respuesta final
    const reportData: UserReportData = {
      user: userProfile,
      activities: userData.activities,
      redeemedRewards: userRedemptions,
      obtainedBadges: obtainedBadges,
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Error al generar el reporte:", error);
    return new NextResponse(
      JSON.stringify({ message: "Error interno del servidor" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
