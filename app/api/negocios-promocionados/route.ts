// app/api/negocios-promocionados/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; //
import { getPublicS3Url } from "@/lib/s3-service"; //
import { BusinessPromotionStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "9", 10);
    const businessNameSearch = searchParams.get("name") || "";
    const stateFilter = searchParams.get("state") || "ALL";
    const businessTypeFilter = searchParams.get("type") || "ALL";
    const skip = (page - 1) * limit;

    const whereClause: any = {
      status: BusinessPromotionStatus.APPROVED,
      AND: [], // Inicializamos AND para agregar condiciones
    };

    if (businessNameSearch) {
      // Quitamos mode: "insensitive" para mayor compatibilidad,
      // la búsqueda será sensible a mayúsculas/minúsculas por defecto con `contains` en algunas DBs.
      // Para una búsqueda insensible real, se necesitaría una solución a nivel de DB o un PRISMA.$queryRaw.
      // Por ahora, nos enfocamos en que funcione sin error.
      whereClause.AND.push({
        businessName: {
          contains: businessNameSearch,
          // mode: "insensitive", // Removido para evitar errores, especialmente con SQLite
        },
      });
    }

    if (stateFilter && stateFilter !== "ALL") {
      whereClause.AND.push({
        state: stateFilter,
      });
    }

    if (businessTypeFilter && businessTypeFilter !== "ALL") {
      whereClause.AND.push({
        businessType: businessTypeFilter,
      });
    }

    // Si AND está vacío después de aplicar filtros, lo eliminamos para no enviar un { AND: [] } innecesario
    if (whereClause.AND.length === 0) {
      delete whereClause.AND;
    }

    const businesses = await prisma.businessPromotionRequest.findMany({
      where: whereClause,
      orderBy: {
        submittedAt: "desc",
      },
      skip,
      take: limit,
    });

    const totalBusinesses = await prisma.businessPromotionRequest.count({
      where: whereClause,
    });

    const formattedBusinesses = businesses.map((business) => ({
      ...business,
      logoUrl: business.logoUrl ? getPublicS3Url(business.logoUrl) : null,
      submittedAt: business.submittedAt.toISOString(),
      reviewedAt: business.reviewedAt
        ? business.reviewedAt.toISOString()
        : null,
    }));

    return NextResponse.json({
      businesses: formattedBusinesses,
      pagination: {
        total: totalBusinesses,
        page,
        limit,
        totalPages: Math.ceil(totalBusinesses / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener negocios promocionados:", error);
    // Para depuración, puedes devolver el mensaje de error específico
    // const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      {
        error:
          "Error interno del servidor al obtener negocios." /*, details: errorMessage */,
      },
      { status: 500 }
    );
  }
}
