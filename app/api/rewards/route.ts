import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    // Obtener todas las recompensas disponibles
    const rewards = await prisma.reward.findMany({
      where: {
        available: true,
      },
      orderBy: {
        pointsCost: "asc",
      },
    });

    // Transformar los datos para el frontend
    const formattedRewards = rewards.map((reward) => ({
      id: reward.id,
      title: reward.title,
      description: reward.description,
      pointsCost: reward.pointsCost,
      available: reward.available,
      quantity: reward.quantity,
      expiresAt: reward.expiresAt ? reward.expiresAt.toISOString() : null,
      category: reward.category.toLowerCase(), // Convertir a minúsculas para el frontend
      createdAt: reward.createdAt.toISOString(),
      updatedAt: reward.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedRewards);
  } catch (error) {
    console.error("Error al obtener recompensas:", error);
    return NextResponse.json(
      { error: "Error al obtener recompensas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();
    const { title, description, pointsCost, quantity, expiresAt, category } =
      data;

    // Validar datos
    if (!title || !description || !pointsCost || pointsCost <= 0) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    // Crear nueva recompensa
    const reward = await prisma.reward.create({
      data: {
        title,
        description,
        pointsCost,
        quantity: quantity || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        category: category || "OTHER",
      },
    });

    return NextResponse.json(reward);
  } catch (error) {
    console.error("Error al crear recompensa:", error);
    return NextResponse.json(
      { error: "Error al crear recompensa" },
      { status: 500 }
    );
  }
}
