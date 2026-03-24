export interface ReportFilter {
  buildingIds?: number[]
  from: string
  to: string
  period: "month" | "quarter" | "year" | "custom"
  consumptionType?: 'electricity' | 'water' | 'both'
}

export interface ReportMetadata {
  id: string
  name: string
  category: string
  description?: string
}

export interface ReportData {
  reportId: string
  title: string
  generatedAt: string
  columns: { key: string; label: string }[]
  data: any[]
  summaryData?: any
}

export interface OccupancyKPI {
  avgOccupancyRate: number
  avgOccupancyDelta: number
  occupiedRooms: number
  longestVacantRoom: { roomCode: string; days: number }
  avgVacancyDays: number
  sparklineData?: { value: number }[]
}

export interface OccupancyTrendPoint {
  month: string
  buildingId: number
  buildingName: string
  rate: number
}

export interface HeatmapCell {
  roomCode: string
  month: string
  status: "Occupied" | "Vacant" | "Maintenance" | "Reserved"
  fromDate: string
  toDate: string
  days: number
}

export interface FinancialKPI {
  totalRevenue: number
  totalRevenueDelta: number
  netRevenue: number
  totalDebt: number
  totalDebtDelta: number
  collected: number
  collectionRate: number
  expiringContracts: number
}

export interface FinancialChartPoint {
  month: string
  revenue: number
  debt: number
  collected: number
}

export interface RevenueBreakdownRow {
  source: string
  months: number[]
  quarterTotal: number
  percentage: number
  yoyPct: number
}

export type DebtAgeGroup = "current" | "1-30" | "31-60" | "61-90" | "90+"

export interface DebtAgingRow {
  ageGroup: DebtAgeGroup
  label: string
  contractCount: number
  invoiceCount: number
  totalDebt: number
  percentage: number
}

export interface DebtDetailRow {
  tenantName: string
  roomCode: string
  contractCode: string
  invoiceCode: string
  daysOverdue: number
  amountDue: number
  lastPaymentDate: string | null
  invoiceId: number
  tenantId: number
}

export interface ConsumptionKPI {
  avgElectricityPerRoom: number
  avgElectricityDelta: number
  avgWaterPerRoom: number
  avgWaterDelta: number
  highestRoom: { roomCode: string; roomId: number; kwh: number }
  avgElectricityBill: number
}

export interface ConsumptionChartPoint {
  month: string
  buildingName: string
  electricity: number
  water: number
}

export interface ConsumptionDetailRow {
  roomId: number
  roomCode: string
  buildingName: string
  type: "electricity" | "water"
  prevIndex: number
  currentIndex: number
  consumption: number
  estimatedAmount: number
  vsLastMonth: number
}

export interface RoomLifecycleSegment {
  roomCode: string
  roomId: number
  segments: {
    status: "Occupied" | "Vacant" | "Maintenance" | "Reserved"
    fromDate: string
    toDate: string
    days: number
  }[]
}

export interface VacancyRateSummary {
  avgVacancyDaysThisMonth: number
  avgVacancyDaysPrevMonth: number
  avgVacancyRateThisMonth: number
  avgVacancyRatePrevMonth: number
  longestVacantRoom: { roomCode: string; roomId: number; days: number }
  avgDaysToLease: number
  avgDaysToLeasePrev: number
}

export interface NPSSummary {
  score: number
  promoterPct: number
  passivePct: number
  detractorPct: number
  totalResponses: number
}

export interface NPSTrendPoint {
  month: string
  score: number
}

export interface NPSResponse {
  tenantName: string
  score: number
  comment: string
  triggerType: "Monthly" | "PostCheckOut" | "PostMaintenance"
  createdAt: string
}

export interface StaffPerformance {
  staffId: number
  staffName: string
  avatarUrl: string | null
  ticketsResolved: number
  avgResolutionHours: number
  slaRate: number
  avgRating: number
  ratingCount: number
}

export interface AlertTrendPoint {
  date: string
  count: number
}

export interface AlertAnalytics {
  criticalCount: number
  criticalDelta: number
  warningCount: number
  warningDelta: number
  resolutionRate: number
  trend: AlertTrendPoint[]
}
