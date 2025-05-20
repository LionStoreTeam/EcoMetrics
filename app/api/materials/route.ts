// app/api/materials/route.ts
import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { seedMaterials } from "@/lib/materialDefinitions"; // Importar para asegurar que existan

export async function GET(request: NextRequest) {
  try {
    // Opcional: Verificar sesión si solo usuarios autenticados pueden ver esto,
    // pero para un formulario de admin, la página de admin ya debería estar protegida.
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Asegurar que los materiales base existan en la BD
    // En producción, esto se haría una vez o mediante un script de seed separado.
    await seedMaterials();

    const materials = await prisma.material.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json(materials);
  } catch (error) {
    console.error("Error al obtener materiales:", error);
    return NextResponse.json(
      { error: "Error al obtener materiales" },
      { status: 500 }
    );
  }
}
