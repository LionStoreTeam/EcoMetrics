import {
  ALLOWED_AVATAR_TYPES,
  ALLOWED_FILE_TYPES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  bucketName,
  MAX_AVATAR_SIZE,
  MAX_FILE_SIZE,
  s3BaseUrl,
  s3Client,
} from "@/types/types-s3-service";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  type PutObjectCommandInput, // Importar el tipo para los parámetros
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// Función para generar un nombre de archivo único
export const generateUniqueFileName = (originalName: string): string => {
  const extension = originalName.split(".").pop()?.toLowerCase();
  return `${uuidv4()}.${extension}`;
};

// Función para subir un archivo de AVATAR a S3 con ACL pública
export const uploadAvatarToS3 = async (
  file: File,
  folderPrefix: string = "userimageprofile/" // Carpeta específica para avatares
): Promise<{
  fileKey: string; // Clave del objeto en S3 (ej. userimageprofile/nombre-unico.jpg)
  publicUrl: string; // URL pública directa al objeto en S3
  fileName: string; // Nombre original del archivo
  fileType: string; // Mime type
  fileSize: number;
  format: string;
}> => {
  const uniqueFileName = generateUniqueFileName(file.name);
  const fileKey = `${folderPrefix}${uniqueFileName}`;
  const fileBuffer = await file.arrayBuffer();
  const format = file.name.split(".").pop()?.toLowerCase() || "";

  const params: PutObjectCommandInput = {
    Bucket: bucketName,
    Key: fileKey,
    Body: Buffer.from(fileBuffer),
    ContentType: file.type,
    ACL: "public-read", // ACL para hacer el objeto públicamente legible
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    const publicUrl = `${s3BaseUrl}/${fileKey}`;
    console.log("Avatar subido a S3. Key:", fileKey, "URL:", publicUrl);
    return {
      fileKey,
      publicUrl,
      fileName: file.name, // Nombre original
      fileType: file.type,
      fileSize: file.size,
      format,
    };
  } catch (error) {
    console.error("Error al subir archivo de avatar a S3:", error);
    throw new Error("Error al subir el archivo de avatar");
  }
};

// Función para subir un archivo de EVIDENCIA a S3 con ACL pública
export const uploadFileEvidenceToS3 = async (
  file: File,
  folderPrefix: string = "activity-evidence/" // Carpeta para evidencias de actividades
): Promise<{
  fileKey: string; // Clave del objeto en S3 (ej. activity-evidence/nombre-unico.jpg)
  publicUrl: string; // URL pública directa al objeto en S3
  originalFileName: string; // Nombre original del archivo
  fileType: string; // Mime type (ej. 'image/jpeg')
  determinedType: string; // 'image' o 'video' basado en ALLOWED_IMAGE_TYPES
  fileSize: number;
  format: string; // Extensión del archivo (ej. 'jpg')
}> => {
  const uniqueFileName = generateUniqueFileName(file.name);
  const fileKey = `${folderPrefix}${uniqueFileName}`; // Key completa incluyendo la carpeta
  const fileBuffer = await file.arrayBuffer();
  const format = file.name.split(".").pop()?.toLowerCase() || "";

  const params: PutObjectCommandInput = {
    Bucket: bucketName,
    Key: fileKey,
    Body: Buffer.from(fileBuffer),
    ContentType: file.type,
    ACL: "public-read", // ACL para hacer el objeto públicamente legible
  };

  try {
    await s3Client.send(new PutObjectCommand(params));

    // Construir la URL pública directa
    const publicUrl = `${s3BaseUrl}/${fileKey}`;

    // Determinar el tipo de archivo (imagen o video)
    const determinedType = ALLOWED_IMAGE_TYPES.includes(file.type)
      ? "image"
      : ALLOWED_VIDEO_TYPES.includes(file.type)
      ? "video"
      : "other"; // "other" si no es imagen ni video conocido

    console.log("Archivo de evidencia subido a S3. Key:", fileKey);
    console.log("URL pública del archivo de evidencia:", publicUrl);

    return {
      fileKey, // Esta es la clave que guardarías en la DB (ej. 'activity-evidence/uuid.jpg')
      publicUrl, // Esta es la URL que usarías para mostrar el archivo
      originalFileName: file.name,
      fileType: file.type, // Mime type original
      determinedType, // 'image' o 'video'
      fileSize: file.size,
      format,
    };
  } catch (error) {
    console.error("Error al subir archivo de evidencia a S3:", error);
    throw new Error("Error al subir el archivo de evidencia");
  }
};

// Función para obtener la URL firmada de un archivo PRIVADO en S3
export const getSignedFileUrl = async (
  fileKey: string,
  expiresIn: number = 3600 // 1 hora por defecto
): Promise<string> => {
  const params = {
    Bucket: bucketName,
    Key: fileKey,
  };

  try {
    const command = new GetObjectCommand(params);
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    console.log("URL firmada generada:", signedUrl);
    return signedUrl;
  } catch (error) {
    console.error("Error al obtener URL firmada:", error);
    throw new Error("Error al obtener la URL del archivo");
  }
};

// Helper para construir la URL pública de S3 (puedes moverlo a lib/s3Utils.ts)
export const getPublicS3Url = (fileKey: string): string | null => {
  const bucketName = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  if (bucketName && region && fileKey) {
    return `https://${bucketName}.s3.${region}.amazonaws.com/${fileKey}`;
  }
  return null;
};

// Función para eliminar un archivo de S3
export const deleteFileFromS3 = async (fileKey: string): Promise<void> => {
  const params = {
    Bucket: bucketName,
    Key: fileKey,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
    console.log("Archivo eliminado de S3. Key:", fileKey);
  } catch (error) {
    console.error("Error al eliminar archivo de S3:", error);
    // Considera si quieres relanzar el error o manejarlo de otra forma
  }
};

// Función para validar un archivo de AVATAR
export const validateAvatarFile = (
  file: File
): { valid: boolean; error?: string } => {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return {
      valid: false,
      error:
        "Tipo de archivo no permitido para avatar. Solo se permiten JPG, PNG, JPEG, WEBP.",
    };
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return {
      valid: false,
      error: "El archivo de avatar excede el tamaño máximo permitido de 5MB.",
    };
  }
  return { valid: true };
};

// Función para validar un archivo de EVIDENCIA GENERAL
export const validateFile = (
  file: File
): { valid: boolean; error?: string } => {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error:
        "Tipo de archivo no permitido. Solo se permiten JPG, PNG, JPEG, WEBP, MP4 y GIF.",
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "El archivo excede el tamaño máximo permitido de 5MB.",
    };
  }
  return { valid: true };
};
