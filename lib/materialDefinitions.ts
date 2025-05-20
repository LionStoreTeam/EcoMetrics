// lib/materialDefinitions.ts
import prisma from "./prisma";

export interface MaterialDefinition {
  id: string; // Será el identificador único, ej: "PLASTIC_PET"
  name: string; // Nombre legible, ej: "Plástico PET"
  description?: string;
  category: MaterialCategory; // Usaremos un enum para categorías
}

export enum MaterialCategory {
  PLASTIC = "PLASTIC",
  PAPER = "PAPER",
  GLASS = "GLASS",
  METAL = "METAL",
  ORGANIC = "ORGANIC",
  ELECTRONIC = "ELECTRONIC",
  HAZARDOUS = "HAZARDOUS",
  OTHER = "OTHER",
}

export const ALL_MATERIALS: MaterialDefinition[] = [
  {
    id: "PET",
    name: "Plástico PET (Botellas)",
    category: MaterialCategory.PLASTIC,
  },
  {
    id: "HDPE",
    name: "Plástico HDPE (Envases)",
    category: MaterialCategory.PLASTIC,
  },
  { id: "CARDBOARD", name: "Cartón", category: MaterialCategory.PAPER },
  { id: "PAPER_MIXED", name: "Papel Mixto", category: MaterialCategory.PAPER },
  {
    id: "GLASS_BOTTLES",
    name: "Vidrio (Botellas, Frascos)",
    category: MaterialCategory.GLASS,
  },
  {
    id: "ALUMINUM_CANS",
    name: "Aluminio (Latas)",
    category: MaterialCategory.METAL,
  },
  {
    id: "STEEL_CANS",
    name: "Acero/Lata (Latas)",
    category: MaterialCategory.METAL,
  },
  {
    id: "ORGANIC_WASTE",
    name: "Residuos Orgánicos Compostables",
    category: MaterialCategory.ORGANIC,
  },
  {
    id: "ELECTRONICS_SMALL",
    name: "Electrónicos Pequeños",
    category: MaterialCategory.ELECTRONIC,
  },
  {
    id: "OTHER_MATERIALS",
    name: "Otros (Especificar)",
    category: MaterialCategory.OTHER,
  },
];

export async function seedMaterials() {
  console.log("Verificando e insertando materiales...");
  for (const materialDef of ALL_MATERIALS) {
    const existingMaterial = await prisma.material.findUnique({
      where: { id: materialDef.id },
    });

    if (!existingMaterial) {
      await prisma.material.create({
        data: {
          id: materialDef.id,
          name: materialDef.name,
          description: materialDef.description || null,
          category: materialDef.category,
        },
      });
      console.log(`Material "${materialDef.name}" creado.`);
    } else {
      // Opcional: Actualizar si la definición cambia
      if (
        existingMaterial.name !== materialDef.name ||
        existingMaterial.category !== materialDef.category
      ) {
        await prisma.material.update({
          where: { id: materialDef.id },
          data: {
            name: materialDef.name,
            description: materialDef.description || null,
            category: materialDef.category,
          },
        });
        console.log(`Material "${materialDef.name}" actualizado.`);
      }
    }
  }
  console.log("Verificación de materiales completada.");
}

// (Opcional) Llamar a seedMaterials() aquí para desarrollo,
// pero es mejor un script de seed separado para producción.
// seedMaterials().catch(console.error);
