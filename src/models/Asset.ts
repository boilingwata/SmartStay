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
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
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
