// app/api/education/articles/[articleId]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { ArticleTopic, UserType } from "@prisma/client";

// Esquema de validación para la actualización de artículos
const updateArticleSchema = z.object({
  title: z.string().min(5).max(150).optional(),
  content: z.string().min(50).optional(),
  topic: z.nativeEnum(ArticleTopic).optional(),
  authorName: z.string().min(3).max(100).optional(),
  authorInstitution: z.string().min(3).max(150).optional(),
  authorInfo: z.string().max(300).optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { articleId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { articleId } = params;

    const article = await prisma.educationalArticle.findUnique({
      where: { id: articleId },
      include: {
        user: { select: { id: true, name: true, userType: true } },
        ratings: {
          // Para obtener el voto del usuario actual y calcular conteos
          select: { userId: true, liked: true },
        },
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Artículo no encontrado" },
        { status: 404 }
      );
    }

    const likes = article.ratings.filter((r) => r.liked).length;
    const dislikes = article.ratings.filter((r) => !r.liked).length;
    const currentUserRating =
      article.ratings.find((r) => r.userId === (session.id as string))?.liked ??
      null;

    return NextResponse.json({
      ...article,
      ratings: undefined,
      likes,
      dislikes,
      currentUserRating,
    });
  } catch (error) {
    console.error("Error al obtener artículo educativo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { articleId: string } }
) {
  try {
    const session = await getSession();
    const { articleId } = params;

    const article = await prisma.educationalArticle.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Artículo no encontrado" },
        { status: 404 }
      );
    }

    if (
      !session ||
      session.id !== article.userId ||
      (session.userType !== UserType.SCHOOL &&
        session.userType !== UserType.GOVERNMENT)
    ) {
      return NextResponse.json(
        { error: "No autorizado para modificar este artículo." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = updateArticleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const dataToUpdate = { ...validationResult.data };
    // Asegurarse de que los campos opcionales que llegan como undefined no se pasen a Prisma así
    if (dataToUpdate.authorInfo === undefined) delete dataToUpdate.authorInfo;
    if (dataToUpdate.coverImageUrl === undefined)
      delete dataToUpdate.coverImageUrl;

    const updatedArticle = await prisma.educationalArticle.update({
      where: { id: articleId },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedArticle);
  } catch (error) {
    console.error("Error al actualizar artículo educativo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { articleId: string } }
) {
  try {
    const session = await getSession();
    const { articleId } = params;

    const article = await prisma.educationalArticle.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Artículo no encontrado" },
        { status: 404 }
      );
    }

    if (
      !session ||
      session.id !== article.userId ||
      (session.userType !== UserType.SCHOOL &&
        session.userType !== UserType.GOVERNMENT)
    ) {
      return NextResponse.json(
        { error: "No autorizado para eliminar este artículo." },
        { status: 403 }
      );
    }

    // Eliminar valoraciones asociadas primero debido a onDelete: Cascade
    // No es necesario explícitamente si onDelete: Cascade está bien configurado, Prisma lo haría.
    // Pero por claridad, se puede dejar o confirmar que la cascada funciona.
    // await prisma.articleRating.deleteMany({ where: { articleId } });

    await prisma.educationalArticle.delete({
      where: { id: articleId },
    });

    return NextResponse.json({ message: "Artículo eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar artículo educativo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
