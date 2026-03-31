export type AssetType = 'Furniture' | 'Appliance' | 'Electronics' | 'Fixture' | 'Other';
export type AssetCondition = 'New' | 'Good' | 'Fair' | 'Poor';

export interface Asset {
  id: string;
  assetName: string;
  assetCode: string;
  type: AssetType;
  condition: AssetCondition;
  roomId?: string;
  roomCode?: string;
  buildingName?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  lastMaintenance?: string;
  serialNumber?: string;
  brand?: string;
  model?: string;
  quantity?: number;
  images?: string[];
  note?: string;
}

export interface AssetAssignment {
  id: string;
  assetId: string;
  roomId: string;
  assignedAt: string;
  conditionAtAssignment: AssetCondition;
  note?: string;
}
