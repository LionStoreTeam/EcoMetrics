// lib/badgeDefinitions.ts
import prisma from "./prisma"; //

export interface BadgeDefinition {
  id: string; // Será el identificador único, ej: "FIRST_ACTIVITY_BADGE"
  name: string;
  description: string;
  imageUrl: string; // Actualizado para rutas locales
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
    imageUrl: "/badges/eco-iniciado.png", // Ruta actualizada
    criteriaType: "ACTIVITY_COUNT",
    criteriaThreshold: 1,
  },
  {
    id: "RECYCLER_BRONZE_BADGE",
    name: "Reciclador Bronce",
    description: "Has reciclado 10 kg de materiales. ¡Buen trabajo!",
    imageUrl: "/badges/bronce.png", // Ruta actualizada
    criteriaType: "SPECIFIC_ACTIVITY_TYPE_COUNT",
    criteriaActivityType: "RECYCLING",
    criteriaThreshold: 10,
  },
  {
    id: "LEVEL_5_REACHED_BADGE",
    name: "Nivel 5 Alcanzado",
    description: "¡Has alcanzado el Nivel 5! Tu compromiso es inspirador.",
    imageUrl: "/badges/level5.png", // Ruta actualizada
    criteriaType: "USER_LEVEL",
    criteriaThreshold: 5,
  },
  {
    id: "TREE_PLANTER_BADGE",
    name: "Sembrador de Vida",
    description: "Has plantado 5 árboles. ¡Gracias por oxigenar el planeta!",
    imageUrl: "/badges/sembrador.png", // Ruta actualizada
    criteriaType: "SPECIFIC_ACTIVITY_TYPE_COUNT",
    criteriaActivityType: "TREE_PLANTING",
    criteriaThreshold: 5,
  },
  {
    id: "POINTS_MASTER_100_BADGE",
    name: "Maestro de Puntos (100)",
    description: "Has acumulado 100 eco-puntos. ¡Excelente!",
    imageUrl: "/badges/100.png", // Ruta actualizada
    criteriaType: "TOTAL_POINTS",
    criteriaThreshold: 100,
  },
  // Puedes añadir más insignias aquí siguiendo el mismo patrón para imageUrl
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
          imageUrl: badgeDef.imageUrl, // Se guarda la nueva ruta
          criteria: `${badgeDef.criteriaType}:${badgeDef.criteriaThreshold}${
            badgeDef.criteriaActivityType
              ? `:${badgeDef.criteriaActivityType}`
              : ""
          }`,
        },
      });
      console.log(
        `Insignia "${badgeDef.name}" creada con imagen ${badgeDef.imageUrl}.`
      );
    } else {
      // Opcional: Actualizar si la definición (ej. imageUrl) cambia
      if (
        existingBadge.name !== badgeDef.name ||
        existingBadge.description !== badgeDef.description ||
        existingBadge.imageUrl !== badgeDef.imageUrl
        // Puedes añadir más campos a verificar si es necesario
      ) {
        await prisma.badge.update({
          where: { id: badgeDef.id },
          data: {
            name: badgeDef.name,
            description: badgeDef.description,
            imageUrl: badgeDef.imageUrl,
            criteria: `${badgeDef.criteriaType}:${badgeDef.criteriaThreshold}${
              badgeDef.criteriaActivityType
                ? `:${badgeDef.criteriaActivityType}`
                : ""
            }`,
          },
        });
        console.log(
          `Insignia "${badgeDef.name}" actualizada con imagen ${badgeDef.imageUrl}.`
        );
      }
    }
  }
  console.log("Verificación de insignias completada.");
}
