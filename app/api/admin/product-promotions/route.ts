// // // app/api/admin/product-promotions/route.ts
// // import { type NextRequest, NextResponse } from "next/server";
// // import prisma from "@/lib/prisma";
// // import { getSession } from "@/lib/auth";
// // import { getPublicS3Url } from "@/lib/s3-service";
// // import { BusinessPromotionStatus } from "@prisma/client";

// // export async function GET(request: NextRequest) {
// //   try {
// //     const session = await getSession();
// //     if (!session || session.role !== "ADMIN") {
// //       return NextResponse.json({ error: "No autorizado" }, { status: 403 });
// //     }

// //     const { searchParams } = new URL(request.url);
// //     const page = parseInt(searchParams.get("page") || "1", 10);
// //     const limit = parseInt(searchParams.get("limit") || "10", 10);
// //     const statusFilter = searchParams.get("status") as
// //       | BusinessPromotionStatus
// //       | "ALL";
// //     const searchTerm = searchParams.get("search") || "";
// //     const skip = (page - 1) * limit;

// //     const whereClause: any = {};
// //     if (statusFilter && statusFilter !== "ALL") {
// //       whereClause.status = statusFilter;
// //     }

// //     if (searchTerm) {
// //       whereClause.OR = [
// //         { businessName: { contains: searchTerm, mode: "insensitive" } },
// //         { productName: { contains: searchTerm, mode: "insensitive" } },
// //         { contactEmail: { contains: searchTerm, mode: "insensitive" } },
// //       ];
// //     }

// //     const promotionRequests = await prisma.productPromotionRequest.findMany({
// //       where: whereClause,
// //       orderBy: { submittedAt: "desc" },
// //       skip,
// //       take: limit,
// //       include: {
// //         productImages: { select: { id: true, url: true } }, // Incluir URLs de imágenes de producto
// //       },
// //     });

// //     const totalRequests = await prisma.productPromotionRequest.count({
// //       where: whereClause,
// //     });

// //     const formattedRequests = promotionRequests.map((req) => ({
// //       ...req,
// //       businessLogoUrl: req.businessLogoUrl
// //         ? getPublicS3Url(req.businessLogoUrl)
// //         : null,
// //       productImages: req.productImages.map((img) => ({
// //         ...img,
// //         url: getPublicS3Url(img.url), // Convertir S3 keys a URLs públicas
// //       })),
// //       submittedAt: req.submittedAt.toISOString(),
// //       reviewedAt: req.reviewedAt ? req.reviewedAt.toISOString() : null,
// //       validUntil: req.validUntil ? req.validUntil.toISOString() : null,
// //     }));

// //     return NextResponse.json({
// //       requests: formattedRequests,
// //       pagination: {
// //         total: totalRequests,
// //         page,
// //         limit,
// //         totalPages: Math.ceil(totalRequests / limit),
// //       },
// //     });
// //   } catch (error) {
// //     console.error(
// //       "Error al obtener solicitudes de promoción de productos:",
// //       error
// //     );
// //     return NextResponse.json(
// //       {
// //         error:
// //           "Error interno del servidor al obtener solicitudes de productos.",
// //       },
// //       { status: 500 }
// //     );
// //   }
// // }

// // app/api/admin/product-promotions/route.ts
// import { type NextRequest, NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { getSession } from "@/lib/auth"; //
// import { getPublicS3Url } from "@/lib/s3-service"; //
// import { BusinessPromotionStatus } from "@prisma/client";

// export async function GET(request: NextRequest) {
//   try {
//     const session = await getSession();
//     if (!session || session.role !== "ADMIN") {
//       return NextResponse.json({ error: "No autorizado" }, { status: 403 });
//     }

//     const { searchParams } = new URL(request.url);
//     const page = parseInt(searchParams.get("page") || "1", 10);
//     const limit = parseInt(searchParams.get("limit") || "10", 10);
//     const statusFilter = searchParams.get("status") as
//       | BusinessPromotionStatus
//       | "ALL";
//     const searchTerm = searchParams.get("search") || "";
//     const skip = (page - 1) * limit;

//     const whereClause: any = {};
//     if (statusFilter && statusFilter !== "ALL") {
//       whereClause.status = statusFilter;
//     }

//     if (searchTerm) {
//       whereClause.OR = [
//         { businessName: { contains: searchTerm, mode: "insensitive" } },
//         { productName: { contains: searchTerm, mode: "insensitive" } },
//         { contactEmail: { contains: searchTerm, mode: "insensitive" } },
//       ];
//     }

//     const promotionRequests = await prisma.productPromotionRequest.findMany({
//       where: whereClause,
//       orderBy: { submittedAt: "desc" },
//       skip,
//       take: limit,
//       include: {
//         productImages: {
//           // ESTA INCLUSIÓN ES CLAVE
//           select: { id: true, url: true }, // 'url' es la S3 key
//           orderBy: { createdAt: "asc" },
//         },
//       },
//     });

//     const totalRequests = await prisma.productPromotionRequest.count({
//       where: whereClause,
//     });

//     const formattedRequests = promotionRequests.map((req) => {
//       const publicBusinessLogoUrl = req.businessLogoUrl
//         ? getPublicS3Url(req.businessLogoUrl)
//         : null;
//       const publicProductImages = req.productImages.map((img) => ({
//         id: img.id,
//         url: img.url ? getPublicS3Url(img.url) : null, // Transforma cada S3 key de imagen de producto
//       }));

