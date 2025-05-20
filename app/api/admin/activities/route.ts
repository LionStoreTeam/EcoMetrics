// app/api/admin/activities/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getPublicS3Url } from "@/lib/s3-service";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("search") || "";
    const userType = searchParams.get("userType") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (searchTerm) {
      whereClause.user = {
        OR: [
          {
            name: {
              contains:
                searchTerm /* mode: "insensitive" // Removido por compatibilidad SQLite */,
            },
          },
          {
            email: {
              contains: searchTerm /* mode: "insensitive" // Removido */,
            },
          },
        ],
      };
    }

    if (userType !== "all") {
      if (whereClause.user) {
        whereClause.user.userType = userType;
      } else {
        whereClause.user = { userType };
      }
    }

    const activitiesFromDb = await prisma.activity.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            userType: true,
            profile: {
              select: { avatarUrl: true }, // fileKey del avatar
            },
          },
        },
        evidence: {
          select: {
            id: true,
            fileUrl: true, // fileKey de la evidencia
            fileType: true,
            fileName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const totalActivities = await prisma.activity.count({ where: whereClause });

    const activities = activitiesFromDb.map((activity) => {
      let userAvatarPublicUrl: string | null = null;
      if (activity.user.profile?.avatarUrl) {
        userAvatarPublicUrl = getPublicS3Url(activity.user.profile.avatarUrl);
      }

      return {
        ...activity,
        user: {
          ...activity.user,
          profile: {
            ...activity.user.profile,
            avatarPublicUrl: userAvatarPublicUrl, // URL para mostrar avatar
          },
        },
        evidence:
          activity.evidence?.map((ev) => {
            const publicDisplayUrl = ev.fileUrl
              ? getPublicS3Url(ev.fileUrl)
              : null;
            return {
              ...ev,
              publicDisplayUrl, // URL para mostrar evidencia
            };
          }) || [],
      };
    });

    return NextResponse.json({
      activities,
      pagination: {
        total: totalActivities,
        page,
        limit,
        totalPages: Math.ceil(totalActivities / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener actividades para admin:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al obtener actividades." },
      { status: 500 }
    );
  }
}

// POST para notificaciones se añadirá en la Parte 2
