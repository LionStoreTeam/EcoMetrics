// app/api/admin/activities/[activityId]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { deleteFileFromS3 } from "@/lib/s3-service";
import { ALL_BADGES } from "@/lib/badgeDefinitions"; // Asegúrate que la ruta sea correcta

const ACTIVITY_POINTS_MAP = {
  RECYCLING: 5,
  TREE_PLANTING: 5,
  WATER_SAVING: 2,
  ENERGY_SAVING: 2,
  COMPOSTING: 5,
  EDUCATION: 5,
  OTHER: 2,
};

// Esquema para la actualización de actividad por un admin
const adminUpdateActivitySchema = z.object({
  title: z
    .string()
    .min(10, "El título debe tener al menos 10 caracteres.")
    .max(100, "El título no puede exceder los 30 caracteres.")
    .optional(),
  description: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres.")
    .max(100, "La descripción no puede exceder los 100 caracteres.")
    .optional()
    .nullable(),
  type: z
    .enum([
      "RECYCLING",
      "TREE_PLANTING",
      "WATER_SAVING",
      "ENERGY_SAVING",
      "COMPOSTING",
      "EDUCATION",
      "OTHER",
    ])
    .optional(),
  quantity: z
    .number()
    .positive("La cantidad debe ser positiva.")
    .min(1, "La cantidad mínima es 1.")
    .max(20, "La cantidad máxima es 20.")
    .optional(),
  unit: z.string().min(1, "La unidad es requerida.").optional(),
  date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), { message: "Fecha inválida" })
    .optional(),
  // IDs de las evidencias a eliminar
  evidencesToDelete: z.array(z.string()).optional(),
});

// --- COPIADO DE activities/route.ts (o mover a un helper) ---
async function checkAndAwardBadges(
  userId: string,
  tx: PrismaTransactionClient
) {
  // tx es el cliente de transacción de Prisma
  try {
    const user = await tx.user.findUnique({
      // Usar tx para consistencia dentro de la transacción
      where: { id: userId },
      include: {
        profile: { include: { badges: true } },
        activities: { select: { type: true, quantity: true } },
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
          if (user._count.activities >= badgeDef.criteriaThreshold)
            criteriaMet = true;
          break;
        case "USER_LEVEL":
          if (user.level >= badgeDef.criteriaThreshold) criteriaMet = true;
          break;
        case "TOTAL_POINTS":
          if (user.points >= badgeDef.criteriaThreshold) criteriaMet = true;
          break;
        case "SPECIFIC_ACTIVITY_TYPE_COUNT":
          if (badgeDef.criteriaActivityType) {
            const relevantActivities = user.activities.filter(
              (act) => act.type === badgeDef.criteriaActivityType
            );
            const totalQuantity = relevantActivities.reduce(
              (sum, act) => sum + act.quantity,
              0
            );
            if (totalQuantity >= badgeDef.criteriaThreshold) criteriaMet = true;
          }
          break;
      }
      if (criteriaMet) badgesToAward.push(badgeDef.id);
    }

    if (badgesToAward.length > 0) {
      await tx.profile.update({
        // Usar tx
        where: { userId: userId },
        data: {
          badges: { connect: badgesToAward.map((id) => ({ id })) },
        },
      });
      console.log(
        `Usuario ${userId} ha obtenido las insignias: ${badgesToAward.join(
          ", "
        )} (dentro de transacción)`
      );
    }
  } catch (error) {
    console.error(
      `Error al verificar/otorgar insignias para el usuario ${userId} (dentro de transacción):`,
      error
    );
    // No relanzar el error para no romper la transacción principal si esto falla,
    // pero sí loguearlo extensamente.
  }
}
// Necesitarás importar PrismaTransactionClient si no está globalmente disponible
type PrismaTransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];
// --- FIN LÓGICA DE INSIGNIAS ---

