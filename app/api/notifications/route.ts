// app/api/notifications/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      // Asegurarse que session.id exista
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    // Podríamos añadir paginación si se esperan muchas notificaciones
    // const page = parseInt(searchParams.get("page") || "1", 10);
    // const limit = parseInt(searchParams.get("limit") || "15", 10);
    // const skip = (page - 1) * limit;

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.id as string,
      },
      orderBy: {
        createdAt: "desc",
      },
      // take: limit,
      // skip: skip,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.id as string,
        isRead: false,
      },
    });

    // const totalNotifications = await prisma.notification.count({
    //   where: { userId: session.id as string },
    // });

    return NextResponse.json({
      notifications,
      unreadCount,
      // pagination: {
      //   total: totalNotifications,
      //   page,
      //   limit,
      //   totalPages: Math.ceil(totalNotifications / limit),
      // },
    });
  } catch (error) {
    console.error("Error al obtener notificaciones del usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al obtener notificaciones." },
      { status: 500 }
    );
  }
}
