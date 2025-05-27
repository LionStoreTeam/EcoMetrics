// lionstoreteam/ecometrics/EcoMetrics-9cdd9112192325b6fafd06b5945494aa18f69ba4/app/api/admin/activities/[activityId]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { deleteFileFromS3 } from "@/lib/s3-service";
import { ALL_BADGES } from "@/lib/badgeDefinitions";
import { ActivityStatus } from "@prisma/client";

type PrismaTransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

async function checkAndAwardBadges(
  userId: string,
  tx: PrismaTransactionClient
) {
  try {
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: {
        profile: { include: { badges: true } },
        activities: {
          select: { type: true, quantity: true, status: true, points: true },
        }, // Incluir points para la lógica de insignias
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
          const reviewedActivitiesCount = user.activities.filter(
            (act) => act.status === ActivityStatus.REVIEWED
          ).length;
          if (reviewedActivitiesCount >= badgeDef.criteriaThreshold) {
            criteriaMet = true;
          }
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
              (act) =>
                act.type === badgeDef.criteriaActivityType &&
                act.status === ActivityStatus.REVIEWED
            );
            // Sumar los puntos otorgados de las actividades relevantes en lugar de la cantidad, si el umbral es en puntos
            // O sumar la cantidad si el umbral es en cantidad. Asumimos que es cantidad por ahora.
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
      if (criteriaMet) badgesToAward.push(badgeDef.id);
    }

    if (badgesToAward.length > 0) {
      await tx.profile.update({
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
  }
}

const adminUpdateOrQualifyActivitySchema = z.object({
  title: z.string().min(10).max(100).optional(),
  description: z.string().min(10).max(100).optional().nullable(),
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
  quantity: z.number().positive().min(1).max(20).optional(),
  unit: z.string().min(1).optional(),
  date: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), { message: "Fecha inválida" })
    .optional(),
  awardedPoints: z.enum(["10", "30", "50", "75", "100"]).optional(),
  evidencesToDelete: z.array(z.string()).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { activityId: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { activityId } = params;
    const body = await request.json();
    const validationResult = adminUpdateOrQualifyActivitySchema.safeParse(body);

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

    const activityToUpdate = await prisma.activity.findUnique({
      where: { id: activityId },
      select: {
        points: true,
        userId: true,
        title: true,
        status: true,
        evidence: true,
      },
    });

    if (!activityToUpdate) {
      return NextResponse.json(
        { error: "Actividad no encontrada" },
        { status: 404 }
      );
    }

    const dataForPrismaUpdate: any = {};
    let pointsToAwardThisTime = activityToUpdate.points; // Por defecto, los puntos que ya tenía
    let isQualificationOrRequalification = false;
    let notificationMessageContent = "";

    // Lógica de Calificación o Recalificación
    if (dataFromClient.awardedPoints !== undefined) {
      isQualificationOrRequalification = true;
      pointsToAwardThisTime = parseInt(dataFromClient.awardedPoints, 10);
      dataForPrismaUpdate.points = pointsToAwardThisTime;
      dataForPrismaUpdate.status = ActivityStatus.REVIEWED;
      notificationMessageContent = `Tu actividad "${
        activityToUpdate.title
      }" ha sido ${
        activityToUpdate.status === ActivityStatus.PENDING_REVIEW
          ? "calificada"
          : "recalificada"
      } y has obtenido ${pointsToAwardThisTime} puntos.`;
    }

    // Lógica de Edición de otros campos (puede ocurrir junto con recalificación o de forma independiente)
    if (dataFromClient.title !== undefined)
      dataForPrismaUpdate.title = dataFromClient.title;
    if (dataFromClient.description !== undefined)
      dataForPrismaUpdate.description =
        dataFromClient.description === "" ? null : dataFromClient.description;
    if (dataFromClient.type !== undefined)
      dataForPrismaUpdate.type = dataFromClient.type;
    if (dataFromClient.quantity !== undefined)
      dataForPrismaUpdate.quantity = dataFromClient.quantity;
    if (dataFromClient.unit !== undefined)
      dataForPrismaUpdate.unit = dataFromClient.unit;
    if (dataFromClient.date !== undefined)
      dataForPrismaUpdate.date = new Date(dataFromClient.date);

    const [updatedActivity] = await prisma.$transaction(async (tx) => {
      if (
        dataFromClient.evidencesToDelete &&
        dataFromClient.evidencesToDelete.length > 0
      ) {
        const evidencesInActivity = activityToUpdate.evidence.filter((ev) =>
          dataFromClient.evidencesToDelete!.includes(ev.id)
        );
        for (const ev of evidencesInActivity) {
          if (ev.fileUrl) await deleteFileFromS3(ev.fileUrl);
        }
        await tx.evidence.deleteMany({
          where: {
            id: { in: dataFromClient.evidencesToDelete },
            activityId: activityId,
          },
        });
      }

      const activityAfterDbUpdate = await tx.activity.update({
        where: { id: activityId },
        data: dataForPrismaUpdate,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              userType: true,
              points: true,
              level: true,
            },
          },
          evidence: true,
        },
      });

      // Ajustar puntos del usuario si hubo una calificación/recalificación
      if (isQualificationOrRequalification) {
        const pointsDifferenceForUser =
          pointsToAwardThisTime - activityToUpdate.points; // Diferencia con los puntos ANTERIORES de la actividad

        if (activityAfterDbUpdate.user) {
          // No es necesario pointsDifferenceForUser !== 0 porque incluso si los puntos son los mismos, el estado podría haber cambiado.
          const currentTotalUserPoints = activityAfterDbUpdate.user.points;
          const newTotalUserPoints = Math.max(
            0,
            currentTotalUserPoints + pointsDifferenceForUser
          );
          const newLevel = Math.floor(newTotalUserPoints / 500) + 1;

          await tx.user.update({
            where: { id: activityAfterDbUpdate.userId },
            data: { points: newTotalUserPoints, level: newLevel },
          });

          // Crear notificación para el usuario
          await tx.notification.create({
            data: {
              userId: activityAfterDbUpdate.userId,
              title: `Actividad ${
                activityToUpdate.status === ActivityStatus.PENDING_REVIEW
                  ? "Calificada"
                  : "Recalificada"
              }: ${activityAfterDbUpdate.title}`,
              message: notificationMessageContent,
            },
          });
        }
        await checkAndAwardBadges(activityAfterDbUpdate.userId, tx);
      }
      return [activityAfterDbUpdate];
    });

    return NextResponse.json(updatedActivity);
  } catch (error) {
    console.error("Error al actualizar/calificar actividad por admin:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos de entrada inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: "Error interno del servidor al actualizar/calificar actividad.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { activityId: string } }
) {
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
      include: { evidence: true, user: { select: { id: true, name: true } } }, // Incluir user para notificación
    });

    if (!activityToDelete) {
      return NextResponse.json(
        { error: "Actividad no encontrada" },
        { status: 404 }
      );
    }

    const pointsToDecrement = activityToDelete.points; // Puntos que tenía otorgados la actividad

    const result = await prisma.$transaction(async (tx) => {
      if (activityToDelete.evidence && activityToDelete.evidence.length > 0) {
        for (const ev of activityToDelete.evidence) {
          if (ev.fileUrl) await deleteFileFromS3(ev.fileUrl);
        }
      }
      await tx.activity.delete({ where: { id: activityId } });

      if (pointsToDecrement > 0) {
        // Solo ajustar si la actividad había otorgado puntos
        const user = await tx.user.findUnique({
          where: { id: activityToDelete.userId },
        });
        if (user) {
          const newPoints = Math.max(0, user.points - pointsToDecrement);
          const newLevel = Math.floor(newPoints / 500) + 1;
          await tx.user.update({
            where: { id: activityToDelete.userId },
            data: { points: newPoints, level: newLevel },
          });
          await checkAndAwardBadges(activityToDelete.userId, tx);
        }
      }

      // Enviar notificación de eliminación
      await tx.notification.create({
        data: {
          userId: activityToDelete.userId,
          title: `Actividad Eliminada: ${activityToDelete.title}`,
          message: `Tu actividad "${activityToDelete.title}" ha sido eliminada por un administrador. Si tenías puntos asignados por esta actividad, han sido ajustados. Si tienes dudas puedes comunicarte con los administradores al correo ecosoporte@ecometricsmx.com`,
        },
      });

      return {
        message:
          "Actividad eliminada, puntos del usuario actualizados y notificación enviada.",
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
