// app/api/education/short-videos/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; //
import { getSession } from "@/lib/auth"; //
import { z } from "zod";
import {
  uploadShortVideoFileToS3,
  uploadVideoThumbnailToS3,
  validateVideoFile,
  validateAvatarFile as validateThumbnailFile,
  getPublicS3Url,
  deleteFileFromS3,
} from "@/lib/s3-service"; //
import { UserType, VideoTopic } from "@prisma/client";
import {
  MAX_SHORT_VIDEO_SIZE,
  MAX_THUMBNAIL_SIZE,
} from "@/types/types-s3-service"; //

const createShortVideoSchema = z
  .object({
    title: z.string().min(3, "El título es muy corto").max(150),
    description: z.string().max(1000).optional().nullable(),
    topic: z.nativeEnum(VideoTopic),
    authorName: z.string().min(3).max(100),
    authorInstitution: z.string().min(3).max(150),
    authorInfo: z.string().max(500).optional().nullable(),
    duration: z
      .string()
      .optional()
      .nullable()
      .refine(
        (val) => !val || !isNaN(parseInt(val)),
        "Duración debe ser un número"
      )
      .transform((val) => (val ? parseInt(val) : null)),
    videoSourceType: z.enum(["upload", "url"]),
    externalVideoUrl: z
      .string()
      .url("URL de video externa inválida")
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.videoSourceType === "url" && !data.externalVideoUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Se debe proporcionar una URL externa si se selecciona esa opción.",
        path: ["externalVideoUrl"],
      });
    }
    // La validación del archivo se hará por separado porque FormData no se parsea bien con Zod para archivos
  });

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(); //
    if (
      !session ||
      !session.id ||
      (session.userType !== UserType.SCHOOL &&
        session.userType !== UserType.GOVERNMENT)
    ) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const formData = await request.formData();
    const formValues: Record<string, any> = {};
    const videoFile = formData.get("videoFile") as File | null;
    const thumbnailFile = formData.get("thumbnailFile") as File | null;

    formData.forEach((value, key) => {
      if (key !== "videoFile" && key !== "thumbnailFile") {
        formValues[key] = value;
      }
    });

    if (formValues.description === "") formValues.description = null;
    if (formValues.authorInfo === "") formValues.authorInfo = null;
    if (formValues.duration === "") formValues.duration = null;
    if (formValues.externalVideoUrl === "") formValues.externalVideoUrl = null;

    const validationResult = createShortVideoSchema.safeParse(formValues);
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
      description,
      topic,
      authorName,
      authorInstitution,
      authorInfo,
      duration,
      videoSourceType,
      externalVideoUrl,
    } = validationResult.data;

    let videoS3Key: string | null = null;
    let finalExternalVideoUrl: string | null = externalVideoUrl || null;

    if (videoSourceType === "upload") {
      if (!videoFile) {
        return NextResponse.json(
          { error: "Archivo de video requerido para tipo 'upload'." },
          { status: 400 }
        );
      }
      const videoValidation = validateVideoFile(
        videoFile,
        MAX_SHORT_VIDEO_SIZE / (1024 * 1024)
      ); //
      if (!videoValidation.valid) {
        return NextResponse.json(
          { error: videoValidation.error || "Video inválido." },
          { status: 400 }
        );
      }
      const videoS3Response = await uploadShortVideoFileToS3(videoFile); //
      videoS3Key = videoS3Response.fileKey;
      finalExternalVideoUrl = null; // Si se sube archivo, la URL externa no aplica
    } else if (videoSourceType === "url") {
      if (!finalExternalVideoUrl) {
        // Ya validado por Zod, pero doble check
        return NextResponse.json(
          { error: "URL externa de video requerida." },
          { status: 400 }
        );
      }
      videoS3Key = null; // Si es URL externa, no hay S3 key para el video principal
    }

    let thumbnailS3Key: string | null = null;
    if (thumbnailFile) {
      const thumbValidation = validateThumbnailFile(thumbnailFile); //
      if (!thumbValidation.valid) {
        return NextResponse.json(
          { error: thumbValidation.error || "Miniatura inválida." },
          { status: 400 }
        );
      }
      const thumbS3Response = await uploadVideoThumbnailToS3(thumbnailFile); //
      thumbnailS3Key = thumbS3Response.fileKey;
    }

    const shortVideo = await prisma.shortVideo.create({
      data: {
        title,
        description: description || null,
        topic,
        authorName,
        authorInstitution,
        authorInfo: authorInfo || null,
        videoS3Key,
        externalVideoUrl: finalExternalVideoUrl,
        thumbnailS3Key,
        duration: duration,
        userId: session.id as string,
      },
    });

    return NextResponse.json(
      {
        ...shortVideo,
        videoUrl: shortVideo.videoS3Key
          ? getPublicS3Url(shortVideo.videoS3Key)
          : shortVideo.externalVideoUrl, //
        thumbnailUrl: shortVideo.thumbnailS3Key
          ? getPublicS3Url(shortVideo.thumbnailS3Key)
          : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando video corto:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error interno del servidor al crear video corto." },
      { status: 500 }
    );
  }
}

// GET (listar todos) - la lógica principal no cambia mucho, solo cómo se determina la `videoUrl` en la respuesta.
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(); //
    if (!session)
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });

    // ... (lógica de paginación y filtros sin cambios)
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "9", 10);
    const topicFilter = searchParams.get("topic") as VideoTopic | null;
    const searchTerm = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const whereClause: any = { AND: [] };
    if (topicFilter) {
      whereClause.AND.push({ topic: topicFilter });
    }
    if (searchTerm) {
      whereClause.AND.push({
        OR: [
          { title: { contains: searchTerm } },
          { description: { contains: searchTerm } },
          { authorName: { contains: searchTerm } },
        ],
      });
    }
    if (whereClause.AND.length === 0) delete whereClause.AND;

    const shortVideosFromDb = await prisma.shortVideo.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, userType: true } },
        _count: { select: { ratings: { where: { liked: true } } } },
        ratings: {
          where: { userId: session.id as string },
          select: { liked: true },
        },
      },
    });

    const totalShortVideos = await prisma.shortVideo.count({
      where: whereClause,
    });

    const shortVideos = await Promise.all(
      shortVideosFromDb.map(async (sv) => {
        const dislikesCount = await prisma.shortVideoRating.count({
          where: { shortVideoId: sv.id, liked: false },
        });
        return {
          ...sv,
          // Decidir qué URL usar para el frontend
          videoUrl:
            sv.externalVideoUrl ||
            (sv.videoS3Key ? getPublicS3Url(sv.videoS3Key) : null), //
          thumbnailUrl: sv.thumbnailS3Key
            ? getPublicS3Url(sv.thumbnailS3Key)
            : null, //
          likes: sv._count.ratings,
          dislikes: dislikesCount,
          currentUserRating: sv.ratings.length > 0 ? sv.ratings[0].liked : null,
          _count: undefined,
          ratings: undefined,
        };
      })
    );

    return NextResponse.json({
      shortVideos,
      pagination: {
        total: totalShortVideos,
        page,
        limit,
        totalPages: Math.ceil(totalShortVideos / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener videos cortos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
