// app/api/promote-business/submit/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import {
  uploadAvatarToS3, // Reutilizaremos esta función para el logo, ajustando el prefijo
  validateAvatarFile, // Reutilizaremos la validación de avatar para el logo
} from "@/lib/s3-service"; //
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-04-30.basil",
});

// Esquema de validación para los datos del formulario de promoción
// (debería coincidir con el esquema del frontend)
const promoteBusinessSchema = z.object({
  businessName: z
    .string()
    .min(3, "El nombre del negocio es demasiado corto.")
    .max(100),
  description: z
    .string()
    .min(20, "La descripción es demasiado corta.")
    .max(1000, "La descripción es demasiado larga."),
  businessType: z.string().min(1, "Debes seleccionar un tipo de negocio."),
  address: z.string().min(5, "La dirección es requerida.").max(200),
  city: z.string().min(1, "La ciudad es requerida.").max(100),
  state: z.string().min(1, "El estado es requerido.").max(100),
  zipCode: z.string().max(10).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z
    .string()
    .email("Correo electrónico inválido.")
    .optional()
    .nullable()
    .or(z.literal("")),
  website: z
    .string()
    .url("URL de sitio web inválida.")
    .optional()
    .nullable()
    .or(z.literal("")),
  latitude: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), "Latitud inválida.")
    .optional()
    .nullable(),
  longitude: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), "Longitud inválida.")
    .optional()
    .nullable(),
  openingHours: z.string().max(200).optional().nullable(),
  socialMedia: z.string().max(255).optional().nullable(),
  paymentIntentId: z.string().min(1, "ID de intención de pago requerido."),
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const formValues: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (key !== "logoFile") {
        // No incluir el archivo en los valores para Zod directamente
        formValues[key] = value;
      }
    });

    // Validar datos del formulario (sin el archivo)
    const validationResult = promoteBusinessSchema.safeParse(formValues);
    if (!validationResult.success) {
      console.error(
        "Validation errors:",
        validationResult.error.flatten().fieldErrors
      );
      return NextResponse.json(
        {
          error: "Datos del formulario inválidos.",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      businessName,
      description,
      businessType,
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
      paymentIntentId,
    } = validationResult.data;

    const logoFile = formData.get("logoFile") as File | null;
    let logoUrl: string | undefined = undefined;

    // 1. Verificar el estado del PaymentIntent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        {
          error: "El pago no ha sido completado o ha fallado.",
          paymentStatus: paymentIntent.status,
        },
        { status: 402 } // Payment Required
      );
    }

    // 2. Subir el logo a S3 si existe
    if (logoFile) {
      const validation = validateAvatarFile(logoFile); // Reutilizamos validación de avatar
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error || "Archivo de logo inválido." },
          { status: 400 }
        );
      }
      // Usar un prefijo diferente para los logos de negocios
      const s3Response = await uploadAvatarToS3(logoFile, "business-logos/"); //
      logoUrl = s3Response.fileKey;
    } else {
      // Considerar si el logo es obligatorio. Por ahora, lo haremos opcional.
      // Si fuera obligatorio, devolver un error 400 aquí.
    }

    // 3. Guardar la solicitud en la base de datos
    const promotionRequest = await prisma.businessPromotionRequest.create({
      data: {
        businessName,
        logoUrl,
        description,
        businessType,
        address,
        city,
        state,
        zipCode: zipCode || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        openingHours: openingHours || null,
        socialMedia: socialMedia || null,
        paymentIntentId,
        paymentStatus: paymentIntent.status,
        amountPaid: paymentIntent.amount_received / 100, // Convertir centavos a MXN
        currency: paymentIntent.currency,
        status: "PENDING_APPROVAL", // Estado inicial
      },
    });

    return NextResponse.json(
      {
        message:
          "Solicitud de promoción enviada con éxito. Será revisada pronto.",
        requestId: promotionRequest.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al procesar la solicitud de promoción:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos.", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: `Error al procesar la solicitud: ${errorMessage}` },
      { status: 500 }
    );
  }
}
