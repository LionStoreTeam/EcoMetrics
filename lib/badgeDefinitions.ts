// lib/badgeDefinitions.ts
import prisma from "./prisma";

export interface BadgeDefinition {
  id: string; // Será el identificador único, ej: "FIRST_ACTIVITY_BADGE"
  name: string;
  description: string;
  imageUrl: string;
  criteriaType:
    | "ACTIVITY_COUNT"
    | "SPECIFIC_ACTIVITY_TYPE_COUNT"
    | "USER_LEVEL"
    | "TOTAL_POINTS"; // Tipos de criterios
  criteriaThreshold: number; // Valor numérico para el criterio (ej: 1 actividad, nivel 5, 100 puntos)
  criteriaActivityType?: string; // Opcional, para "SPECIFIC_ACTIVITY_TYPE_COUNT" (ej: "RECYCLING")
}

// Lista de todas las insignias que existirán en el sistema
export const ALL_BADGES: BadgeDefinition[] = [
  {
    id: "FIRST_ACTIVITY_BADGE",
    name: "Eco-Iniciado",
    description: "Registraste tu primera actividad ecológica. ¡Sigue así!",
    imageUrl: "https://placehold.co/128x128/A8D895/333333?text=EI", // Verde claro
    criteriaType: "ACTIVITY_COUNT",
    criteriaThreshold: 1,
  },
  {
    id: "RECYCLER_BRONZE_BADGE",
    name: "Reciclador Bronce",
    description: "Has reciclado 10 kg de materiales. ¡Buen trabajo!",
    imageUrl: "https://placehold.co/128x128/CD7F32/FFFFFF?text=RB", // Bronce
    criteriaType: "SPECIFIC_ACTIVITY_TYPE_COUNT",
    criteriaActivityType: "RECYCLING", // Coincide con el 'type' en el modelo Activity
    criteriaThreshold: 10, // Suma de 'quantity' para actividades de tipo RECYCLING
  },
  {
    id: "LEVEL_5_REACHED_BADGE",
    name: "Nivel 5 Alcanzado",
    description: "¡Has alcanzado el Nivel 5! Tu compromiso es inspirador.",
    imageUrl: "https://placehold.co/128x128/FFD700/333333?text=N5", // Oro
    criteriaType: "USER_LEVEL",
    criteriaThreshold: 5,
  },
  {
    id: "TREE_PLANTER_BADGE",
    name: "Sembrador de Vida",
    description: "Has plantado 5 árboles. ¡Gracias por oxigenar el planeta!",
    imageUrl: "https://placehold.co/128x128/228B22/FFFFFF?text=SV", // Verde bosque
    criteriaType: "SPECIFIC_ACTIVITY_TYPE_COUNT",
    criteriaActivityType: "TREE_PLANTING",
    criteriaThreshold: 5, // Suma de 'quantity' para actividades de tipo TREE_PLANTING
  },
  {
    id: "POINTS_MASTER_100_BADGE",
    name: "Maestro de Puntos (100)",
    description: "Has acumulado 100 eco-puntos. ¡Excelente!",
    imageUrl: "https://placehold.co/128x128/8A2BE2/FFFFFF?text=P100", // Azul violeta
    criteriaType: "TOTAL_POINTS",
    criteriaThreshold: 100,
  },
  // Puedes añadir más insignias aquí
];

// Función para asegurar que las insignias existan en la BD (se puede llamar al iniciar la app o en un script de seed)
export async function seedBadges() {
  console.log("Verificando e insertando insignias...");
  for (const badgeDef of ALL_BADGES) {
    const existingBadge = await prisma.badge.findUnique({
      where: { id: badgeDef.id },
    });

    if (!existingBadge) {
      await prisma.badge.create({
        data: {
          id: badgeDef.id,
          name: badgeDef.name,
          description: badgeDef.description,
          imageUrl: badgeDef.imageUrl,
          criteria: `${badgeDef.criteriaType}:${badgeDef.criteriaThreshold}${
            badgeDef.criteriaActivityType
              ? `:${badgeDef.criteriaActivityType}`
              : ""
          }`, // Guardar criterio como string
        },
      });
      console.log(`Insignia "${badgeDef.name}" creada.`);
    }
  }
  console.log("Verificación de insignias completada.");
}

// (Opcional) Llama a seedBadges() aquí si quieres que se ejecute al importar el módulo,
// aunque es mejor llamarlo explícitamente en un punto de inicio de tu aplicación si es necesario.
// seedBadges().catch(console.error);
