import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

// Esquema de validación para crear/actualizar un centro de acopio
const centerSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(100),
  description: z.string().max(500).optional().nullable(),
  address: z.string().min(5, "La dirección es requerida.").max(200),
  city: z.string().min(1, "La ciudad es requerida.").max(100),
  state: z.string().min(1, "El estado es requerido.").max(100), // Validar contra lista de estados mexicanos sería ideal
  zipCode: z.string().max(10).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z
    .string()
    .email("Correo electrónico inválido.")
    .optional()
    .nullable()
    .or(z.literal("")), // Permite string vacío
  website: z
    .string()
    .url("URL de sitio web inválida.")
    .optional()
    .nullable()
    .or(z.literal("")),
  latitude: z.number().min(-90).max(90, "Latitud inválida."),
  longitude: z.number().min(-180).max(180, "Longitud inválida."),
  openingHours: z.string().max(200).optional().nullable(),
  socialMedia: z.string().max(255).optional().nullable(), // Campo simple para redes sociales
  materialIds: z
    .array(z.string())
    .min(1, "Debe seleccionar al menos un material."), // IDs de los materiales aceptados
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const materialCategory = searchParams.get("materialCategory"); // Cambiado de materialId a materialCategory
    const city = searchParams.get("city");
    const state = searchParams.get("state");
    const searchTerm = searchParams.get("search") || ""; // Para búsqueda por nombre/descripción
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {
      AND: [], // Usar AND para combinar condiciones
    };

    if (city) where.AND.push({ city: { contains: city, mode: "insensitive" } });
    if (state) where.AND.push({ state: { equals: state } }); // Búsqueda exacta para estado

    if (searchTerm) {
      where.OR = [
        // Buscar en nombre o descripción
        { name: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        { address: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    if (materialCategory && materialCategory !== "all") {
      where.AND.push({
        materials: {
          some: {
            material: {
              category: materialCategory,
            },
          },
        },
      });
    }

    // Si where.AND está vacío, quitarlo para no generar un filtro vacío
    if (where.AND.length === 0) delete where.AND;

    const centers = await prisma.recyclingCenter.findMany({
      where,
      include: {
        materials: {
          include: {
            material: true, // Incluir los detalles del material
          },
        },
      },
      orderBy: {
        name: "asc",
      },
      skip,
      take: limit,
    });

    const total = await prisma.recyclingCenter.count({ where });

    return NextResponse.json({
      centers: centers.map((center) => ({
        ...center,
        // Prisma devuelve Floats para lat/long, aseguramos que sean numbers
        latitude: Number(center.latitude),
        longitude: Number(center.longitude),
        materials: center.materials.map((cm) => cm.material), // Simplificar la estructura de materiales
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener centros de acopio:", error);
    return NextResponse.json(
      { error: "Error al obtener centros de acopio" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Validar datos con Zod
    const validationResult = centerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      website,
      latitude,
      longitude,
      openingHours,
      socialMedia,
      materialIds,
    } = validationResult.data;

    // Crear centro de acopio y conectar materiales
    const center = await prisma.recyclingCenter.create({
      data: {
        name,
        description: description || null,
        address,
        city,
        state,
        zipCode: zipCode || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        latitude, // Prisma espera Float, Zod valida number
        longitude, // Prisma espera Float, Zod valida number
        openingHours: openingHours || null,
        // socialMedia: socialMedia || null,
        materials: {
          create: materialIds.map((materialId: string) => ({
            material: {
              connect: { id: materialId },
            },
          })),
        },
      },
      include: {
        materials: { include: { material: true } },
      },
    });

    return NextResponse.json(center, { status: 201 });
  } catch (error) {
    console.error("Error al crear centro de acopio:", error);
    if (error instanceof z.ZodError) {
      // Capturar errores de Zod que no fueron por safeParse
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al crear centro de acopio" },
      { status: 500 }
    );
  }
}
