import type { PlantType } from './planta.types';

export interface Institution {
  id: string;
  name: string;
  domain: string;
  active: boolean;
}

export interface User {
  id: string;
  institutionId: string | null;
  fullName: string;
  cigarettesPerDay: number;
  yearsSmoking: number;
  pricePerPack: number;
  plantType: PlantType;
  plantName: string;
  godparentId: string | null;
  godparentEmail: string | null;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
