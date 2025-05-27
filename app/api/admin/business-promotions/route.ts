// app/api/admin/business-promotions/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth"; //
import { getPublicS3Url } from "@/lib/s3-service"; // Necesitaremos esto para mostrar el logo
import { BusinessPromotionStatus } from "@prisma/client"; // Importar el enum

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const statusFilter = searchParams.get("status") as
      | BusinessPromotionStatus
      | "ALL"; // PENDING_APPROVAL, APPROVED, REJECTED, ALL
    const searchTerm = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (statusFilter && statusFilter !== "ALL") {
      whereClause.status = statusFilter;
    }

    if (searchTerm) {
      whereClause.OR = [
        { businessName: { contains: searchTerm } },
        { email: { contains: searchTerm } },
        { city: { contains: searchTerm } },
        { state: { contains: searchTerm } },
      ];
    }

    const promotionRequests = await prisma.businessPromotionRequest.findMany({
      where: whereClause,
      orderBy: {
        submittedAt: "desc", // Mostrar las más recientes primero
      },
      skip,
      take: limit,
    });

    const totalRequests = await prisma.businessPromotionRequest.count({
      where: whereClause,
    });

    // Añadir URL pública para el logo
    const formattedRequests = promotionRequests.map((req) => ({
      ...req,
      logoUrl: req.logoUrl ? getPublicS3Url(req.logoUrl) : null,
      // Asegúrate de que las fechas sean strings ISO para la serialización JSON
      submittedAt: req.submittedAt.toISOString(),
      reviewedAt: req.reviewedAt ? req.reviewedAt.toISOString() : null,
    }));

    return NextResponse.json({
      requests: formattedRequests,
      pagination: {
        total: totalRequests,
        page,
        limit,
        totalPages: Math.ceil(totalRequests / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener solicitudes de promoción:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al obtener solicitudes." },
      { status: 500 }
    );
  }
}
