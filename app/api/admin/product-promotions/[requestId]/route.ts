// app/api/admin/product-promotions/[requestId]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { BusinessPromotionStatus } from "@prisma/client";
import { z } from "zod";
import { getPublicS3Url } from "@/lib/s3-service";

const updateProductPromotionStatusSchema = z.object({
  status: z.nativeEnum(BusinessPromotionStatus),
  reviewerNotes: z.string().optional().nullable(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { requestId } = params;
    if (!requestId) {
      return NextResponse.json(
        { error: "ID de solicitud de producto requerido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = updateProductPromotionStatusSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos de actualización inválidos",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { status, reviewerNotes } = validationResult.data;

    const existingRequest = await prisma.productPromotionRequest.findUnique({
      where: { id: requestId },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Solicitud de promoción de producto no encontrada" },
        { status: 404 }
      );
    }

    const updatedRequest = await prisma.productPromotionRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewerNotes: reviewerNotes || null, // Asegura que se guarde null si reviewerNotes es "" o undefined
        reviewedAt: new Date(),
      },
      // Incluir productImages aquí es opcional para la respuesta PUT,
      // pero si se hace, se deben formatear las URLs.
      // Por consistencia, si se devuelve el objeto actualizado, es bueno incluirlo.
      include: {
        productImages: {
          select: { id: true, url: true },
        },
      },
    });

    // Formatear las URLs de las imágenes para la respuesta, si se incluyeron
    const responseData = {
      ...updatedRequest,
      businessLogoUrl: updatedRequest.businessLogoUrl
        ? getPublicS3Url(updatedRequest.businessLogoUrl)
        : null,
      productImages: updatedRequest.productImages.map((img) => ({
        id: img.id,
        url: img.url ? getPublicS3Url(img.url) : null,
      })),
      submittedAt: updatedRequest.submittedAt.toISOString(),
      reviewedAt: updatedRequest.reviewedAt
        ? updatedRequest.reviewedAt.toISOString()
        : null,
      validUntil: updatedRequest.validUntil
        ? updatedRequest.validUntil.toISOString()
        : null,
    };

    // Opcional: Enviar notificación al solicitante (lógica a implementar si es necesario)

    return NextResponse.json(responseData); // Devolver el objeto actualizado con URLs formateadas
  } catch (error) {
    console.error(
      "Error al actualizar estado de la solicitud de producto:",
      error
    );
    if (error instanceof z.ZodError) {
      // Aunque la validación está antes, es una buena práctica mantenerlo.
      return NextResponse.json(
        {
          error: "Datos inválidos para actualizar producto",
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error:
          "Error interno del servidor al actualizar la solicitud de producto.",
      },
      { status: 500 }
    );
  }
}

// GET para un solo registro (si se necesitara en el futuro)
// export async function GET(
//   request: NextRequest,
//   { params }: { params: { requestId: string } }
// ) {
//   try {
//     const session = await getSession();
//     if (!session || session.role !== "ADMIN") { // O permitir a cualquier usuario ver si es relevante
//       return NextResponse.json({ error: "No autorizado" }, { status: 403 });
//     }

//     const { requestId } = params;
//     if (!requestId) {
//       return NextResponse.json({ error: "ID de solicitud de producto requerido" }, { status: 400 });
//     }

//     const promotionRequest = await prisma.productPromotionRequest.findUnique({
//       where: { id: requestId },
//       include: {
//         productImages: {
//           select: { id: true, url: true },
//           orderBy: { createdAt: 'asc' },
//         },
//       },
//     });

//     if (!promotionRequest) {
//       return NextResponse.json({ error: "Solicitud de promoción de producto no encontrada" }, { status: 404 });
//     }

//     const formattedRequest = {
//       ...promotionRequest,
//       businessLogoUrl: promotionRequest.businessLogoUrl ? getPublicS3Url(promotionRequest.businessLogoUrl) : null,
//       productImages: promotionRequest.productImages.map(img => ({
//         id: img.id,
//         url: img.url ? getPublicS3Url(img.url) : null,
//       })),
//       submittedAt: promotionRequest.submittedAt.toISOString(),
//       reviewedAt: promotionRequest.reviewedAt ? promotionRequest.reviewedAt.toISOString() : null,
//       validUntil: promotionRequest.validUntil ? promotionRequest.validUntil.toISOString() : null,
//     };

//     return NextResponse.json(formattedRequest);

//   } catch (error) {
//     console.error("Error al obtener detalles de la solicitud de producto:", error);
//     return NextResponse.json(
//       { error: "Error interno del servidor al obtener detalles de la solicitud." },
//       { status: 500 }
//     );
//   }
// }
