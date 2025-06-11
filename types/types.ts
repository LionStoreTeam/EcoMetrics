// Interfaces for Dashboard
import { ActivityStatus, UserType } from "@prisma/client";

export interface Activity {
  id: string;
  title: string;
  description: string;
  type: string;
  quantity: number;
  unit: string;
  points: number;
  date: string;
  createdAt: string;
  user: {
    name: string;
  };
  evidence: Evidence[];
}

export interface Evidence {
  id: string;
  fileUrl: string; // Sigue siendo la fileKey
  publicDisplayUrl?: string | null; // URL pública para mostrar
  fileType: string; // 'image' o 'video' determinado por la API
  fileName: string;
  fileSize: number;
  format: string;
  description?: string;
}

export interface UserStats {
  totalPoints: number;
  level: number;
  activityCount: number;
  recentActivities: Activity[];
}

// Interfaces for Estadísticas

export interface ActivityStat {
  type: string;
  _count: { id: number };
  _sum: { points: number; quantity: number };
}

export interface TimeSeriesData {
  date: string;
  points: number;
  count: number;
}

export interface StatsData {
  totalPoints: number;
  level: number;
  activityCount: number;
  activityStats: ActivityStat[];
  timeSeries: TimeSeriesData[];
  impactMetrics: {
    recycledMaterials: number;
    treesPlanted: number;
    waterSaved: number;
    energySaved: number;
  };
  impact: {
    co2Saved: number;
    waterSaved: number;
    energySaved: number;
  };
  materialsRecycled: {
    name: string;
    quantity: number;
    unit: string;
  }[];
}

export interface UserProfileBadge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  userType: string;
  points: number;
  level: number;
  createdAt: string;
  profile: {
    id: string; // Añadido por consistencia
    bio?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    publicAvatarDisplayUrl?: string; // Esta será la fileKey de S3
    signedAvatarUrl?: string; // URL firmada para mostrar la imagen
    badges: UserProfileBadge[];
  } | null; // Profile puede ser null si no existe
}

