export type RoomStatus = 'Vacant' | 'Occupied' | 'Maintenance' | 'Reserved';
export type RoomType = 'Studio' | '1BR' | '2BR' | '3BR' | 'Penthouse' | 'Commercial';
export type Furnishing = 'Unfurnished' | 'SemiFurnished' | 'FullyFurnished';
export type DirectionFacing = 'N' | 'S' | 'E' | 'W' | 'NE' | 'NW' | 'SE' | 'SW';

export interface Room {
  id: string;
  roomCode: string;
  buildingId: string;
  buildingName: string;
  floorNumber: number;
  roomType: RoomType;
  areaSqm: number;
  baseRentPrice: number;
  status: RoomStatus;
  thumbnailUrl?: string;
  tenantNames?: string[]; // For avatar stack
  contractId?: string; // If occupied
  hasMeter: boolean;
}

export interface RoomDetail extends Room {
  description?: string;
  maxOccupancy: number;
  furnishing: Furnishing;
  directionFacing: DirectionFacing;
  hasBalcony: boolean;
  conditionScore: number; // 1-10
  lastMaintenanceDate?: string;
  images: RoomImage[];
  amenities: string[];
  meters: RoomMeter[];
  assets: RoomAsset[];
  statusHistory: RoomStatusHistory[];
  contracts: RoomContractSummary[];
}

export interface RoomImage {
  id: string;
  url: string;
  isMain: boolean;
  sortOrder: number;
}

export interface RoomMeter {
  id: string;
  meterCode: string;
  meterType: 'Electricity' | 'Water';
  currentIndex: number; // RULE-01: Use CurrentIndex
  lastReadingDate: string;
  history?: { month: string; value: number }[];
}

export interface RoomAsset {
  id: string;
  assetName: string;
  assetCode: string;
  type: string;
  condition: 'New' | 'Good' | 'Fair' | 'Poor';
  assignedAt: string;
}

export interface RoomStatusHistory {
  id: string;
  fromStatus: RoomStatus;
  toStatus: RoomStatus;
  changedAt: string;
  changedBy: string;
  reason?: string;
  contractId?: string;
}

export interface RoomContractSummary {
  id: string;
  contractCode: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  status: import('@/models/Contract').ContractStatus;
  tenantName: string;
}

export interface HandoverChecklist {
  id: string;
  roomId: string;
  roomCode: string;
  handoverType: 'CheckIn' | 'CheckOut';
  date: string;
  sections: HandoverSection[];
  assets: HandoverAsset[];
  witnessSignatureUrl?: string;
  tenantSignatureUrl?: string;
  status: 'Draft' | 'Completed';
}

export interface HandoverSection {
  id: string;
  title: string;
  items: HandoverItem[];
}

export interface HandoverItem {
  id: string;
  name: string;
  status: 'OK' | 'NotOK';
  note?: string;
  imageUrl?: string;
}

export interface HandoverAsset {
  id: string;
  assetName: string;
  assetCode: string;
  conditionBefore: string;
  conditionAfter: string;
  note?: string;
}
export interface RoomFilters {
  buildingId?: string;
  search?: string;
  status?: RoomStatus[];
  roomType?: RoomType | '';
  minFloor?: number;
  maxFloor?: number;
  minArea?: number;
  maxArea?: number;
  minPrice?: number;
  maxPrice?: number;
  hasMeter?: boolean;
}

export interface CreateRoomData {
  buildingId: string;
  roomCode: string;
  floorNumber: number;
  areaSqm: number;
  roomType: RoomType;
  maxOccupancy: number;
  hasBalcony?: boolean;
  directionFacing: DirectionFacing;
  amenities?: string[];
  baseRentPrice: number;
  conditionScore: number;
  status?: RoomStatus;
}

export type UpdateRoomData = Partial<CreateRoomData>;

export interface AssetFilters {
  roomId?: string;
}