//       return {
//         ...req,
//         businessLogoUrl: publicBusinessLogoUrl,
//         productImages: publicProductImages, // Array de objetos con URLs públicas
//         // Asegurar que las fechas sean strings ISO
//         submittedAt: req.submittedAt.toISOString(),
//         reviewedAt: req.reviewedAt ? req.reviewedAt.toISOString() : null,
//         validUntil: req.validUntil ? req.validUntil.toISOString() : null,
//       };
//     });

//     return NextResponse.json({
//       requests: formattedRequests,
//       pagination: {
//         total: totalRequests,
//         page,
//         limit,
//         totalPages: Math.ceil(totalRequests / limit),
//       },
//     });
//   } catch (error) {
//     console.error(
//       "Error al obtener solicitudes de promoción de productos (admin):",
//       error
//     );
//     return NextResponse.json(
//       {
//         error:
//           "Error interno del servidor al obtener solicitudes de productos para admin.",
//       },
//       { status: 500 }
//     );
//   }
// }

// app/api/admin/product-promotions/[requestId]/route.ts
// app/api/admin/product-promotions/route.ts
// app/api/admin/product-promotions/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getPublicS3Url } from "@/lib/s3-service"; //
import { BusinessPromotionStatus } from "@prisma/client";

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
      | "ALL";
    const searchTerm = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (statusFilter && statusFilter !== "ALL") {
      whereClause.status = statusFilter;
    }

    if (searchTerm) {
      whereClause.OR = [
        { businessName: { contains: searchTerm } },
        { productName: { contains: searchTerm } },
        { contactEmail: { contains: searchTerm } },
      ];
    }

    const promotionRequests = await prisma.productPromotionRequest.findMany({
      where: whereClause,
      orderBy: { submittedAt: "desc" },
      skip,
      take: limit,
      include: {
        productImages: {
          // ESTA INCLUSIÓN ES CLAVE
          select: { id: true, url: true }, // 'url' es la S3 key
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const totalRequests = await prisma.productPromotionRequest.count({
      where: whereClause,
    });

    const formattedRequests = promotionRequests.map((req) => {
      const publicBusinessLogoUrl = req.businessLogoUrl
        ? getPublicS3Url(req.businessLogoUrl)
        : null;
      const publicProductImages = req.productImages.map((img) => ({
        // Verifica que req.productImages exista y sea un array
        id: img.id,
        url: img.url ? getPublicS3Url(img.url) : null, // Transforma cada S3 key
      }));

      return {
        ...req,
        businessLogoUrl: publicBusinessLogoUrl,
        productImages: publicProductImages, // Array de objetos con URLs públicas
        submittedAt: req.submittedAt.toISOString(),
        reviewedAt: req.reviewedAt ? req.reviewedAt.toISOString() : null,
        validUntil: req.validUntil ? req.validUntil.toISOString() : null,
      };
    });

    // console.log("Admin API - Formatted Product Promotion Requests:", JSON.stringify(formattedRequests, null, 2)); // Para depuración

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
    console.error(
      "Error al obtener solicitudes de promoción de productos (admin):",
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      {
        error:
          "Error interno del servidor al obtener solicitudes de productos para admin.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// GET para un solo registro (si se necesitara en el futuro)
// export async function GET(
//   request: NextRequest,
//   { params }: { params: { requestId: string } }
// ) {
//   try {
//     const session = await getSession();
//     if (!session || session.role !== "ADMIN") { // O permitir a cualquier usuario ver si es relevante
//       return NextResponse.json({ error: "No autorizado" }, { status: 403 });
//     }

//     const { requestId } = params;
//     if (!requestId) {
//       return NextResponse.json({ error: "ID de solicitud de producto requerido" }, { status: 400 });
//     }

//     const promotionRequest = await prisma.productPromotionRequest.findUnique({
//       where: { id: requestId },
//       include: {
//         productImages: {
//           select: { id: true, url: true },
//           orderBy: { createdAt: 'asc' },
//         },
//       },
//     });

//     if (!promotionRequest) {
//       return NextResponse.json({ error: "Solicitud de promoción de producto no encontrada" }, { status: 404 });
//     }

//     const formattedRequest = {
//       ...promotionRequest,
//       businessLogoUrl: promotionRequest.businessLogoUrl ? getPublicS3Url(promotionRequest.businessLogoUrl) : null,
//       productImages: promotionRequest.productImages.map(img => ({
//         id: img.id,
//         url: img.url ? getPublicS3Url(img.url) : null,
//       })),
//       submittedAt: promotionRequest.submittedAt.toISOString(),
//       reviewedAt: promotionRequest.reviewedAt ? promotionRequest.reviewedAt.toISOString() : null,
//       validUntil: promotionRequest.validUntil ? promotionRequest.validUntil.toISOString() : null,
//     };

//     return NextResponse.json(formattedRequest);

//   } catch (error) {
//     console.error("Error al obtener detalles de la solicitud de producto:", error);
//     return NextResponse.json(
//       { error: "Error interno del servidor al obtener detalles de la solicitud." },
//       { status: 500 }
//     );
//   }
// }
