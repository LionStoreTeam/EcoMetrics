import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  uploadAvatarToS3,
  deleteFileFromS3,
  validateAvatarFile,
} from "@/lib/s3-service";

// Helper para construir la URL pública de S3
const getPublicS3Url = (fileKey: string): string | null => {
  const bucketName = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  if (bucketName && region && fileKey) {
    return `https://${bucketName}.s3.${region}.amazonaws.com/${fileKey}`;
  }
  return null;
};

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id as string },
      include: {
        profile: {
          include: {
            badges: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    let publicAvatarDisplayUrl: string | null = null;
    if (user.profile?.avatarUrl) {
      // avatarUrl es la fileKey
      publicAvatarDisplayUrl = getPublicS3Url(user.profile.avatarUrl);
      if (!publicAvatarDisplayUrl) {
        console.warn(
          "No se pudieron construir las URLs públicas de S3 para el avatar del perfil. Verifica las variables de entorno AWS_BUCKET_NAME y AWS_REGION."
        );
      }
    }

    const response = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      userType: user.userType,
      points: user.points,
      level: user.level,
      createdAt: user.createdAt.toISOString(),
      profile: user.profile
        ? {
            id: user.profile.id,
            bio: user.profile.bio,
            address: user.profile.address,
            city: user.profile.city,
            state: user.profile.state,
            zipCode: user.profile.zipCode,
            phone: user.profile.phone,
            avatarUrl: user.profile.avatarUrl, // Esta es la fileKey
            publicAvatarDisplayUrl: publicAvatarDisplayUrl, // URL pública para el frontend
            badges: user.profile.badges || [],
          }
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    return NextResponse.json(
      { error: "Error al obtener perfil" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const bio = formData.get("bio") as string | null;
    const address = formData.get("address") as string | null;
    const city = formData.get("city") as string | null;
    const state = formData.get("state") as string | null;
    const zipCode = formData.get("zipCode") as string | null;
    const phone = formData.get("phone") as string | null;
    const avatarFile = formData.get("avatarFile") as File | null;
    const deleteAvatar = formData.get("deleteAvatar") === "true";

    if (!name) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.id as string },
      include: { profile: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    let newAvatarFileKey: string | null | undefined =
      currentUser.profile?.avatarUrl;

    if (deleteAvatar) {
      if (currentUser.profile?.avatarUrl) {
        await deleteFileFromS3(currentUser.profile.avatarUrl);
        newAvatarFileKey = null;
      }
    } else if (avatarFile) {
      const validation = validateAvatarFile(avatarFile);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error || "Archivo de avatar inválido" },
          { status: 400 }
        );
      }

      if (currentUser.profile?.avatarUrl) {
        await deleteFileFromS3(currentUser.profile.avatarUrl);
      }
      const s3Response = await uploadAvatarToS3(avatarFile); // Usa la función de s3-service
      newAvatarFileKey = s3Response.fileKey; // uploadAvatarToS3 devuelve fileKey
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.id as string },
      data: {
        name,
        profile: {
          upsert: {
            create: {
              bio,
              address,
              city,
              state,
              zipCode,
              phone,
              avatarUrl: newAvatarFileKey, // Guardar la fileKey
            },
            update: {
              bio,
              address,
              city,
              state,
              zipCode,
              phone,
              avatarUrl: newAvatarFileKey, // Guardar la fileKey
            },
          },
        },
      },
      include: {
        profile: {
          include: {
            badges: true,
          },
        },
      },
    });

    let publicAvatarDisplayUrl: string | null = null;
    if (updatedUser.profile?.avatarUrl) {
      publicAvatarDisplayUrl = getPublicS3Url(updatedUser.profile.avatarUrl);
      if (!publicAvatarDisplayUrl) {
        console.warn(
          "No se pudieron construir las URLs públicas de S3 para el avatar del perfil. Verifica las variables de entorno AWS_BUCKET_NAME y AWS_REGION."
        );
      }
    }

    const response = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      userType: updatedUser.userType,
      points: updatedUser.points,
      level: updatedUser.level,
      createdAt: updatedUser.createdAt.toISOString(),
      profile: updatedUser.profile
        ? {
            id: updatedUser.profile.id,
            bio: updatedUser.profile.bio,
            address: updatedUser.profile.address,
            city: updatedUser.profile.city,
            state: updatedUser.profile.state,
            zipCode: updatedUser.profile.zipCode,
            phone: updatedUser.profile.phone,
            avatarUrl: updatedUser.profile.avatarUrl, // fileKey
            publicAvatarDisplayUrl: publicAvatarDisplayUrl, // URL pública para el frontend
            badges: updatedUser.profile.badges || [],
          }
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error desconocido al actualizar perfil";
    return NextResponse.json(
      { error: "Error al actualizar perfil: " + errorMessage },
      { status: 500 }
    );
  }
}
