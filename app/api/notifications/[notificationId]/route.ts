// app/api/notifications/[notificationId]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { notificationId } = params;
    if (!notificationId) {
      return NextResponse.json(
        { error: "ID de notificación requerido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { isRead } = body; // Esperamos un booleano isRead

    if (typeof isRead !== "boolean") {
      return NextResponse.json(
        { error: "El campo 'isRead' debe ser un booleano." },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notificación no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la notificación pertenezca al usuario logueado
    if (notification.userId !== session.id) {
      return NextResponse.json(
        { error: "Acceso denegado a esta notificación" },
        { status: 403 }
      );
    }

    const updatedNotification = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: isRead, // Marcar como leída o no leída según el payload
      },
    });

    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error("Error al actualizar notificación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al actualizar notificación." },
      { status: 500 }
    );
  }
}
