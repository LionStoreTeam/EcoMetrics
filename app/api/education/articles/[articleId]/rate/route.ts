// app/api/education/articles/[articleId]/rate/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const rateArticleSchema = z.object({
  liked: z.boolean(), // true para "Me gusta", false para "No me gusta"
});

export async function POST(
  request: NextRequest,
  { params }: { params: { articleId: string } }
) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json(
        { error: "No autorizado para valorar." },
        { status: 401 }
      );
    }

    const { articleId } = params;
    if (!articleId) {
      return NextResponse.json(
        { error: "ID de artículo requerido." },
        { status: 400 }
      );
    }

    const articleExists = await prisma.educationalArticle.findUnique({
      where: { id: articleId },
    });

    if (!articleExists) {
      return NextResponse.json(
        { error: "Artículo no encontrado." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validationResult = rateArticleSchema.safeParse(body);

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

    const existingRating = await prisma.articleRating.findUnique({
      where: {
        userId_articleId: {
          // Usando el índice único
          userId,
          articleId,
        },
      },
    });

    let newRating;
    if (existingRating) {
      // Si el usuario ya valoró y hace clic en la misma opción, se elimina su voto (toggle off)
      if (existingRating.liked === liked) {
        await prisma.articleRating.delete({
          where: { id: existingRating.id },
        });
        newRating = null; // Indica que el voto fue removido
      } else {
        // Si cambia su voto
        newRating = await prisma.articleRating.update({
          where: { id: existingRating.id },
          data: { liked },
        });
      }
    } else {
      // Nueva valoración
      newRating = await prisma.articleRating.create({
        data: {
          articleId,
          userId,
          liked,
        },
      });
    }

    // Recalcular likes y dislikes para devolver el estado actualizado
    const likesCount = await prisma.articleRating.count({
      where: { articleId, liked: true },
    });
    const dislikesCount = await prisma.articleRating.count({
      where: { articleId, liked: false },
    });

    return NextResponse.json({
      message:
        newRating === null
          ? "Valoración eliminada."
          : existingRating && existingRating.liked !== liked
          ? "Valoración actualizada."
          : "Valoración registrada.",
      newRatingStatus: newRating ? newRating.liked : null, // null, true, o false
      likes: likesCount,
      dislikes: dislikesCount,
    });
  } catch (error) {
    console.error("Error al valorar artículo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al valorar el artículo." },
      { status: 500 }
    );
  }
}
