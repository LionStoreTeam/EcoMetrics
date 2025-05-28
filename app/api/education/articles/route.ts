// app/api/education/articles/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { ArticleTopic, UserType } from "@prisma/client"; // Asegúrate que UserType esté importado si no lo está globalmente

// Esquema de validación para la creación de artículos
const createArticleSchema = z.object({
  title: z
    .string()
    .min(5, "El título debe tener al menos 5 caracteres")
    .max(150, "El título no puede exceder los 150 caracteres"),
  content: z.string().min(50, "El contenido debe tener al menos 50 caracteres"),
  topic: z.nativeEnum(ArticleTopic),
  authorName: z.string().min(3, "El nombre del autor es requerido").max(100),
  authorInstitution: z
    .string()
    .min(3, "La institución del autor es requerida")
    .max(150),
  authorInfo: z.string().max(300).optional().nullable(),
  coverImageUrl: z
    .string()
    .url("URL de imagen de portada inválida")
    .optional()
    .nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (
      !session ||
      !session.id ||
      (session.userType !== UserType.SCHOOL &&
        session.userType !== UserType.GOVERNMENT)
    ) {
      return NextResponse.json(
        { error: "No autorizado para crear artículos educativos." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = createArticleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      title,
      content,
      topic,
      authorName,
      authorInstitution,
      authorInfo,
      coverImageUrl,
    } = validationResult.data;

    const article = await prisma.educationalArticle.create({
      data: {
        title,
        content,
        topic,
        authorName,
        authorInstitution,
        authorInfo: authorInfo || null,
        coverImageUrl: coverImageUrl || null,
        userId: session.id as string,
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error("Error al crear artículo educativo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al crear el artículo." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const topicFilter = searchParams.get("topic") as ArticleTopic | null;
    const searchTerm = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const whereClause: any = {
      AND: [],
    };

    if (topicFilter) {
      whereClause.AND.push({ topic: topicFilter });
    }

    if (searchTerm) {
      whereClause.AND.push({
        OR: [
          { title: { contains: searchTerm } },
          { content: { contains: searchTerm } },
          { authorName: { contains: searchTerm } },
          { authorInstitution: { contains: searchTerm } },
        ],
      });
    }

    if (whereClause.AND.length === 0) {
      delete whereClause.AND;
    }

    const articles = await prisma.educationalArticle.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          // Información del creador
          select: { id: true, name: true, userType: true },
        },
        _count: {
          // Para obtener conteos de ratings
          select: {
            ratings: {
              where: { liked: true }, // Contar "Me gusta"
            },
          },
        },
        ratings: {
          // Incluir el rating del usuario actual si existe
          where: { userId: session.id as string },
          select: { liked: true },
        },
      },
    });

    const totalArticles = await prisma.educationalArticle.count({
      where: whereClause,
    });

    // Formatear la respuesta para incluir conteo de "no me gusta" y el voto del usuario
    const formattedArticles = await Promise.all(
      articles.map(async (article) => {
        const dislikesCount = await prisma.articleRating.count({
          where: {
            articleId: article.id,
            liked: false,
          },
        });
        return {
          ...article,
          likes: article._count.ratings, // 'ratings' aquí es el conteo de 'liked: true'
          dislikes: dislikesCount,
          currentUserRating:
            article.ratings.length > 0 ? article.ratings[0].liked : null, // null si no hay voto, true si es like, false si es dislike
        };
      })
    );

    return NextResponse.json({
      articles: formattedArticles,
      pagination: {
        total: totalArticles,
        page,
        limit,
        totalPages: Math.ceil(totalArticles / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener artículos educativos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al obtener los artículos." },
      { status: 500 }
    );
  }
}