export async function PUT(
  request: NextRequest,
  { params }: { params: { activityId: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { activityId } = await params;
    if (!activityId) {
      return NextResponse.json(
        { error: "ID de actividad requerido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = adminUpdateActivitySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const dataFromClient = validationResult.data;

    // Obtener actividad actual para puntos originales y userId
    const activityToUpdate = await prisma.activity.findUnique({
      where: { id: activityId },
      select: {
        points: true,
        userId: true,
        type: true,
        quantity: true,
        evidence: true,
      },
    });

    if (!activityToUpdate) {
      return NextResponse.json(
        { error: "Actividad no encontrada" },
        { status: 404 }
      );
    }
    const originalPoints = activityToUpdate.points;
    const userIdOfActivity = activityToUpdate.userId;

    const dataForPrismaUpdate: any = {};

    // Construir el objeto de actualización solo con los campos presentes
    if (dataFromClient.title !== undefined)
      dataForPrismaUpdate.title = dataFromClient.title;
    if (dataFromClient.description !== undefined)
      dataForPrismaUpdate.description =
        dataFromClient.description === "" ? null : dataFromClient.description; // Permitir null para descripción
    if (dataFromClient.type !== undefined)
      dataForPrismaUpdate.type = dataFromClient.type;
    if (dataFromClient.quantity !== undefined)
      dataForPrismaUpdate.quantity = dataFromClient.quantity;
    if (dataFromClient.unit !== undefined)
      dataForPrismaUpdate.unit = dataFromClient.unit;
    if (dataFromClient.date !== undefined)
      dataForPrismaUpdate.date = new Date(dataFromClient.date);

    let newActivityPoints = activityToUpdate.points; // Inicia con los puntos actuales de la actividad

    // Recalcular puntos de la actividad si type o quantity cambian
    if (dataFromClient.type || dataFromClient.quantity) {
      const typeForCalc = dataFromClient.type || activityToUpdate.type;
      const quantityForCalc =
        dataFromClient.quantity || activityToUpdate.quantity;
      const pointsPerUnit =
        ACTIVITY_POINTS_MAP[typeForCalc as keyof typeof ACTIVITY_POINTS_MAP] ||
        ACTIVITY_POINTS_MAP.OTHER;
      newActivityPoints = Math.floor(quantityForCalc * pointsPerUnit);
      dataForPrismaUpdate.points = newActivityPoints;
    }

    // Iniciar transacción
    const [updatedActivity] = await prisma.$transaction(async (tx) => {
      // 1. Eliminar evidencias seleccionadas (si las hay)
      if (
        dataFromClient.evidencesToDelete &&
        dataFromClient.evidencesToDelete.length > 0
      ) {
        const evidencesInActivity = activityToUpdate.evidence.filter((ev) =>
          dataFromClient.evidencesToDelete!.includes(ev.id)
        );
        for (const ev of evidencesInActivity) {
          if (ev.fileUrl) {
            // fileUrl es la fileKey
            await deleteFileFromS3(ev.fileUrl);
          }
        }
        await tx.evidence.deleteMany({
          where: {
            id: { in: dataFromClient.evidencesToDelete },
            activityId: activityId, // Doble seguridad
          },
        });
      }

      // 2. Actualizar la actividad
      const activityAfterDbUpdate = await tx.activity.update({
        where: { id: activityId },
        data: dataForPrismaUpdate,
        include: {
          user: {
            select: { id: true, name: true, email: true, userType: true },
          },
          evidence: true, // Devolver evidencias actualizadas
        },
      });

      // 3. Calcular diferencia de puntos y actualizar usuario
      const pointsDifference = newActivityPoints - originalPoints;

      if (pointsDifference !== 0) {
        const user = await tx.user.findUnique({
          where: { id: userIdOfActivity },
        });
        if (user) {
          const newTotalPoints = user.points + pointsDifference;
          const newLevel = Math.floor(Math.max(0, newTotalPoints) / 500) + 1;
          await tx.user.update({
            where: { id: userIdOfActivity },
            data: {
              points: Math.max(0, newTotalPoints),
              level: newLevel,
            },
          });
        }
      }

      // 4. Verificar y otorgar insignias
      await checkAndAwardBadges(userIdOfActivity, tx);

      return [activityAfterDbUpdate];
    });

    return NextResponse.json(updatedActivity);
  } catch (error) {
    console.error("Error al actualizar actividad por admin:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos de entrada inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error interno del servidor al actualizar actividad." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { activityId: string } }
) {
  // ... (La lógica DELETE que ya tenías es correcta para descontar puntos)
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { activityId } = params;
    if (!activityId) {
      return NextResponse.json(
        { error: "ID de actividad requerido" },
        { status: 400 }
      );
    }

    const activityToDelete = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { evidence: true },
    });

    if (!activityToDelete) {
      return NextResponse.json(
        { error: "Actividad no encontrada" },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      if (activityToDelete.evidence && activityToDelete.evidence.length > 0) {
        for (const ev of activityToDelete.evidence) {
          if (ev.fileUrl) {
            await deleteFileFromS3(ev.fileUrl);
          }
        }
      }
      await tx.activity.delete({
        where: { id: activityId },
      });

      const user = await tx.user.findUnique({
        where: { id: activityToDelete.userId },
      });
      if (user) {
        const newPoints = Math.max(0, user.points - activityToDelete.points);
        const newLevel = Math.floor(newPoints / 500) + 1;

        await tx.user.update({
          where: { id: activityToDelete.userId },
          data: {
            points: newPoints,
            level: newLevel,
          },
        });
        // Verificar insignias después de la eliminación y ajuste de puntos/nivel
        await checkAndAwardBadges(activityToDelete.userId, tx);
      }
      return {
        message: "Actividad eliminada y puntos del usuario actualizados.",
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error al eliminar actividad por admin:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al eliminar actividad." },
      { status: 500 }
    );
  }
}
