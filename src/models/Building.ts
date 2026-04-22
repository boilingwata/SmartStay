export type BuildingType = 'Apartment' | 'Office' | 'Mixed' | 'Shophouse';

/**
 * Database row for smartstay.buildings
 */
export interface BuildingDbRow {
  id: number;
  uuid: string;
  name: string;
  address: string;
  description: string | null;
  amenities: string[] | null; // jsonb
  owner_id: string | null;
  total_floors: number | null;
  opening_date: string | null;
  latitude: number | null;
  longitude: number | null;
  electricity_provider: string | null;
  water_provider: string | null;
  fire_cert_expiry: string | null;
  last_maintenance_date: string | null;
  is_deleted: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  // Join fields
  rooms?: { count: number }[];
}

export interface Building {
  id: string;
  uuid: string;
  buildingCode: string; // Calculated: B + padded ID
  name: string;
  buildingName: string;
  address: string;
  description?: string;
  amenities: string[];
  totalFloors: number;
  openingDate?: string;
  latitude?: number;
  longitude?: number;
  electricityProvider?: string;
  waterProvider?: string;
  fireCertExpiry?: string;
  lastMaintenanceDate?: string;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  heroImageUrl?: string;

  // UI-only transient fields for address selection
  provinceId?: string;
  districtId?: string;
  wardId?: string;

  // Legacy/Other
  type?: BuildingType; // Not in DB yet, keeping for UI
  managementPhone?: string; // Often from owner profile
  managementEmail?: string; // Often from owner profile
}

export interface BuildingSummary extends Building {
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
}

export interface BuildingDetail extends BuildingSummary {
  images: BuildingImage[];
}

export interface BuildingImage {
  id: string;
  url: string;
  isMain: boolean;
  sortOrder: number;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string;
}

export interface BuildingFilters {
  search?: string;
  type?: BuildingType;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'totalRooms' | 'occupancyRate' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  minRooms?: number;
  maxRooms?: number;
  occupancyBracket?: 'low' | 'medium' | 'high';
}

export interface CreateBuildingData {
  name: string;
  address: string;
  description?: string;
  amenities?: string[];
  totalFloors: number;
  openingDate?: string;
  latitude?: number;
  longitude?: number;
  electricityProvider?: string;
  waterProvider?: string;
  fireCertExpiry?: string;
  lastMaintenanceDate?: string;

  // Transient UI fields
  provinceId?: string;
  districtId?: string;
  wardId?: string;

  // UI-only
  type?: BuildingType;
}

export type UpdateBuildingData = Partial<CreateBuildingData>;

