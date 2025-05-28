// Interfaces for Dashboard
import { ActivityStatus } from "@prisma/client";

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
