import {
  ReportMetadata,
  ReportData,
  ReportFilter,
  RoomLifecycleSegment,
  VacancyRateSummary,
  AlertAnalytics,
  ConsumptionKPI,
  ConsumptionChartPoint,
  ConsumptionDetailRow,
  DebtAgingRow,
  DebtDetailRow,
  FinancialKPI,
  FinancialChartPoint,
  RevenueBreakdownRow,
  NPSSummary,
  NPSTrendPoint,
  NPSResponse,
  OccupancyKPI,
  OccupancyTrendPoint,
  HeatmapCell,
  StaffPerformance,
} from '@/types/reports';

// ---------------------------------------------------------------------------
// Default / empty shapes
// ---------------------------------------------------------------------------

const EMPTY_OCCUPANCY_KPI: OccupancyKPI = {
  avgOccupancyRate: 0,
  avgOccupancyDelta: 0,
  occupiedRooms: 0,
  longestVacantRoom: { roomCode: '', days: 0 },
  avgVacancyDays: 0,
  sparklineData: [],
};

const EMPTY_FINANCIAL_KPI: FinancialKPI = {
  totalRevenue: 0,
  totalRevenueDelta: 0,
  netRevenue: 0,
  totalDebt: 0,
  totalDebtDelta: 0,
  collected: 0,
  collectionRate: 0,
  expiringContracts: 0,
};

const EMPTY_CONSUMPTION_KPI: ConsumptionKPI = {
  avgElectricityPerRoom: 0,
  avgElectricityDelta: 0,
  avgWaterPerRoom: 0,
  avgWaterDelta: 0,
  highestRoom: { roomCode: '', roomId: 0, kwh: 0 },
  avgElectricityBill: 0,
};

const EMPTY_VACANCY_SUMMARY: VacancyRateSummary = {
  avgVacancyDaysThisMonth: 0,
  avgVacancyDaysPrevMonth: 0,
  avgVacancyRateThisMonth: 0,
  avgVacancyRatePrevMonth: 0,
  longestVacantRoom: { roomCode: '', roomId: 0, days: 0 },
  avgDaysToLease: 0,
  avgDaysToLeasePrev: 0,
};

const EMPTY_ALERT_ANALYTICS: AlertAnalytics = {
  criticalCount: 0,
  criticalDelta: 0,
  warningCount: 0,
  warningDelta: 0,
  resolutionRate: 0,
  trend: [],
};

const EMPTY_NPS_SUMMARY: NPSSummary = {
  score: 0,
  promoterPct: 0,
  passivePct: 0,
  detractorPct: 0,
  totalResponses: 0,
};

// ---------------------------------------------------------------------------
// Available report catalogue
// ---------------------------------------------------------------------------

const AVAILABLE_REPORTS: ReportMetadata[] = [
  { id: 'occupancy', name: 'Tỷ lệ lấp đầy', category: 'Occupancy' },
  { id: 'financial', name: 'Báo cáo tài chính', category: 'Finance' },
  { id: 'debt', name: 'Báo cáo công nợ', category: 'Finance' },
  { id: 'consumption', name: 'Tiêu thụ điện/nước', category: 'Utilities' },
  { id: 'nps', name: 'Chỉ số NPS', category: 'Satisfaction' },
  { id: 'staff', name: 'Hiệu suất nhân viên', category: 'Operations' },
];

// ---------------------------------------------------------------------------
// Service
// Report methods return empty/default structures until aggregate queries are
// implemented. All mock imports have been removed.
// ---------------------------------------------------------------------------

export const reportService = {
  getAvailableReports: async (): Promise<ReportMetadata[]> => {
    return AVAILABLE_REPORTS;
  },

  getReportData: async (id: string, params: any): Promise<ReportData> => {
    return {
      reportId: id,
      title: AVAILABLE_REPORTS.find(r => r.id === id)?.name ?? id,
      generatedAt: new Date().toISOString(),
      columns: [],
      data: [],
    };
  },

  getRoomLifecycle: async (filters: ReportFilter): Promise<RoomLifecycleSegment[]> => {
    return [];
  },

  getVacancySummary: async (filters: ReportFilter): Promise<VacancyRateSummary> => {
    return EMPTY_VACANCY_SUMMARY;
  },

  getAlertAnalytics: async (filters: ReportFilter): Promise<AlertAnalytics> => {
    return EMPTY_ALERT_ANALYTICS;
  },

  getConsumptionKPI: async (filters: ReportFilter): Promise<ConsumptionKPI> => {
    return EMPTY_CONSUMPTION_KPI;
  },

  getConsumptionChart: async (filters: ReportFilter): Promise<ConsumptionChartPoint[]> => {
    return [];
  },

  getConsumptionDetail: async (filters: ReportFilter): Promise<ConsumptionDetailRow[]> => {
    return [];
  },

  getDebtAging: async (filters: ReportFilter): Promise<DebtAgingRow[]> => {
    return [];
  },

  getDebtDetail: async (filters: ReportFilter): Promise<DebtDetailRow[]> => {
    return [];
  },

  sendDebtReminder: async (invoiceIds: number[]): Promise<boolean> => {
    return true;
  },

  getFinancialKPI: async (filters: ReportFilter): Promise<FinancialKPI> => {
    return EMPTY_FINANCIAL_KPI;
  },

  getFinancialChart: async (filters: ReportFilter): Promise<FinancialChartPoint[]> => {
    return [];
  },

  getRevenueBreakdown: async (filters: ReportFilter): Promise<RevenueBreakdownRow[]> => {
    return [];
  },

  getNPSSummary: async (filters: ReportFilter): Promise<NPSSummary> => {
    return EMPTY_NPS_SUMMARY;
  },

  getNPSTrend: async (filters: ReportFilter): Promise<NPSTrendPoint[]> => {
    return [];
  },

  getNPSResponses: async (filters: ReportFilter): Promise<NPSResponse[]> => {
    return [];
  },

  getOccupancyKPI: async (filters: ReportFilter): Promise<OccupancyKPI> => {
    return EMPTY_OCCUPANCY_KPI;
  },

  getOccupancyTrend: async (filters: ReportFilter): Promise<OccupancyTrendPoint[]> => {
    return [];
  },

  getOccupancyHeatmap: async (filters: ReportFilter): Promise<HeatmapCell[]> => {
    return [];
  },

  getStaffPerformance: async (filters: ReportFilter): Promise<StaffPerformance[]> => {
    return [];
  },

  exportReport: async (id: string, params: any, format: 'excel' | 'pdf' = 'excel'): Promise<boolean> => {
    return true;
  },
};

export default reportService;
