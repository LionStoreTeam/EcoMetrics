// lionstoreteam/ecometrics/EcoMetrics-9cdd9112192325b6fafd06b5945494aa18f69ba4/app/api/activities/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import {
  uploadFileEvidenceToS3,
  validateFile,
  getPublicS3Url, // Asegúrate que esta importación exista o esté correcta
} from "@/lib/s3-service";
import { ALL_BADGES } from "@/lib/badgeDefinitions";
import { ActivityStatus } from "@prisma/client"; // Importar el enum generado por Prisma
import { MAX_FILES, MIN_FILES } from "@/types/types-s3-service";

// El schema de Zod se mantiene igual para la validación de entrada
const activitySchema = z.object({
  title: z
    .string()
    .min(10, { message: "El título debe tener al menos 10 caracteres" })
    .max(100, { message: "El título no puede tener más de 100 caracteres" }),
  description: z
    .string()
    .min(10, { message: "La descripción debe tener al menos 10 caracteres" })
    .max(100, {
      message: "La descripción no puede tener más de 100 caracteres",
    }),
  type: z.enum([
    "RECYCLING",
    "TREE_PLANTING",
    "WATER_SAVING",
    "ENERGY_SAVING",
    "COMPOSTING",
    "EDUCATION",
    "OTHER",
  ]),
  quantity: z
    .number()
    .positive({ message: "La cantidad debe ser mayor a 0" })
    .min(1, { message: "La cantidad mínima es 1" })
    .max(20, { message: "La cantidad máxima permitida es 20" }),
  unit: z.string().min(1, { message: "La unidad es requerida" }),
  date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), { message: "Fecha inválida" }),
  groupId: z.string().optional(),
});

