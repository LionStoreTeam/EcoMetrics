// app/api/education/visual-materials/[visualMaterialId]/rate/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const rateVisualMaterialSchema = z.object({
  liked: z.boolean(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { visualMaterialId: string } }
) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json(
        { error: "No autorizado para valorar." },
        { status: 401 }
      );
    }

    const { visualMaterialId } = params;
    const materialExists = await prisma.visualMaterial.findUnique({
      where: { id: visualMaterialId },
    });
    if (!materialExists) {
      return NextResponse.json(
        { error: "Material visual no encontrado." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validationResult = rateVisualMaterialSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos de valoración inválidos",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { liked } = validationResult.data;
    const userId = session.id as string;

    const existingRating = await prisma.visualMaterialRating.findUnique({
      where: { userId_visualMaterialId: { userId, visualMaterialId } },
    });

    let newRatingStatus: boolean | null = liked;
    let message: string;

    if (existingRating) {
      if (existingRating.liked === liked) {
        // Toggle off
        await prisma.visualMaterialRating.delete({
          where: { id: existingRating.id },
        });
        newRatingStatus = null;
        message = "Valoración eliminada.";
      } else {
        // Change vote
        await prisma.visualMaterialRating.update({
          where: { id: existingRating.id },
          data: { liked },
        });
        message = "Valoración actualizada.";
      }
    } else {
      // New vote
      await prisma.visualMaterialRating.create({
        data: { visualMaterialId, userId, liked },
      });
      message = "Valoración registrada.";
    }

    const likesCount = await prisma.visualMaterialRating.count({
      where: { visualMaterialId, liked: true },
    });
    const dislikesCount = await prisma.visualMaterialRating.count({
      where: { visualMaterialId, liked: false },
    });

    return NextResponse.json({
      message,
      newRatingStatus,
      likes: likesCount,
      dislikes: dislikesCount,
    });
  } catch (error) {
    console.error("Error al valorar material visual:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al valorar." },
      { status: 500 }
    );
  }
}
