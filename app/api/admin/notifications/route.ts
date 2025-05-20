// app/api/admin/notifications/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const notificationSchema = z.object({
  userId: z.string().cuid("ID de usuario inválido."),
  title: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres.")
    .max(100, "El título no puede exceder los 100 caracteres."),
  message: z
    .string()
    .min(10, "El mensaje debe tener al menos 10 caracteres.")
    .max(500, "El mensaje no puede exceder los 500 caracteres."),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = notificationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos para la notificación",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { userId, title, message } = validationResult.data;

    // Verificar que el usuario destinatario exista
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuario destinatario no encontrado" },
        { status: 404 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        isRead: false, // Por defecto no leída
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Error al enviar notificación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al enviar notificación." },
      { status: 500 }
    );
  }
}
