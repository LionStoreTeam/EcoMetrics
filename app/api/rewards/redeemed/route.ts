import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.id as string;

    // Obtener las recompensas canjeadas por el usuario
    const redeemedRewards = await prisma.redemption.findMany({
      where: {
        userId,
      },
      include: {
        reward: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transformar los datos para el frontend
    const formattedRedemptions = redeemedRewards.map((redemption) => ({
      id: redemption.id,
      rewardId: redemption.rewardId,
      userId: redemption.userId,
      status: redemption.status,
      createdAt: redemption.createdAt.toISOString(),
      redeemedAt: redemption.redeemedAt.toISOString(),
      reward: {
        id: redemption.reward.id,
        title: redemption.reward.title,
        description: redemption.reward.description,
        pointsCost: redemption.reward.pointsCost,
        available: redemption.reward.available,
        quantity: redemption.reward.quantity,
        expiresAt: redemption.reward.expiresAt
          ? redemption.reward.expiresAt.toISOString()
          : null,
        category: redemption.reward.category.toLowerCase(), // Convertir a minúsculas para el frontend
      },
    }));

    return NextResponse.json(formattedRedemptions);
  } catch (error) {
    console.error("Error al obtener recompensas canjeadas:", error);
    return NextResponse.json(
      { error: "Error al obtener recompensas canjeadas" },
      { status: 500 }
    );
  }
}
