export type AssetType = 'Furniture' | 'Appliance' | 'Electronics' | 'Fixture' | 'Other';
export type AssetCondition = 'New' | 'Good' | 'Fair' | 'Poor';
export type AssetAssignmentState = 'Assigned' | 'Unassigned';

export interface Asset {
  id: string;
  assetId: string;
  roomAssetId?: string;
  assignmentState: AssetAssignmentState;
  assetName: string;
  assetCode?: string;
  type: AssetType;
  condition: AssetCondition;
  buildingId?: string;
  roomId?: string;
  roomCode?: string;
  buildingName?: string;
  createdAt?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  lastMaintenance?: string;
  serialNumber?: string;
  brand?: string;
  model?: string;
  quantity?: number;
  description?: string;
  assignedAt?: string;
  isBillable?: boolean;
  billingLabel?: string;
  monthlyCharge?: number;
  billingStartDate?: string;
  billingEndDate?: string;
  billingStatus?: 'Inactive' | 'Active' | 'Suspended' | 'Stopped';
  billingNotes?: string;
  brokenReportedAt?: string;
}

export interface AssetAssignment {
  id: string;
  assetId: string;
  roomId: string;
  assignedAt: string;
  conditionAtAssignment: AssetCondition;
  note?: string;
}
