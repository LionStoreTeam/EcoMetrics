import { S3Client } from "@aws-sdk/client-s3";

// Configuración del cliente S3
export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const bucketName = process.env.AWS_BUCKET_NAME || "";
export const s3BaseUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com`;
export const region = process.env.AWS_REGION;

// Tipos de archivos permitidos (solo imágenes para avatar)
export const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];
// Tipos generales para todas las imágenes del proyecto
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "image/gif"]; // GIF se trata como video para este caso
export const ALLOWED_FILE_TYPES = [
  // Usado para validación general
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
];

export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB para avatares
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB general para imágenes

export const MAX_SHORT_VIDEO_SIZE = 10 * 1024 * 1024; // Ejemplo: 10MB para videos cortos
export const MAX_THUMBNAIL_SIZE = 2 * 1024 * 1024; // Ejemplo: 2MB para miniaturas (podría reusar MAX_AVATAR_SIZE si es 5MB)

// Constantes para la carga de archivos
export const MIN_FILES = 1; // Mínimo de archivos
export const MAX_FILES = 3; // Máximo de archivos
