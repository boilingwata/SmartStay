import {
  ElectricityPolicy,
  ElectricityTier,
  WaterPolicy,
  WaterTier,
  CreateElectricityPolicyDto,
  CreateWaterPolicyDto,
  TierPreviewResult,
} from '../types/policy';

// ---------------------------------------------------------------------------
// Policy service — No matching DB tables exist yet.
// Returns empty defaults; create/write operations are stubs.
// The previewTierCalculation is a pure client-side calculator.
// ---------------------------------------------------------------------------

export const getCurrentElectricityPolicy = async (): Promise<ElectricityPolicy> => {
  return {
    policyId: 0,
    policyName: '',
    effectiveFrom: new Date().toISOString(),
    effectiveTo: null,
    vatRate: 10,
    tiers: [],
    isActive: false,
  };
};

export const getElectricityPolicyHistory = async (): Promise<ElectricityPolicy[]> => {
  return [];
};

export const createElectricityPolicy = async (_dto: CreateElectricityPolicyDto): Promise<ElectricityPolicy> => {
  throw new Error('Policy management not yet connected to backend');
};

export const getCurrentWaterPolicy = async (): Promise<WaterPolicy> => {
  return {
    policyId: 0,
    policyName: '',
    effectiveFrom: new Date().toISOString(),
    effectiveTo: null,
    vatRate: 10,
    zoneName: '',
    environmentFee: 0,
    maintenanceFee: 0,
    tiers: [],
    isActive: false,
  };
};

export const getWaterPolicyHistory = async (): Promise<WaterPolicy[]> => {
  return [];
};

export const createWaterPolicy = async (_dto: CreateWaterPolicyDto): Promise<WaterPolicy> => {
  throw new Error('Policy management not yet connected to backend');
};

export const previewTierCalculation = (
  usage: number,
  tiers: ElectricityTier[] | WaterTier[],
  vatRate: number
): TierPreviewResult => {
  const tierBreakdowns: TierPreviewResult['tierBreakdowns'] = [];
  let remainingUsage = usage;
  let subtotal = 0;

  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    const from = 'fromKwh' in tier ? tier.fromKwh : (tier as WaterTier).fromM3;
    const to = 'toKwh' in tier ? tier.toKwh : (tier as WaterTier).toM3;

    let tierUsage = 0;
    if (remainingUsage > 0) {
      if (to === null) {
        tierUsage = remainingUsage;
      } else {
        const tierCapacity = to - from + 1;
        tierUsage = Math.min(remainingUsage, tierCapacity);
      }
    }

    const amount = tierUsage * tier.unitPrice;
    subtotal += amount;
    remainingUsage -= tierUsage;

    tierBreakdowns.push({
      tier: i + 1,
      from,
      to,
      usage: tierUsage,
      unitPrice: tier.unitPrice,
      amount,
    });
  }

  const vat = (subtotal * vatRate) / 100;
  return {
    tierBreakdowns,
    subtotal,
    vat,
    total: subtotal + vat,
  };
};