// --- LÓGICA DE INSIGNIAS (sin cambios) ---
async function checkAndAwardBadges(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: { include: { badges: true } },
        activities: { select: { type: true, quantity: true, status: true } }, // Incluir status para lógica de insignias si es necesario
        _count: { select: { activities: true } },
      },
    });

    if (!user || !user.profile) return;

    const obtainedBadgeIds = new Set(user.profile.badges.map((b) => b.id));
    const badgesToAward: string[] = [];

    for (const badgeDef of ALL_BADGES) {
      if (obtainedBadgeIds.has(badgeDef.id)) continue;

      let criteriaMet = false;
      switch (badgeDef.criteriaType) {
        case "ACTIVITY_COUNT":
          // Contar solo actividades revisadas para insignias de conteo general si se decide
          const reviewedActivitiesCount = user.activities.filter(
            (act) => act.status === ActivityStatus.REVIEWED
          ).length;
          if (reviewedActivitiesCount >= badgeDef.criteriaThreshold) {
            criteriaMet = true;
          }
          break;
        case "USER_LEVEL":
          if (user.level >= badgeDef.criteriaThreshold) {
            criteriaMet = true;
          }
          break;
        case "TOTAL_POINTS":
          if (user.points >= badgeDef.criteriaThreshold) {
            criteriaMet = true;
          }
          break;
        case "SPECIFIC_ACTIVITY_TYPE_COUNT":
          if (badgeDef.criteriaActivityType) {
            const relevantActivities = user.activities.filter(
              // Considerar si solo actividades revisadas deben contar para insignias específicas
              (act) =>
                act.type === badgeDef.criteriaActivityType &&
                act.status === ActivityStatus.REVIEWED
            );
            const totalQuantity = relevantActivities.reduce(
              (sum, act) => sum + act.quantity,
              0
            );
            if (totalQuantity >= badgeDef.criteriaThreshold) {
              criteriaMet = true;
            }
          }
          break;
      }

      if (criteriaMet) {
        badgesToAward.push(badgeDef.id);
      }
    }

    if (badgesToAward.length > 0) {
      await prisma.profile.update({
        where: { userId: userId },
        data: {
          badges: {
            connect: badgesToAward.map((id) => ({ id })),
          },
        },
      });
      console.log(
        `Usuario ${userId} ha obtenido las insignias: ${badgesToAward.join(
          ", "
        )}`
      );
    }
  } catch (error) {
    console.error(
      `Error al verificar/otorgar insignias para el usuario ${userId}:`,
      error
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.id;
    const groupId = searchParams.get("groupId");
    const type = searchParams.get("type");
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (session.role !== "ADMIN") {
      // Si no es admin, solo puede ver sus propias actividades
      where.userId = session.id as string;
    } else if (userId && userId !== "all") {
      // Si es admin y se especifica un userId
      where.userId = userId as string;
    } // Si es admin y no se especifica userId (o es "all"), no se filtra por userId para obtener todas.

    if (groupId) where.groupId = groupId;
    if (type) where.type = type;

    const activitiesFromDb = await prisma.activity.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        group: true,
        evidence: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const activities = activitiesFromDb.map((activity) => ({
      ...activity,
      // El campo points ahora es el otorgado por el admin, o 0 si está pendiente
      // El campo status indicará si está PENDING_REVIEW o REVIEWED
      evidence:
        activity.evidence?.map((ev) => {
          const publicDisplayUrl = ev.fileUrl
            ? getPublicS3Url(ev.fileUrl)
            : null;
          if (!publicDisplayUrl && ev.fileUrl) {
            console.warn(
              `No se pudo construir la URL pública para la evidencia con fileKey: ${ev.fileUrl}`
            );
          }
          return {
            ...ev,
            publicDisplayUrl: publicDisplayUrl,
          };
        }) || [], // Asegurar que evidence sea un array vacío si es null/undefined
    }));

    const total = await prisma.activity.count({ where });

    return NextResponse.json({
      activities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener actividades:", error);
    return NextResponse.json(
      { error: "Error al obtener actividades" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formDataBody = await request.formData();
    const title = formDataBody.get("title") as string;
    const description = formDataBody.get("description") as string;
    const type = formDataBody.get("type") as string;
    const quantityStr = formDataBody.get("quantity") as string;
    const unit = formDataBody.get("unit") as string;
    const date = formDataBody.get("date") as string;
    const groupId = (formDataBody.get("groupId") as string) || undefined;
    const files = formDataBody.getAll("evidence") as File[];
    const quantity = Number.parseFloat(quantityStr);

    try {
      activitySchema.parse({
        title,
        description,
        type,
        quantity,
        unit,
        date,
        groupId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Datos inválidos",
            details: error.errors.map(
              (e) => `${e.path.join(".")}: ${e.message}`
            ),
          },
          { status: 400 }
        );
      }
      throw error; // Re-lanzar otros errores
    }

    if (files.length < MIN_FILES) {
      return NextResponse.json(
        { error: `Debes subir al menos ${MIN_FILES} archivo como evidencia` },
        { status: 400 }
      );
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `No puedes subir más de ${MAX_FILES} archivos` },
        { status: 400 }
      );
    }

    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error || `Archivo inválido: ${file.name}` },
          { status: 400 }
        );
      }
    }

    const evidenceUploadPromises = files.map((file) =>
      uploadFileEvidenceToS3(file)
    );
    const evidenceResults = await Promise.all(evidenceUploadPromises);

    // Los puntos se inicializan en 0 y el estado en PENDING_REVIEW
    // No se calculan puntos aquí.
    const activity = await prisma.activity.create({
      data: {
        title,
        description,
        type: type as any, // Prisma generará el tipo enum correcto
        quantity,
        unit,
        points: 0, // Puntos iniciales en 0
        date: new Date(date),
        status: ActivityStatus.PENDING_REVIEW, // Estado inicial
        userId: session.id as string,
        groupId,
        evidence: {
          create: evidenceResults.map((e) => ({
            fileUrl: e.fileKey,
            fileType: e.determinedType,
            fileName: e.originalFileName,
            fileSize: e.fileSize,
            format: e.format,
          })),
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        group: true,
        evidence: true,
      },
    });

    // Transformar la respuesta para incluir URLs públicas de evidencia
    const activityWithPublicUrls = {
      ...activity,
      evidence:
        activity.evidence?.map((ev) => {
          const publicDisplayUrl = ev.fileUrl
            ? getPublicS3Url(ev.fileUrl)
            : null;
          if (!publicDisplayUrl && ev.fileUrl) {
            console.warn(
              `No se pudo construir la URL pública para la evidencia con fileKey: ${ev.fileUrl} en POST`
            );
          }
          return { ...ev, publicDisplayUrl: publicDisplayUrl };
        }) || [],
    };

    // NO se actualizan los puntos del usuario aquí
    // NO se verifica el nivel ni las insignias aquí, eso se hará cuando el ADMIN califique.

    return NextResponse.json(activityWithPublicUrls);
  } catch (error) {
    console.error("Error al crear actividad:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error desconocido al crear actividad";
    return NextResponse.json(
      { error: "Error al crear actividad: " + errorMessage },
      { status: 500 }
    );
  }
}
