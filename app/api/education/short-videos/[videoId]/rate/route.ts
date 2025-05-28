// app/api/education/short-videos/[videoId]/rate/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const rateShortVideoSchema = z.object({
  liked: z.boolean(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json(
        { error: "No autorizado para valorar." },
        { status: 401 }
      );
    }

    const { videoId } = params;
    const videoExists = await prisma.shortVideo.findUnique({
      where: { id: videoId },
    });
    if (!videoExists) {
      return NextResponse.json(
        { error: "Video no encontrado." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validationResult = rateShortVideoSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos de valoración inválidos.",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { liked } = validationResult.data;
    const userId = session.id as string;

    const existingRating = await prisma.shortVideoRating.findUnique({
      where: { userId_shortVideoId: { userId, shortVideoId: videoId } },
    });

    let newRatingStatus: boolean | null = liked;
    let message: string;

    if (existingRating) {
      if (existingRating.liked === liked) {
        // Toggle off
        await prisma.shortVideoRating.delete({
          where: { id: existingRating.id },
        });
        newRatingStatus = null;
        message = "Valoración eliminada.";
      } else {
        // Change vote
        await prisma.shortVideoRating.update({
          where: { id: existingRating.id },
          data: { liked },
        });
        message = "Valoración actualizada.";
      }
    } else {
      // New vote
      await prisma.shortVideoRating.create({
        data: { shortVideoId: videoId, userId, liked },
      });
      message = "Valoración registrada.";
    }

    const likesCount = await prisma.shortVideoRating.count({
      where: { shortVideoId: videoId, liked: true },
    });
    const dislikesCount = await prisma.shortVideoRating.count({
      where: { shortVideoId: videoId, liked: false },
    });

    return NextResponse.json({
      message,
      newRatingStatus,
      likes: likesCount,
      dislikes: dislikesCount,
    });
  } catch (error) {
    console.error("Error al valorar video corto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al valorar." },
      { status: 500 }
    );
  }
}
