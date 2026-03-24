export type MeterType = 'Electricity' | 'Water';
export type MeterStatus = 'Active' | 'Inactive' | 'Replaced';

export interface Meter {
  id: string;
  meterCode: string;
  meterType: MeterType;
  meterStatus: MeterStatus;
  buildingId: string;
  buildingName?: string;
  roomId: string;
  roomCode?: string;
  latestReadingIndex?: number; // RULE-01: Derived from vw_LatestMeterReading
  latestMonthYear?: string;
  description?: string;
}

export interface LatestMeterReading {
  meterId: string;
  currentIndex: number;
  monthYear: string;
  readingDate: string;
  consumption: number;
}

export interface MeterReading {
  id: string;
  meterId: string;
  monthYear: string; // MM/YYYY
  readingDate: string;
  previousIndex: number;
  currentIndex: number;
  consumption: number;
  note?: string;
  readingImageUrl?: string;
  recordedById: string;
  recordedByName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MeterBillCalculation {
  id: string;
  readingId: string;
  unitPrice: number;
  totalAmount: number;
  vatPercent: number;
  envFee?: number; // Water only
}
