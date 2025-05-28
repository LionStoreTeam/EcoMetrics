// app/api/product-promotions/submit/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; //
import { z } from "zod";
import {
  uploadAvatarToS3, // Para el logo del negocio
  uploadFileEvidenceToS3, // Para las imágenes de producto
  validateAvatarFile, // Para el logo
  validateFile, // Para las imágenes de producto (reutilizando la validación general)
} from "@/lib/s3-service"; //
import Stripe from "stripe";
import { MAX_FILES } from "@/types/types-s3-service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-04-30.basil",
});

// Esquema de validación para los datos del formulario de promoción de producto
const promoteProductSchema = z.object({
  businessName: z.string().min(3).max(100),
  productName: z.string().min(3).max(100),
  description: z.string().min(20).max(1000),
  businessType: z.string().min(1),
  priceOrPromotion: z.string().min(3).max(200),
  address: z.string().min(5).max(200),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  validUntil: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Fecha de 'Válido hasta' inválida",
    }),
  zipCode: z.string().max(10).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  latitude: z
    .string()
    .refine((val) => !val || !isNaN(parseFloat(val)), "Latitud inválida.")
    .optional()
    .nullable(),
  longitude: z
    .string()
    .refine((val) => !val || !isNaN(parseFloat(val)), "Longitud inválida.")
    .optional()
    .nullable(),
  openingHours: z.string().max(200).optional().nullable(),
  contactEmail: z
    .string()
    .email("Correo electrónico de contacto inválido.")
    .optional()
    .nullable()
    .or(z.literal("")),
  website: z
    .string()
    .url("URL de sitio web inválida.")
    .optional()
    .nullable()
    .or(z.literal("")),
  socialMediaLinks: z.string().max(500).optional().nullable(),
  paymentIntentId: z.string().min(1, "ID de intención de pago requerido."),
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const formValues: Record<string, any> = {};
    formData.forEach((value, key) => {
      // No incluir archivos en los valores para Zod directamente
      if (key !== "businessLogoFile" && !key.startsWith("productImageFile_")) {
        formValues[key] = value;
      }
    });
    // Convertir strings vacíos a null para campos opcionales antes de la validación
    for (const key of [
      "zipCode",
      "phone",
      "contactEmail",
      "website",
      "latitude",
      "longitude",
      "openingHours",
      "socialMediaLinks",
      "validUntil",
    ]) {
      if (formValues[key] === "") {
        formValues[key] = null;
      }
    }

    const validationResult = promoteProductSchema.safeParse(formValues);
    if (!validationResult.success) {
      console.error(
        "Errores de validación del formulario:",
        validationResult.error.flatten().fieldErrors
      );
      return NextResponse.json(
        {
          error: "Datos del formulario de producto inválidos.",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      businessName,
      productName,
      description,
      businessType,
      priceOrPromotion,
      address,
      city,
      state,
      validUntil,
      zipCode,
      phone,
      latitude,
      longitude,
      openingHours,
      contactEmail,
      website,
      socialMediaLinks,
      paymentIntentId,
    } = validationResult.data;

    const businessLogoFile = formData.get("businessLogoFile") as File | null;
    const productImagesFiles: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("productImageFile_") && value instanceof File) {
        productImagesFiles.push(value);
      }
    }

    // 1. Verificar el estado del PaymentIntent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        {
          error: "El pago del producto no ha sido completado o ha fallado.",
          paymentStatus: paymentIntent.status,
        },
        { status: 402 }
      );
    }

    // 2. Subir logo del negocio a S3 si existe
    let businessLogoS3Key: string | undefined = undefined;
    if (businessLogoFile) {
      const logoValidation = validateAvatarFile(businessLogoFile); //
      if (!logoValidation.valid) {
        return NextResponse.json(
          {
            error:
              logoValidation.error || "Archivo de logo de negocio inválido.",
          },
          { status: 400 }
        );
      }
      const logoS3Response = await uploadAvatarToS3(
        businessLogoFile,
        "business-logos/"
      ); //
      businessLogoS3Key = logoS3Response.fileKey;
    }

    // 3. Subir imágenes del producto a S3
    if (
      productImagesFiles.length < 1 ||
      productImagesFiles.length > MAX_FILES
    ) {
      return NextResponse.json(
        {
          error: `Debes subir entre 1 y ${MAX_FILES} imágenes para el producto.`,
        },
        { status: 400 }
      );
    }

    const productImagesS3Keys: string[] = [];
    for (const file of productImagesFiles) {
      const fileValidation = validateFile(file); // Usar validación general para imágenes de producto
      if (!fileValidation.valid) {
        return NextResponse.json(
          {
            error:
              fileValidation.error ||
              `Archivo de producto inválido: ${file.name}`,
          },
          { status: 400 }
        );
      }
      // Usar un prefijo diferente para las imágenes de producto
      const s3Response = await uploadFileEvidenceToS3(
        file,
        "product-promotion-images/"
      ); //
      productImagesS3Keys.push(s3Response.fileKey);
    }

    // 4. Guardar la solicitud en la base de datos
    const promotionRequest = await prisma.productPromotionRequest.create({
      data: {
        businessName,
        productName,
        businessLogoUrl: businessLogoS3Key,
        description,
        businessType,
        priceOrPromotion,
        address,
        city,
        state,
        validUntil: validUntil ? new Date(validUntil) : null,
        zipCode: zipCode || null,
        phone: phone || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        openingHours: openingHours || null,
        contactEmail: contactEmail || null,
        website: website || null,
        socialMediaLinks: socialMediaLinks || null,
        paymentIntentId,
        paymentStatus: paymentIntent.status,
        amountPaid: paymentIntent.amount_received / 100,
        currency: paymentIntent.currency,
        status: "PENDING_APPROVAL",
        productImages: {
          // Crear las imágenes relacionadas
          create: productImagesS3Keys.map((s3Key) => ({
            url: s3Key,
          })),
        },
      },
      include: {
        productImages: true, // Incluir las imágenes creadas en la respuesta
      },
    });

    return NextResponse.json(
      {
        message:
          "Solicitud de promoción de producto enviada con éxito. Será revisada pronto.",
        requestId: promotionRequest.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Error al procesar la solicitud de promoción de producto:",
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Datos inválidos para la promoción del producto.",
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: `Error al procesar la solicitud de producto: ${errorMessage}` },
      { status: 500 }
    );
  }
}
