// Interfaces for Dashboard
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

// Interfaces for User Profile Data

// export interface UserProfile {
//   id: string;
//   name: string;
//   email: string;
//   role: string;
//   userType: string;
//   points: number;
//   level: number;
//   createdAt: string;
//   profile: {
//     bio?: string;
//     address?: string;
//     city?: string;
//     state?: string;
//     zipCode?: string;
//     phone?: string;
//     avatarUrl?: string;
//   };
//   badges: {
//     id: string;
//     name: string;
//     description: string;
//     imageUrl: string;
//   }[];
// }

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
