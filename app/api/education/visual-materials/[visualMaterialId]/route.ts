// app/api/education/visual-materials/[visualMaterialId]/route.ts
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
import { MAX_FILES, MIN_FILES } from "@/types/types-s3-service";

const updateVisualMaterialSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  description: z.string().max(1000).optional().nullable(),
  topic: z.nativeEnum(VisualMaterialTopic).optional(),
  authorName: z.string().min(3).max(100).optional(),
  authorInstitution: z.string().min(3).max(150).optional(),
  authorInfo: z.string().max(500).optional().nullable(),
  // Para la edición de imágenes, el frontend enviará `existingImageS3Keys` y `imagesToDelete`
  // y los nuevos archivos como `images[index]`.
});

export async function GET(
  request: NextRequest,
  { params }: { params: { visualMaterialId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { visualMaterialId } = params;

    const vmFromDb = await prisma.visualMaterial.findUnique({
      where: { id: visualMaterialId },
      include: {
        user: { select: { id: true, name: true, userType: true } },
        images: {
          orderBy: { order: "asc" },
          select: { id: true, s3Key: true, order: true },
        },
        ratings: { select: { userId: true, liked: true } }, // Para calcular likes/dislikes y voto del usuario
      },
    });

    if (!vmFromDb) {
      return NextResponse.json(
        { error: "Material visual no encontrado" },
        { status: 404 }
      );
    }

    const likes = vmFromDb.ratings.filter((r) => r.liked).length;
    const dislikes = vmFromDb.ratings.filter((r) => !r.liked).length;
    const currentUserRating =
      vmFromDb.ratings.find((r) => r.userId === (session.id as string))
        ?.liked ?? null;

    const visualMaterial = {
      ...vmFromDb,
      images: vmFromDb.images.map((img) => ({
        id: img.id,
        url: getPublicS3Url(img.s3Key),
        order: img.order,
        s3Key: img.s3Key,
      })),
      likes,
      dislikes,
      currentUserRating,
      ratings: undefined, // Limpiar datos no necesarios
    };

    return NextResponse.json(visualMaterial);
  } catch (error) {
    console.error("Error al obtener material visual:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { visualMaterialId: string } }
) {
  try {
    const session = await getSession();
    const { visualMaterialId } = params;

    const existingMaterial = await prisma.visualMaterial.findUnique({
      where: { id: visualMaterialId },
      include: { images: true },
    });

    if (!existingMaterial) {
      return NextResponse.json(
        { error: "Material visual no encontrado" },
        { status: 404 }
      );
    }

    if (
      !session ||
      session.id !== existingMaterial.userId ||
      (session.userType !== UserType.SCHOOL &&
        session.userType !== UserType.GOVERNMENT)
    ) {
      return NextResponse.json(
        { error: "No autorizado para modificar este material." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const formValues: Record<string, any> = {};
    const newImageFiles: File[] = [];
    const existingImageS3KeysRaw = formData.get("existingImageS3Keys") as
      | string
      | null; // JSON string de {id, s3Key, order}[]
    const imagesToDeleteRaw = formData.get("imagesToDelete") as string | null; // JSON string de s3Key[]

    formData.forEach((value, key) => {
      if (key.startsWith("images[")) {
        if (value instanceof File) newImageFiles.push(value);
      } else if (key !== "existingImageS3Keys" && key !== "imagesToDelete") {
        formValues[key] = value;
      }
    });

    if (formValues.description === "") formValues.description = null;
    if (formValues.authorInfo === "") formValues.authorInfo = null;

    const validationResult = updateVisualMaterialSchema.safeParse(formValues);
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

    const existingImages: { id: string; s3Key: string; order: number }[] =
      existingImageS3KeysRaw ? JSON.parse(existingImageS3KeysRaw) : [];
    const imagesToDeleteS3Keys: string[] = imagesToDeleteRaw
      ? JSON.parse(imagesToDeleteRaw)
      : [];

    // Validar nuevas imágenes
    if (
      newImageFiles.length +
        existingImages.filter(
          (img) => !imagesToDeleteS3Keys.includes(img.s3Key)
        ).length >
      MAX_FILES
    ) {
      return NextResponse.json(
        { error: `No puedes tener más de ${MAX_FILES} imágenes.` },
        { status: 400 }
      );
    }
    if (
      newImageFiles.length +
        existingImages.filter(
          (img) => !imagesToDeleteS3Keys.includes(img.s3Key)
        ).length <
      MIN_FILES
    ) {
      return NextResponse.json(
        { error: `Debes tener al menos ${MIN_FILES} imagen.` },
        { status: 400 }
      );
    }

    for (const file of newImageFiles) {
      const fileValidation = validateFile(file);
      if (!fileValidation.valid)
        return NextResponse.json(
          { error: fileValidation.error || `Archivo inválido: ${file.name}` },
          { status: 400 }
        );
    }

    const updatedMaterial = await prisma.$transaction(async (tx) => {
      // 1. Eliminar imágenes marcadas para borrar (de S3 y DB)
      if (imagesToDeleteS3Keys.length > 0) {
        for (const s3KeyToDelete of imagesToDeleteS3Keys) {
          await deleteFileFromS3(s3KeyToDelete);
        }
        await tx.visualMaterialImage.deleteMany({
          where: { visualMaterialId, s3Key: { in: imagesToDeleteS3Keys } },
        });
      }

      // 2. Subir nuevas imágenes a S3
      const newUploadedS3Keys: { s3Key: string; order: number }[] = [];
      // Determinar el siguiente 'order' basado en las imágenes existentes que no se eliminan
      const remainingExistingImages = existingImages.filter(
        (img) => !imagesToDeleteS3Keys.includes(img.s3Key)
      );
      let currentMaxOrder =
        remainingExistingImages.length > 0
          ? Math.max(...remainingExistingImages.map((img) => img.order))
          : -1;

      for (let i = 0; i < newImageFiles.length; i++) {
        const file = newImageFiles[i];
        const s3Response = await uploadVisualMaterialImageToS3(file);
        currentMaxOrder++;
        newUploadedS3Keys.push({
          s3Key: s3Response.fileKey,
          order: currentMaxOrder,
        });
      }

      // 3. Actualizar el VisualMaterial y crear los nuevos VisualMaterialImage
      const finalUpdate = await tx.visualMaterial.update({
        where: { id: visualMaterialId },
        data: {
          ...dataToUpdate,
          images: {
            create: newUploadedS3Keys.map((img) => ({
              s3Key: img.s3Key,
              order: img.order,
            })),
          },
        },
        include: { images: { orderBy: { order: "asc" } } },
      });
      // Reordenar imágenes si es necesario (después de eliminaciones y adiciones)
      const allCurrentImageRecords = await tx.visualMaterialImage.findMany({
        where: { visualMaterialId },
        orderBy: { createdAt: "asc" }, // O algún otro criterio si el 'order' inicial no es fiable tras eliminaciones
      });

      for (let i = 0; i < allCurrentImageRecords.length; i++) {
        if (allCurrentImageRecords[i].order !== i) {
          await tx.visualMaterialImage.update({
            where: { id: allCurrentImageRecords[i].id },
            data: { order: i },
          });
        }
      }
      // Volver a fetchear con el orden correcto
      return tx.visualMaterial.findUnique({
        where: { id: visualMaterialId },
        include: { images: { orderBy: { order: "asc" } } },
      });
    });

    if (!updatedMaterial)
      throw new Error(
        "No se pudo actualizar el material después de la transacción."
      );

    const responseVisualMaterial = {
      ...updatedMaterial,
      images: updatedMaterial.images.map((img) => ({
        id: img.id,
        url: getPublicS3Url(img.s3Key),
        order: img.order,
        s3Key: img.s3Key,
      })),
    };

    return NextResponse.json(responseVisualMaterial);
  } catch (error) {
    console.error("Error al actualizar material visual:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { visualMaterialId: string } }
) {
  try {
    const session = await getSession();
    const { visualMaterialId } = params;

    const materialToDelete = await prisma.visualMaterial.findUnique({
      where: { id: visualMaterialId },
      include: { images: true },
    });

    if (!materialToDelete) {
      return NextResponse.json(
        { error: "Material visual no encontrado" },
        { status: 404 }
      );
    }
    if (
      !session ||
      session.id !== materialToDelete.userId ||
      (session.userType !== UserType.SCHOOL &&
        session.userType !== UserType.GOVERNMENT)
    ) {
      return NextResponse.json(
        { error: "No autorizado para eliminar este material." },
        { status: 403 }
      );
    }

    // Eliminar imágenes de S3 y luego el registro de la base de datos (Prisma se encarga de cascada para VisualMaterialImage y VisualMaterialRating)
    for (const image of materialToDelete.images) {
      await deleteFileFromS3(image.s3Key);
    }

    // Prisma onDelete: Cascade debería encargarse de VisualMaterialImage y VisualMaterialRating
    await prisma.visualMaterial.delete({ where: { id: visualMaterialId } });

    return NextResponse.json({
      message: "Material visual eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar material visual:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
