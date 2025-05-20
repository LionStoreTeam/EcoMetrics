import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth"; // Assuming getSession can identify the logged-in user
import { getSignedFileUrl } from "@/lib/s3-service";

// Define a type for the user data to be returned
interface ScoreUser {
  id: string;
  name: string;
  email: string;
  userType: string;
  avatarUrl?: string | null; // This will be the signed URL
  totalActivities: number;
  totalPoints: number;
  level: number;
  memberSince: string; // ISO date string
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    // Optional: Add role check if only specific users (e.g., admins or all authenticated users) can see scores
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("search") || "";
    const userTypeFilter = searchParams.get("userType") || "all"; // 'all', 'INDIVIDUAL', 'SCHOOL', 'COMMUNITY', 'GOVERNMENT'
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    // Only add OR condition if searchTerm is present
    if (searchTerm) {
      whereClause.OR = [
        { name: { contains: searchTerm /* mode: "insensitive" removed */ } },
        { email: { contains: searchTerm /* mode: "insensitive" removed */ } },
      ];
    }

    if (userTypeFilter !== "all") {
      whereClause.userType = userTypeFilter;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        points: true,
        level: true,
        createdAt: true,
        profile: {
          select: {
            avatarUrl: true, // This is the fileKey
          },
        },
        _count: {
          select: {
            activities: true,
          },
        },
      },
      orderBy: {
        points: "desc", // Example: order by points
      },
      skip,
      take: limit,
    });

    const totalUsers = await prisma.user.count({ where: whereClause });

    const formattedUsers: ScoreUser[] = await Promise.all(
      users.map(async (user) => {
        let signedAvatarUrl: string | null = null;
        if (user.profile?.avatarUrl) {
          try {
            signedAvatarUrl = await getSignedFileUrl(user.profile.avatarUrl);
          } catch (e) {
            console.error(
              `Error al generar URL firmada para ${user.profile.avatarUrl}:`,
              e
            );
            // Mantener signedAvatarUrl como null si falla la generación
          }
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          avatarUrl: signedAvatarUrl,
          totalActivities: user._count.activities,
          totalPoints: user.points,
          level: user.level,
          memberSince: user.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener los scores de usuarios:", error);
    // Devolver el error de Prisma si es una PrismaClientValidationError para más detalles en el cliente
    if (error instanceof prisma.$executeRawUnsafe) {
      return NextResponse.json(
        {
          error: "Error de validación de Prisma al obtener los scores.",
          details: error.toString(),
        },
        { status: 400 } // Bad Request podría ser más apropiado para errores de validación
      );
    }
    return NextResponse.json(
      { error: "Error interno del servidor al obtener los scores." },
      { status: 500 }
    );
  }
}
