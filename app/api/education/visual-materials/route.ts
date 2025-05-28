// app/api/education/visual-materials/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import {
  uploadVisualMaterialImageToS3,
  validateFile,
  deleteFileFromS3,
  getPublicS3Url,
} from "@/lib/s3-service";
import { UserType, VisualMaterialTopic } from "@prisma/client";
import { MAX_FILES, MIN_FILES } from "@/types/types-s3-service"; // Usar constantes de s3-service

// Esquema Zod para la creación de material visual (backend)
const createVisualMaterialSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().max(1000).optional().nullable(),
  topic: z.nativeEnum(VisualMaterialTopic),
  authorName: z.string().min(3).max(100),
  authorInstitution: z.string().min(3).max(150),
  authorInfo: z.string().max(500).optional().nullable(),
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
        { error: "No autorizado para crear material visual." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const formValues: Record<string, any> = {};
    const imageFiles: File[] = [];

    formData.forEach((value, key) => {
      if (key.startsWith("images[")) {
        // Asumiendo que los archivos se envían como images[0], images[1], etc.
        if (value instanceof File) {
          imageFiles.push(value);
        }
      } else {
        formValues[key] = value;
      }
    });

    // Limpiar strings vacíos opcionales a null antes de validar
    if (formValues.description === "") formValues.description = null;
    if (formValues.authorInfo === "") formValues.authorInfo = null;

    const validationResult = createVisualMaterialSchema.safeParse(formValues);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    if (imageFiles.length < MIN_FILES || imageFiles.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Se deben subir entre ${MIN_FILES} y ${MAX_FILES} imágenes.` },
        { status: 400 }
      );
    }

    for (const file of imageFiles) {
      const fileValidation = validateFile(file); // Usar la validación general de archivos
      if (!fileValidation.valid) {
        return NextResponse.json(
          { error: fileValidation.error || `Archivo inválido: ${file.name}` },
          { status: 400 }
        );
      }
    }

    const uploadedImageS3Keys: { s3Key: string; order: number }[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const s3Response = await uploadVisualMaterialImageToS3(file); // Usa la nueva función específica
      uploadedImageS3Keys.push({ s3Key: s3Response.fileKey, order: i });
    }

    const {
      title,
      description,
      topic,
      authorName,
      authorInstitution,
      authorInfo,
    } = validationResult.data;

    const visualMaterial = await prisma.visualMaterial.create({
      data: {
        title,
        description: description || null,
        topic,
        authorName,
        authorInstitution,
        authorInfo: authorInfo || null,
        userId: session.id as string,
        images: {
          create: uploadedImageS3Keys.map((img) => ({
            s3Key: img.s3Key,
            order: img.order,
          })),
        },
      },
      include: { images: true }, // Incluir imágenes en la respuesta
    });

    // Formatear URLs para la respuesta
    const responseVisualMaterial = {
      ...visualMaterial,
      images: visualMaterial.images.map((img) => ({
        id: img.id,
        url: getPublicS3Url(img.s3Key), // Convertir s3Key a URL pública
        order: img.order,
      })),
    };

    return NextResponse.json(responseVisualMaterial, { status: 201 });
  } catch (error) {
    console.error("Error al crear material visual:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error interno del servidor al crear material visual." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(); // Verificar si el usuario está autenticado
    if (!session) {
      return NextResponse.json(
        { error: "No autorizado para ver material visual." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "9", 10); // Ajusta según necesidad
    const topicFilter = searchParams.get("topic") as VisualMaterialTopic | null;
    const searchTerm = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const whereClause: any = { AND: [] };
    // if (topicFilter && topicFilter !== "ALL") {
    if (topicFilter) {
      // Asumiendo "ALL" para no filtrar por tópico
      whereClause.AND.push({ topic: topicFilter });
    }
    if (searchTerm) {
      whereClause.AND.push({
        OR: [
          { title: { contains: searchTerm } }, // Ajustar mode según DB
          { description: { contains: searchTerm } },
          { authorName: { contains: searchTerm } },
          { authorInstitution: { contains: searchTerm } },
        ],
      });
    }
    if (whereClause.AND.length === 0) delete whereClause.AND;

    const visualMaterialsFromDb = await prisma.visualMaterial.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, userType: true } },
        images: {
          orderBy: { order: "asc" },
          select: { id: true, s3Key: true, order: true },
        },
        _count: {
          select: {
            ratings: { where: { liked: true } },
          },
        },
        // Para obtener el rating del usuario actual
        ratings: {
          where: { userId: session.id as string },
          select: { liked: true },
        },
      },
    });

    const totalVisualMaterials = await prisma.visualMaterial.count({
      where: whereClause,
    });

    const visualMaterials = await Promise.all(
      visualMaterialsFromDb.map(async (vm) => {
        const dislikesCount = await prisma.visualMaterialRating.count({
          where: { visualMaterialId: vm.id, liked: false },
        });
        return {
          ...vm,
          images: vm.images.map((img) => ({
            id: img.id,
            url: getPublicS3Url(img.s3Key),
            order: img.order,
          })),
          likes: vm._count.ratings,
          dislikes: dislikesCount,
          currentUserRating: vm.ratings.length > 0 ? vm.ratings[0].liked : null,
          _count: undefined, // Limpiar datos no necesarios para el frontend
          ratings: undefined, // Limpiar datos no necesarios para el frontend
        };
      })
    );

    return NextResponse.json({
      visualMaterials,
      pagination: {
        total: totalVisualMaterials,
        page,
        limit,
        totalPages: Math.ceil(totalVisualMaterials / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener materiales visuales:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al obtener materiales visuales." },
      { status: 500 }
    );
  }
}
