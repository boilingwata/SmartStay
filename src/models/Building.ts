export type BuildingType = 'Apartment' | 'Office' | 'Mixed' | 'Shophouse';

export interface Building {
  id: string;
  buildingCode: string;
  buildingName: string;
  type: BuildingType;
  address: string;
  provinceId: string;
  districtId: string;
  wardId: string;
  yearBuilt: number;
  totalFloors: number;
  managementPhone: string;
  managementEmail: string;
  latitude?: number;
  longitude?: number;
  heroImageUrl?: string;
  isDeleted: boolean;
}

export interface BuildingSummary extends Building {
  totalRooms: number; // From vw_BuildingRoomCount
  occupiedRooms: number; // From vw_BuildingOccupancy
  occupancyRate: number;
}

export interface BuildingDetail extends BuildingSummary {
  amenities: string[];
  description?: string;
  images: BuildingImage[];
  ownership: BuildingOwnership[];
}

export interface BuildingImage {
  id: string;
  url: string;
  isMain: boolean;
  sortOrder: number;
}

export interface BuildingOwnership {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  ownershipPercent: number; // 0 - 100
  ownershipType: 'FullOwner' | 'CoOwner' | 'Investor';
  startDate: string;
  endDate?: string;
  note?: string;
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
  buildingName: string;
  type?: BuildingType;
  address: string;
  provinceId?: string;
  districtId?: string;
  wardId?: string;
  yearBuilt?: number;
  totalFloors: number;
  managementPhone?: string;
  managementEmail?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  amenities?: string[];
}

export type UpdateBuildingData = Partial<CreateBuildingData>;
