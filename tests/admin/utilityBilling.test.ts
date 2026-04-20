import { describe, it, expect } from 'vitest';
import { computeUtilitySnapshot, type UtilityComputationInput } from '../../supabase/functions/_shared/utilityBilling';

describe('Utility Billing Logic - computeUtilitySnapshot', () => {
  const basePolicy = {
    id: 1,
    scopeType: 'system' as const,
    scopeId: null,
    electricBaseAmount: 200000,
    waterBaseAmount: 60000,
    waterPerPersonAmount: 100000,
    electricHotSeasonMultiplier: 1.15,
    locationMultiplier: 1.1,
    seasonMonths: ['05', '06', '07'],
    roundingIncrement: 1000,
    minElectricFloor: 120000,
    minWaterFloor: 60000,
    effectiveFrom: '2023-01-01',
  };

  const baseInput: UtilityComputationInput = {
    billingPeriod: '2024-05', // May is a hot season
    roomId: 101,
    policySourceType: 'system',
    resolvedPolicyId: 1,
    overrideId: null,
    contractStartDate: '2024-05-01',
    contractEndDate: '2025-05-01',
    occupantsForBilling: 2,
    roomAmenities: ['aircon', 'electric_stove'],
    policy: basePolicy,
    deviceAdjustments: [
      { deviceCode: 'aircon', chargeAmount: 50000 },
      { deviceCode: 'electric_stove', chargeAmount: 20000 },
    ],
  };

  it('should calculate electricity correctly with hot season, location multiplier, and device surcharge', () => {
    const result = computeUtilitySnapshot(baseInput);
    
    // Expected logic:
    // Prorate ratio: 1 (full month)
    // Device Surcharge: 50,000 + 20,000 = 70,000
    // Subtotal: 200,000 (base) + 70,000 = 270,000
    // Hot season multiplier: 1.15
    // Location multiplier: 1.1
    // Raw Amount: 270,000 * 1.15 * 1.1 = 341,550
    // Rounded: 342,000
    
    expect(result.electricBaseAmount).toBe(200000);
    expect(result.electricDeviceSurcharge).toBe(70000);
    expect(result.electricSubtotal).toBe(270000);
    expect(result.electricSeasonMultiplier).toBe(1.15);
    expect(result.electricLocationMultiplier).toBe(1.1);
    expect(result.electricRawAmount).toBe(341550);
    expect(result.electricRoundedAmount).toBe(342000);
    expect(result.electricFinalAmount).toBe(342000);
  });

  it('should calculate water correctly per person and location multiplier', () => {
    const result = computeUtilitySnapshot(baseInput);
    
    // Expected logic:
    // Prorate ratio: 1 (full month)
    // Base amount: 60,000
    // Per person amount: 100,000 * 2 = 200,000
    // Subtotal: 260,000
    // Location multiplier: 1.1
    // Raw Amount: 260,000 * 1.1 = 286,000
    // Rounded: 286,000
    
    expect(result.waterBaseAmount).toBe(60000);
    expect(result.waterPersonCharge).toBe(200000);
    expect(result.waterSubtotal).toBe(260000);
    expect(result.waterRawAmount).toBe(286000);
    expect(result.waterFinalAmount).toBe(286000);
  });

  it('should calculate correctly for non-hot season', () => {
    const input = { ...baseInput, billingPeriod: '2024-08' }; // Not in seasonMonths
    const result = computeUtilitySnapshot(input);
    
    // Season multiplier should be 1
    // Raw Amount: 270,000 * 1 * 1.1 = 297,000
    expect(result.electricSeasonMultiplier).toBe(1);
    expect(result.electricRawAmount).toBe(297000);
    expect(result.electricFinalAmount).toBe(297000);
  });

  it('should prorate utility amounts when contract spans partial month', () => {
    const input = { ...baseInput, contractStartDate: '2024-05-16', contractEndDate: '2024-05-20' };
    const result = computeUtilitySnapshot(input);
    
    // May has 31 days. Occupied from 16 to 20 -> 5 days
    // Ratio: 5 / 31
    expect(result.daysInPeriod).toBe(31);
    expect(result.occupiedDays).toBe(5);
    
    const ratio = 5 / 31;
    expect(result.prorateRatio).toBe(ratio);
    
    const rawElectric = 270000 * 1.15 * 1.1 * ratio;
    const roundedElectric = Math.round(rawElectric / 1000) * 1000;
    
    expect(result.electricRawAmount).toBeCloseTo(rawElectric, 5);
    // Even if prorated below min floor, it should floor it! Wait...
    // Let's check floor: 120,000. 
    // 341550 * 5/31 = 55,088 -> below 120,000! So it should become 120,000
    expect(result.electricFinalAmount).toBe(120000);
  });

  it('should apply manual overrides correctly (Base Override)', () => {
    const input = {
      ...baseInput,
      override: {
        id: 1,
        electricBaseOverride: 250000, // Replaces 200k base
      }
    };
    const result = computeUtilitySnapshot(input);
    
    // Base is 250,000. Surcharge is 70,000. Subtotal: 320,000
    // Raw: 320,000 * 1.15 * 1.1 = 404,800
    expect(result.electricBaseAmount).toBe(250000);
    expect(result.electricSubtotal).toBe(320000);
    expect(result.electricRawAmount).toBe(404800);
    expect(result.electricFinalAmount).toBe(405000);
  });

  it('should apply manual overrides correctly (Final Override)', () => {
    const input = {
      ...baseInput,
      override: {
        id: 1,
        electricFinalOverride: 500000, // Replaces EVERYTHING
        waterFinalOverride: 0,
      }
    };
    const result = computeUtilitySnapshot(input);
    
    expect(result.electricFinalAmount).toBe(500000);
    expect(result.waterFinalAmount).toBe(0); // Allowed to be 0 if final override is 0
  });

  it('should include room assets when resolving device surcharge', () => {
    const result = computeUtilitySnapshot({
      ...baseInput,
      roomAmenities: ['WiFi'],
      roomAssets: [
        { assetName: 'Máy lạnh Panasonic', assetType: 'appliance', billingLabel: 'Máy lạnh phòng ngủ' },
        { assetName: 'Bình nóng lạnh Ferroli', assetType: 'appliance', billingLabel: null },
      ],
      deviceAdjustments: [
        { deviceCode: 'aircon', chargeAmount: 50000 },
        { deviceCode: 'water_heater', chargeAmount: 30000 },
      ],
    });

    expect(result.electricDeviceSurcharge).toBe(80000);
    expect(result.resolvedDeviceSurcharges).toEqual([
      { deviceCode: 'aircon', chargeAmount: 50000 },
      { deviceCode: 'water_heater', chargeAmount: 30000 },
    ]);
  });
});
