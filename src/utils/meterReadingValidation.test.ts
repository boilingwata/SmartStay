import { describe, expect, it } from 'vitest';
import { validateMeterReading } from './meterReadingValidation';

describe('validateMeterReading', () => {
  it('rejects readings lower than the previous reading', () => {
    const result = validateMeterReading(
      {
        meterId: '1-elec',
        meterType: 'Electricity',
        billingPeriod: '2026-04',
        currentReading: 90,
        readingDate: '2026-04-02',
      },
      {
        previousReading: 100,
      }
    );

    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.code === 'decreasing')).toBe(true);
  });

  it('rejects duplicate meter period entries', () => {
    const result = validateMeterReading(
      {
        meterId: '1-water',
        meterType: 'Water',
        billingPeriod: '2026-04',
        currentReading: 110,
        readingDate: '2026-04-02',
      },
      {
        previousReading: 100,
        existingPeriods: ['2026-04'],
      }
    );

    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.code === 'duplicate_period')).toBe(true);
  });

  it('rejects abnormal spikes using the configured threshold', () => {
    const result = validateMeterReading(
      {
        meterId: '1-elec',
        meterType: 'Electricity',
        billingPeriod: '2026-04',
        currentReading: 400,
        readingDate: '2026-04-02',
      },
      {
        previousReading: 100,
        thresholdByType: {
          Electricity: 200,
        },
      }
    );

    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.code === 'abnormal_spike')).toBe(true);
  });

  it('accepts a valid reading', () => {
    const result = validateMeterReading(
      {
        meterId: '1-elec',
        meterType: 'Electricity',
        billingPeriod: '2026-04',
        currentReading: 180,
        readingDate: '2026-04-02',
      },
      {
        previousReading: 100,
      }
    );

    expect(result.isValid).toBe(true);
    expect(result.consumption).toBe(80);
    expect(result.errors).toHaveLength(0);
  });
});