export interface UserForActivity {
  id: string;
  name: string;
  email: string;
  userType: string;
  profile?: { avatarPublicUrl?: string | null } | null;
}
export interface EvidenceForActivity {
  id: string;
  publicDisplayUrl?: string | null;
  fileType: string;
  fileName: string;
  format?: string;
}
export interface ActivityForAdmin {
  id: string;
  title: string;
  description: string | null;
  type: string;
  quantity: number;
  unit: string;
  points: number;
  date: string;
  createdAt: string;
  user: UserForActivity;
  evidence: EvidenceForActivity[];
  status: ActivityStatus;
}
export interface AdminActivitiesApiResponse {
  activities: ActivityForAdmin[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Sección Negocios
export interface BusinessFormData {
  businessName: string;
  logo?: File | null;
  description: string;
  businessType: string; // Usaremos string aquí, validado por Zod contra las claves de BUSINESS_TYPES
  address: string;
  city: string;
  state: string; // Se validará contra MEXICAN_STATES
  zipCode?: string;
  phone?: string;
  latitude?: string; // Se convertirán a número
  longitude?: string; // Se convertirán a número
  openingHours?: string;
  email?: string;
  website?: string;
  socialMedia?: string;
}

export interface BusinessPromotion extends BusinessFormData {
  id: string;
  logoUrl?: string | null;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

export interface ProductImageInfo {
  id: string; // podría ser un uuid generado en el cliente o el nombre del archivo
  file: File;
  previewUrl: string;
}
export interface ProductImageInfoInternal {
  id: string; // podría ser un uuid generado en el cliente o el nombre del archivo
  file: File;
  previewUrl: string;
}

export interface ProductPromotionFormData {
  businessName: string;
  productName: string;
  businessLogoFile?: File | null; // Logo del negocio
  description: string;
  businessType: string;
  productImageFiles: ProductImageInfo[]; // Múltiples imágenes del producto
  priceOrPromotion: string;
  address: string;
  city: string;
  state: string;
  validUntil?: string | null; // Fecha como string dd/mm/yyyy o yyyy-mm-dd
  zipCode?: string;
  phone?: string;
  latitude?: string;
  longitude?: string;
  openingHours?: string;
  contactEmail?: string;
  website?: string;
  socialMediaLinks?: string;
}

// Interfaz para el estado del modelo ProductPromotionRequest en el frontend (si es necesario para la vista pública)
export interface ProductPromotionRequestFE
  extends Omit<ProductPromotionFormData, "businessLogoFile" | "validUntil"> {
  id: string;
  businessLogoUrl?: string | null; // URL pública del logo del negocio
  productImageUrls: { id: string; url: string | null }[]; // Array de URLs públicas de imágenes de producto
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  submittedAt: string; // ISO String
  reviewedAt?: string | null; // ISO String
  reviewerNotes?: string | null;
  validUntil?: string | null; // ISO string
  paymentIntentId?: string;
  paymentStatus?: string;
  amountPaid?: number;
  currency?: string;
}

// Copia del enum si no se usa directamente de @prisma/client en el frontend
export enum VisualMaterialTopic {
  INFOGRAFIA = "INFOGRAFIA",
  VIDEO_TUTORIAL = "VIDEO_TUTORIAL",
  PRESENTACION = "PRESENTACION",
  GALERIA_IMAGENES = "GALERIA_IMAGENES",
  GUIA_VISUAL_RAPIDA = "GUIA_VISUAL_RAPIDA",
  ECO_RETO_VISUAL = "ECO_RETO_VISUAL",
  OTRO = "OTRO",
}

export interface VisualMaterialImageItem {
  id: string;
  url: string; // URL pública de S3
  s3Key?: string; // Opcional, solo para referencia interna si es necesario
  order: number;
}

export interface VisualMaterialItem {
  id: string;
  title: string;
  description?: string | null;
  topic: VisualMaterialTopic;
  authorName: string;
  authorInstitution: string;
  authorInfo?: string | null;
  userId: string;
  user: {
    // Información básica del creador
    id: string;
    name: string;
    userType: UserType; // Importado de @prisma/client o definido localmente
  };
  images: VisualMaterialImageItem[]; // Array de imágenes
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  likes: number;
  dislikes: number;
  currentUserRating?: boolean | null; // true para like, false para dislike, null si no ha votado
}

// Para el formulario de creación/edición de Material Visual
export interface VisualMaterialFormData {
  title: string;
  description?: string;
  topic: VisualMaterialTopic;
  authorName: string;
  authorInstitution: string;
  authorInfo?: string;
  images: File[]; // Array de archivos para subir
  existingImageS3Keys?: { id: string; s3Key: string; order: number }[]; // Para edición, IDs y S3 keys de imágenes existentes
  imagesToDelete?: string[]; // IDs de VisualMaterialImage a eliminar durante la edición
}

// Para la API de listado de Material Visual
export interface VisualMaterialsApiResponse {
  visualMaterials: VisualMaterialItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Videos Cortos

export enum VideoTopic {
  TUTORIAL_PRACTICO = "TUTORIAL_PRACTICO",
  CONSEJO_RAPIDO = "CONSEJO_RAPIDO",
  DEMOSTRACION_PROYECTO = "DEMOSTRACION_PROYECTO",
  ENTREVISTA_EXPERTO = "ENTREVISTA_EXPERTO",
  ANIMACION_EXPLICATIVA = "ANIMACION_EXPLICATIVA",
  ECO_NOTICIA_BREVE = "ECO_NOTICIA_BREVE",
  OTRO = "OTRO",
}

export interface ShortVideoItem {
  id: string;
  title: string;
  description?: string | null;
  videoUrl?: string | null; // Será la URL pública de S3 si videoS3Key existe
  externalVideoUrl?: string | null; // Nueva URL para videos externos
  thumbnailUrl?: string | null;
  duration?: number | null;
  topic: VideoTopic; // Asegúrate que VideoTopic esté definido aquí o importado
  authorName: string;
  authorInstitution: string;
  authorInfo?: string | null;
  userId: string;
  user: {
    id: string;
    name: string;
    userType: UserType;
  };
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  likes: number;
  dislikes: number;
  currentUserRating?: boolean | null;
}

// Para el formulario de creación/edición de Videos Cortos
export interface ShortVideoFormData {
  title: string;
  description?: string;
  topic: VideoTopic;
  authorName: string;
  authorInstitution: string;
  authorInfo?: string;
  duration?: string; // Mantener como string para el input, convertir a número en backend/validación

  // Para la fuente del video
  videoSourceType: "upload" | "url"; // Para que el usuario elija
  videoFile?: File | null;
  externalVideoUrl?: string;

  thumbnailFile?: File | null;
  existingVideoS3Key?: string | null; // Para edición, si se mantiene el video S3
  existingThumbnailS3Key?: string | null; // Para edición
  deleteExistingThumbnail?: boolean; // Para marcar miniatura para borrar en edición
}

// Para la API de listado de Videos Cortos
export interface ShortVideosApiResponse {
  shortVideos: ShortVideoItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
