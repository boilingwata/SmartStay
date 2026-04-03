import type { MeterType } from '@/models/Meter';

export const BILLING_PERIOD_PATTERN = /^\d{4}-\d{2}$/;

export const DEFAULT_METER_CONSUMPTION_THRESHOLDS: Record<MeterType, number> = {
  Electricity: 5000,
  Water: 200,
};

export interface MeterReadingValidationInput {
  meterId: string;
  meterType: MeterType;
  billingPeriod: string;
  currentReading: number | string | null | undefined;
  readingDate?: string;
}

export interface MeterReadingValidationContext {
  previousReading: number;
  existingPeriods?: string[];
  thresholdByType?: Partial<Record<MeterType, number>>;
}

export interface MeterReadingValidationError {
  code: 'required' | 'invalid_period' | 'invalid_reading' | 'decreasing' | 'abnormal_spike' | 'duplicate_period' | 'invalid_reading_date';
  field: 'billingPeriod' | 'currentReading' | 'readingDate';
  message: string;
}

export interface MeterReadingValidationResult {
  isValid: boolean;
  consumption: number | null;
  threshold: number;
  errors: MeterReadingValidationError[];
}

function getThreshold(
  meterType: MeterType,
  thresholdByType?: Partial<Record<MeterType, number>>
): number {
  return thresholdByType?.[meterType] ?? DEFAULT_METER_CONSUMPTION_THRESHOLDS[meterType];
}

function isValidIsoDate(value?: string): boolean {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && value === parsed.toISOString().slice(0, 10);
}

export function validateMeterReading(
  input: MeterReadingValidationInput,
  context: MeterReadingValidationContext
): MeterReadingValidationResult {
  const errors: MeterReadingValidationError[] = [];
  const threshold = getThreshold(input.meterType, context.thresholdByType);
  const normalizedPeriods = new Set((context.existingPeriods ?? []).filter(Boolean));
  const normalizedCurrentReading =
    input.currentReading === '' || input.currentReading == null
      ? Number.NaN
      : Number(input.currentReading);

  if (!BILLING_PERIOD_PATTERN.test(input.billingPeriod)) {
    errors.push({
      code: 'invalid_period',
      field: 'billingPeriod',
      message: 'Kỳ ghi số phải theo định dạng YYYY-MM.',
    });
  }

  if (normalizedPeriods.has(input.billingPeriod)) {
    errors.push({
      code: 'duplicate_period',
      field: 'billingPeriod',
      message: 'Đã tồn tại chỉ số cho đồng hồ này trong kỳ đã chọn.',
    });
  }

  if (!Number.isFinite(normalizedCurrentReading)) {
    errors.push({
      code: 'required',
      field: 'currentReading',
      message: 'Vui lòng nhập chỉ số hiện tại hợp lệ.',
    });
  }

  if (input.readingDate && !isValidIsoDate(input.readingDate)) {
    errors.push({
      code: 'invalid_reading_date',
      field: 'readingDate',
      message: 'Ngày ghi số không hợp lệ.',
    });
  }

  if (!Number.isFinite(normalizedCurrentReading)) {
    return {
      isValid: false,
      consumption: null,
      threshold,
      errors,
    };
  }

  if (normalizedCurrentReading < context.previousReading) {
    errors.push({
      code: 'decreasing',
      field: 'currentReading',
      message: 'Chỉ số hiện tại không được thấp hơn chỉ số kỳ trước.',
    });
  }

  const consumption = normalizedCurrentReading - context.previousReading;

  if (consumption > threshold) {
    errors.push({
      code: 'abnormal_spike',
      field: 'currentReading',
      message: `Mức tiêu thụ ${consumption.toLocaleString()} vượt ngưỡng an toàn ${threshold.toLocaleString()}.`,
    });
  }

  return {
    isValid: errors.length === 0,
    consumption,
    threshold,
    errors,
  };
}
