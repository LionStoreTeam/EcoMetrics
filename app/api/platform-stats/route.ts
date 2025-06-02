import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; //
import { BusinessPromotionStatus } from "@prisma/client";

export async function GET() {
  try {
    const totalUsers = await prisma.user.count();
    const totalActivities = await prisma.activity.count();

    // Contar solo negocios y productos aprobados
    const totalApprovedBusinesses = await prisma.businessPromotionRequest.count(
      {
        where: { status: BusinessPromotionStatus.APPROVED },
      }
    );
    const totalApprovedProducts = await prisma.productPromotionRequest.count({
      where: { status: BusinessPromotionStatus.APPROVED },
    });

    return NextResponse.json({
      totalUsers,
      totalActivities,
      totalBusinesses: totalApprovedBusinesses,
      totalProducts: totalApprovedProducts,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas de la plataforma:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al obtener estadísticas." },
      { status: 500 }
    );
  }
}
