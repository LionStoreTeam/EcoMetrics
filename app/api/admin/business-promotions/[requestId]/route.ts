// app/api/admin/business-promotions/[requestId]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth"; //
import { BusinessPromotionStatus } from "@prisma/client";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.nativeEnum(BusinessPromotionStatus), // Usar el enum directamente
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
        { error: "ID de solicitud requerido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = updateStatusSchema.safeParse(body);

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

    const existingRequest = await prisma.businessPromotionRequest.findUnique({
      where: { id: requestId },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    const updatedRequest = await prisma.businessPromotionRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewerNotes: reviewerNotes || null,
        reviewedAt: new Date(),
      },
    });

    // Aquí podrías añadir lógica para enviar una notificación al usuario sobre el estado de su solicitud.

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Error al actualizar estado de la solicitud:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error interno del servidor al actualizar la solicitud." },
      { status: 500 }
    );
  }
}
