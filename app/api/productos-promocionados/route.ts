// app/api/productos-promocionados/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getPublicS3Url } from "@/lib/s3-service";
import { BusinessPromotionStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "9", 10);
    const searchTerm = searchParams.get("name") || "";
    const stateFilter = searchParams.get("state") || "ALL";
    const businessTypeFilter = searchParams.get("type") || "ALL";
    const skip = (page - 1) * limit;

    const baseWhereClause: any = {
      status: BusinessPromotionStatus.APPROVED,
    };
    const andConditions = [];

    if (stateFilter && stateFilter !== "ALL") {
      andConditions.push({ state: stateFilter });
    }

    if (businessTypeFilter && businessTypeFilter !== "ALL") {
      andConditions.push({ businessType: businessTypeFilter });
    }

    if (searchTerm) {
      andConditions.push({
        OR: [
          { productName: { contains: searchTerm } },
          { businessName: { contains: searchTerm } },
          { description: { contains: searchTerm } },
        ],
      });
    }

    const whereClause =
      andConditions.length > 0
        ? { ...baseWhereClause, AND: andConditions }
        : baseWhereClause;

    const productPromotions = await prisma.productPromotionRequest.findMany({
      where: whereClause,
      orderBy: {
        submittedAt: "desc",
      },
      include: {
        productImages: {
          // Asegurar que se incluyan las imágenes del producto
          select: { id: true, url: true }, // 'url' aquí es la S3 key
          orderBy: { createdAt: "asc" }, // Para consistencia, ej. tomar la primera como principal
        },
      },
      skip,
      take: limit,
    });

    const totalProductPromotions = await prisma.productPromotionRequest.count({
      where: whereClause,
    });

    const formattedProductPromotions = productPromotions.map((promo) => {
      // Transformar URLs de S3 keys a URLs públicas completas
      const publicProductImages = promo.productImages.map((img) => ({
        id: img.id,
        url: img.url ? getPublicS3Url(img.url) : null, // Usar getPublicS3Url
      }));

      return {
        ...promo, // Mantiene todos los demás campos de promo
        businessLogoUrl: promo.businessLogoUrl
          ? getPublicS3Url(promo.businessLogoUrl)
          : null,
        productImages: publicProductImages, // Array de objetos con URLs públicas
        // Formatear fechas a ISO strings para la serialización JSON
        submittedAt: promo.submittedAt.toISOString(),
        reviewedAt: promo.reviewedAt ? promo.reviewedAt.toISOString() : null,
        validUntil: promo.validUntil ? promo.validUntil.toISOString() : null,
      };
    });

    return NextResponse.json({
      promotions: formattedProductPromotions,
      pagination: {
        total: totalProductPromotions,
        page,
        limit,
        totalPages: Math.ceil(totalProductPromotions / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener promociones de productos:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      {
        error:
          "Error interno del servidor al obtener promociones de productos.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
