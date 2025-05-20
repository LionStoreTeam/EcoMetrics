// app/api/badges/route.ts
import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  ALL_BADGES,
  seedBadges,
  type BadgeDefinition,
} from "@/lib/badgeDefinitions"; // Importar definiciones

export interface BadgeApiResponseItem extends BadgeDefinition {
  obtained: boolean;
  obtainedAt?: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Asegurar que las insignias base existan en la BD
    // En producción, esto se haría una vez o mediante un script de seed separado.
    // Por ahora, lo llamamos aquí para asegurar que estén disponibles.
    await seedBadges();

    const allBadgesFromDb = await prisma.badge.findMany();

    const userProfileWithBadges = await prisma.profile.findUnique({
      where: { userId: session.id as string },
      include: {
        badges: {
          select: {
            id: true,
            // Si necesitas la fecha en que se obtuvo, necesitarías un campo en la relación _BadgeToProfile
            // Por ahora, asumimos que solo necesitamos saber si se obtuvo o no.
          },
        },
      },
    });

    const obtainedBadgeIds = new Set(
      userProfileWithBadges?.badges.map((b) => b.id) || []
    );

    const responseBadges: BadgeApiResponseItem[] = allBadgesFromDb.map(
      (dbBadge) => {
        // Encontrar la definición correspondiente para obtener criteriaType, etc.
        const definition = ALL_BADGES.find((def) => def.id === dbBadge.id);
        return {
          id: dbBadge.id,
          name: dbBadge.name,
          description: dbBadge.description,
          imageUrl: dbBadge.imageUrl,
          criteriaType: definition?.criteriaType || "USER_LEVEL", // Fallback, idealmente siempre debería encontrar una definición
          criteriaThreshold: definition?.criteriaThreshold || 0,
          criteriaActivityType: definition?.criteriaActivityType,
          obtained: obtainedBadgeIds.has(dbBadge.id),
          // obtainedAt: ... // Necesitaría modificar el schema para esto
        };
      }
    );

    return NextResponse.json(responseBadges);
  } catch (error) {
    console.error("Error al obtener insignias:", error);
    return NextResponse.json(
      { error: "Error al obtener insignias" },
      { status: 500 }
    );
  }
}
