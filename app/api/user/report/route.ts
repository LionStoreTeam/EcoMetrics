import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  Activity,
  Badge,
  Redemption,
  Reward,
  ActivityType,
} from "@prisma/client";
// 1. Importamos la interfaz StatsData que vamos a usar
import { StatsData } from "@/types/types";

// --- INICIO DE LA CORRECCIÓN ---

// 2. Simplificamos la interfaz del reporte. Ahora 'environmentalImpact' es de tipo 'StatsData'
export interface UserReportData {
  user: {
    name: string | null;
    email: string | null;
    totalPoints: number;
    level: number;
    memberSince: string;
    accountType: string;
  };
  activities: Activity[];
  environmentalImpact: StatsData; // <-- TIPO SIMPLIFICADO
  redeemedRewards: (Redemption & { reward: Reward })[];
  obtainedBadges: Badge[];
}

// --- FIN DE LA CORRECCIÓN ---

interface InternalMaterialDefinition {
  name: string;
  unit: string;
  co2SavedPerUnit: number;
  waterSavedPerUnit: number;
  energySavedPerUnit: number;
}

const internalMaterialDefinitions: Partial<
  Record<ActivityType, InternalMaterialDefinition>
> = {
  RECYCLING: {
    name: "Reciclaje",
    unit: "kg",
    co2SavedPerUnit: 1.5,
    waterSavedPerUnit: 20,
    energySavedPerUnit: 4,
  },
  TREE_PLANTING: {
    name: "Plantar Árboles",
    unit: "árboles",
    co2SavedPerUnit: 22,
    waterSavedPerUnit: 0,
    energySavedPerUnit: 0,
  },
  WATER_SAVING: {
    name: "Ahorro de Agua",
    unit: "litros",
    co2SavedPerUnit: 0.00034,
    waterSavedPerUnit: 1,
    energySavedPerUnit: 0.001,
  },
  COMPOSTING: {
    name: "Compostaje",
    unit: "kg",
    co2SavedPerUnit: 0.5,
    waterSavedPerUnit: 0,
    energySavedPerUnit: 0,
  },
  ENERGY_SAVING: {
    name: "Ahorro de Energía",
    unit: "kWh",
    co2SavedPerUnit: 0.4,
    waterSavedPerUnit: 0,
    energySavedPerUnit: 1,
  },
};

export async function GET() {
  const session = await getSession();
  if (!session?.id) {
    return new NextResponse(JSON.stringify({ message: "No autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session?.id;

  try {
    // ... (El código para obtener userData y userRedemptions no cambia)
    const userData = await prisma.user.findUnique({
      where: { id: userId as any },
      include: {
        activities: { orderBy: { date: "desc" } },
        profile: { include: { badges: true } },
      },
    });
    if (!userData) {
      return new NextResponse(
        JSON.stringify({ message: "Usuario no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const userRedemptions = await prisma.redemption.findMany({
      where: { userId: userId as any },
      include: { reward: true },
      orderBy: { redeemedAt: "desc" },
    });

    const reviewedActivities = userData.activities.filter(
      (activity) => activity.status === "REVIEWED"
    );
    let co2Saved = 0;
    let waterSaved = 0;
    let energySaved = 0;
    const materialsRecycledMap: {
      [key: string]: { quantity: number; unit: string };
    } = {};

    reviewedActivities.forEach((activity) => {
      const definition = internalMaterialDefinitions[activity.type];
      if (definition) {
        co2Saved += activity.quantity * definition.co2SavedPerUnit;
        waterSaved += activity.quantity * definition.waterSavedPerUnit;
        energySaved += activity.quantity * definition.energySavedPerUnit;
        if (!materialsRecycledMap[definition.name]) {
          materialsRecycledMap[definition.name] = {
            quantity: 0,
            unit: definition.unit,
          };
        }
        materialsRecycledMap[definition.name].quantity += activity.quantity;
      }
    });

    // --- INICIO DE LA CORRECCIÓN ---

    // 3. Construimos el objeto para que coincida con la estructura completa de 'StatsData'
    const environmentalImpactData: StatsData = {
      impact: {
        co2Saved,
        waterSaved,
        energySaved,
      },
      materialsRecycled: Object.entries(materialsRecycledMap).map(
        ([name, data]) => ({
          name,
          ...data,
        })
      ),
      // Añadimos los campos que requiere la interfaz StatsData aunque no se usen en el PDF
      totalPoints: reviewedActivities.reduce((sum, act) => sum + act.points, 0),
      activityCount: reviewedActivities.length,
      level: 0,
      activityStats: [],
      timeSeries: [],
      impactMetrics: {
        recycledMaterials: 0,
        treesPlanted: 0,
        waterSaved: 0,
        energySaved: 0,
      },
    };

    // --- FIN DE LA CORRECCIÓN ---

    const userProfile = {
      name: userData.name,
      email: userData.email,
      totalPoints: userData.points,
      level: userData.level,
      memberSince: userData.createdAt.toLocaleDateString("es-MX"),
      accountType: userData.role,
    };
    const obtainedBadges = userData.profile?.badges || [];

    const reportData: UserReportData = {
      user: userProfile,
      activities: userData.activities,
      environmentalImpact: environmentalImpactData, // Asignamos el objeto completo
      redeemedRewards: userRedemptions,
      obtainedBadges: obtainedBadges,
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Error al generar el reporte:", error);
    return new NextResponse(
      JSON.stringify({ message: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
