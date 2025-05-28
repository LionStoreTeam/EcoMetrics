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

// Subir archivos MATERIAL VISUAL
export const uploadVisualMaterialImageToS3 = async (
  file: File,
  folderPrefix: string = "visual-material-images/" // Nueva carpeta para material visual
): Promise<{
  fileKey: string; // Clave del objeto en S3 (ej. visual-material-images/nombre-unico.jpg)
  publicUrl: string; // URL pública directa al objeto en S3
  originalFileName: string;
  fileType: string; // Mime type (ej. 'image/jpeg')
  fileSize: number;
  format: string; // Extensión
}> => {
  // Validaciones de tipo y tamaño ya se hacen en el frontend y backend antes de llamar a esta función,
  // pero podrían duplicarse aquí por seguridad si se desea.
  // Por ahora, asumimos que la validación principal se hace antes.

  const uniqueFileName = generateUniqueFileName(file.name); // Reutilizar función existente
  const fileKey = `${folderPrefix}${uniqueFileName}`;
  const fileBuffer = await file.arrayBuffer();
  const format = file.name.split(".").pop()?.toLowerCase() || "";

  const params: PutObjectCommandInput = {
    Bucket: bucketName,
    Key: fileKey,
    Body: Buffer.from(fileBuffer),
    ContentType: file.type,
    ACL: "public-read",
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    const publicUrl = `${s3BaseUrl}/${fileKey}`;
    console.log(
      "Imagen de Material Visual subida a S3. Key:",
      fileKey,
      "URL:",
      publicUrl
    );
    return {
      fileKey,
      publicUrl,
      originalFileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      format,
    };
  } catch (error) {
    console.error("Error al subir imagen de material visual a S3:", error);
    throw new Error("Error al subir la imagen del material visual");
  }
};

// Subir VIDEOS CORTOS
export const uploadShortVideoFileToS3 = async (
  file: File,
  folderPrefix: string = "short-videos/" // Carpeta para videos cortos
): Promise<{
  fileKey: string;
  publicUrl: string;
  originalFileName: string;
  fileType: string; // Mime type (e.g., 'video/mp4')
  fileSize: number;
  format: string;
}> => {
  // La validación principal de tipo y tamaño se hará antes de llamar a esta función.
  const uniqueFileName = generateUniqueFileName(file.name);
  const fileKey = `${folderPrefix}${uniqueFileName}`;
  const fileBuffer = await file.arrayBuffer();
  const format = file.name.split(".").pop()?.toLowerCase() || "";

  const params: PutObjectCommandInput = {
    Bucket: bucketName,
    Key: fileKey,
    Body: Buffer.from(fileBuffer),
    ContentType: file.type,
    ACL: "public-read",
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    const publicUrl = `${s3BaseUrl}/${fileKey}`;
    console.log("Video corto subido a S3. Key:", fileKey, "URL:", publicUrl);
    return {
      fileKey,
      publicUrl,
      originalFileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      format,
    };
  } catch (error) {
    console.error("Error al subir video corto a S3:", error);
    throw new Error("Error al subir el video corto");
  }
};

// thumbnails DE VIDES CORTORS
export const uploadVideoThumbnailToS3 = async (
  file: File,
  folderPrefix: string = "video-thumbnails/"
): Promise<{
  /* ...mismos campos que uploadAvatarToS3... */ fileKey: string;
  publicUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  format: string;
}> => {
  // Esta función sería muy similar a uploadAvatarToS3, solo cambia el folderPrefix por defecto
  // y el mensaje de log. Se puede copiar y adaptar uploadAvatarToS3.
  const uniqueFileName = generateUniqueFileName(file.name);
  const fileKey = `${folderPrefix}${uniqueFileName}`;
  const fileBuffer = await file.arrayBuffer();
  const format = file.name.split(".").pop()?.toLowerCase() || "";

  const params: PutObjectCommandInput = {
    Bucket: bucketName,
    Key: fileKey,
    Body: Buffer.from(fileBuffer),
    ContentType: file.type,
    ACL: "public-read",
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    const publicUrl = `${s3BaseUrl}/${fileKey}`;
    console.log(
      "Miniatura de video subida a S3. Key:",
      fileKey,
      "URL:",
      publicUrl
    );
    return {
      fileKey,
      publicUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      format,
    };
  } catch (error) {
    console.error("Error al subir miniatura de video a S3:", error);
    throw new Error("Error al subir la miniatura del video");
  }
};

// Nueva función de validación específica para videos (o adaptar la existente)
export const validateVideoFile = (
  file: File,
  maxSizeMB = 10
): { valid: boolean; error?: string } => {
  // Ejemplo: Límite de 10MB para videos
  const MAX_VIDEO_SIZE = maxSizeMB * 1024 * 1024;
  // Usar ALLOWED_VIDEO_TYPES que ya existe en types-s3-service.ts
  // Si GIF no se considera video para esta sección, se debe ajustar ALLOWED_VIDEO_TYPES o crear una nueva constante.
  // Por ahora, asumimos que ALLOWED_VIDEO_TYPES es adecuado.
  const currentAllowedVideoTypes = ALLOWED_VIDEO_TYPES.filter(
    (type) => type !== "image/gif"
  ); // Excluir GIF si solo se quieren videos reales

  if (!currentAllowedVideoTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido para video. Solo se permiten: ${currentAllowedVideoTypes
        .map((t) => t.split("/")[1])
        .join(", ")}.`,
    };
  }
  if (file.size > MAX_VIDEO_SIZE) {
    return {
      valid: false,
      error: `El video excede el tamaño máximo de ${maxSizeMB}MB.`,
    };
  }
  return { valid: true };
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
