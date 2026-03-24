export interface KPIData {
  totalBuildings?: number;
  totalRooms?: number;
  occupiedRooms?: number;
  occupancyRate?: number;
  currentMonthRevenue?: number;
  totalOverdueBalance?: number;
  activeContracts?: number;
  openTickets?: number;
  // Staff-specific KPIs
  assignedTickets?: number;
  slaOverdueTickets?: number;
  todayTickets?: number;
  avgRating?: number;
  unprocessedTickets?: number;
  processingTickets?: number;
  completedThisWeek?: number;
  slaOnTimeRate?: number;
  deltas: {
    [key: string]: number;
  }
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  profit: number;
}

export interface OccupancyData {
  occupied: number;
  vacant: number;
  maintenance: number;
  reserved: number;
  totalOccupancyRate: number;
}

export interface RecentPayment {
  id: string;
  transactionCode: string;
  tenantName: string;
  tenantAvatar?: string;
  amount: number;
  method: 'Cash' | 'Bank' | 'VNPay' | 'MoMo' | 'Zalo';
  status: 'Pending' | 'Confirmed' | 'Rejected';
  createdAt: string;
}

export interface RecentTicket {
  id: string;
  ticketCode: string;
  title: string;
  roomName: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'InProgress' | 'Resolved' | 'Closed';
  assignedTo?: string;
  assignedAvatar?: string;
  createdAt: string;
  slaDeadline: string;
}

export interface ElectricityDataPoint {
  month: string;
  [buildingName: string]: string | number;
}

export interface AnalyticsAlert {
  id: string;
  type: string;
  severity: 1 | 2 | 3;
  message: string;
  affectedEntity: string;
  isResolved: boolean;
  createdAt: string;
}
