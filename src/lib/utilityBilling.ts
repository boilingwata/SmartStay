export interface UtilityPolicyInput {
  id: number;
  scopeType: 'system' | 'building' | 'room' | 'contract';
  scopeId: number | null;
  electricBaseAmount: number;
  waterBaseAmount: number;
  waterPerPersonAmount: number;
  electricHotSeasonMultiplier: number;
  locationMultiplier: number;
  seasonMonths: string[];
  roundingIncrement: number;
  minElectricFloor: number;
  minWaterFloor: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

export interface UtilityOverrideInput {
  id: number;
  occupantsForBillingOverride?: number | null;
  electricBaseOverride?: number | null;
  electricFinalOverride?: number | null;
  waterBaseOverride?: number | null;
  waterFinalOverride?: number | null;
  locationMultiplierOverride?: number | null;
  seasonMonthsOverride?: string[] | null;
  electricHotSeasonMultiplierOverride?: number | null;
}

export interface UtilityDeviceAdjustmentInput {
  deviceCode: string;
  chargeAmount: number;
}

export interface UtilityComputationInput {
  billingPeriod: string;
  roomId: number;
  policySourceType: 'invoice_override' | 'contract' | 'room' | 'building' | 'system';
  resolvedPolicyId: number | null;
  overrideId: number | null;
  billingRunId?: number | null;
  contractStartDate: string;
  contractEndDate: string;
  occupantsForBilling: number;
  roomAmenities: unknown;
  roomAssets?: Array<{ assetName?: string | null; assetType?: string | null; billingLabel?: string | null }> | null;
  policy: UtilityPolicyInput;
  override?: UtilityOverrideInput | null;
  deviceAdjustments: UtilityDeviceAdjustmentInput[];
}

export interface UtilityWarning {
  code: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface UtilitySnapshotResult {
  roomId: number;
  billingRunId: number | null;
  overrideId: number | null;
  resolvedPolicyId: number | null;
  policySourceType: 'invoice_override' | 'contract' | 'room' | 'building' | 'system';
  periodStart: string;
  periodEnd: string;
  occupantsForBilling: number;
  occupiedDays: number;
  daysInPeriod: number;
  prorateRatio: number;
  electricBaseAmount: number;
  electricDeviceSurcharge: number;
  electricSubtotal: number;
  electricSeasonMultiplier: number;
  electricLocationMultiplier: number;
  electricRawAmount: number;
  electricRoundedAmount: number;
  minElectricFloor: number;
  electricFinalAmount: number;
  waterBaseAmount: number;
  waterPerPersonAmount: number;
  waterPersonCharge: number;
  waterSubtotal: number;
  waterLocationMultiplier: number;
  waterRawAmount: number;
  waterRoundedAmount: number;
  minWaterFloor: number;
  waterFinalAmount: number;
  roundingIncrement: number;
  resolvedDeviceSurcharges: Array<{ deviceCode: string; chargeAmount: number }>;
  warnings: UtilityWarning[];
  formulaSnapshot: Record<string, unknown>;
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function normalizeDeviceCode(raw: string): string | null {
  const normalized = normalizeText(raw);
  if (!normalized) return null;
  if (
    normalized.includes('aircon') ||
    normalized.includes('ac') ||
    normalized.includes('dieu hoa') ||
    normalized.includes('may lanh')
  ) return 'aircon';
  if (
    normalized.includes('water heater') ||
    normalized.includes('binh nong lanh') ||
    normalized.includes('nong lanh')
  ) return 'water_heater';
  if (
    normalized.includes('electric stove') ||
    normalized.includes('bep dien') ||
    normalized.includes('induction')
  ) return 'electric_stove';
  if (normalized.includes('dryer') || normalized.includes('may say')) return 'dryer';
  if (normalized.includes('freezer') || normalized.includes('tu dong')) return 'freezer';
  return normalized.replace(/\s+/g, '_');
}

export function extractDeviceCodes(amenities: unknown): string[] {
  const deviceCodes = new Set<string>();

  const addCode = (raw: unknown) => {
    if (typeof raw !== 'string') return;
    const code = normalizeDeviceCode(raw);
    if (code) deviceCodes.add(code);
  };

  if (Array.isArray(amenities)) {
    for (const item of amenities) {
      addCode(item);
    }
    return Array.from(deviceCodes);
  }

  if (!amenities || typeof amenities !== 'object') return [];

  for (const [key, value] of Object.entries(amenities as Record<string, unknown>)) {
    if (value === true) {
      addCode(key);
      continue;
    }

    if (typeof value === 'string') {
      addCode(value);
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        addCode(item);
      }
    }
  }

  return Array.from(deviceCodes);
}

export function extractRoomAssetDeviceCodes(
  roomAssets: Array<{ assetName?: string | null; assetType?: string | null; billingLabel?: string | null }> | null | undefined,
): string[] {
  const deviceCodes = new Set<string>();

  for (const asset of roomAssets ?? []) {
    for (const candidate of [asset.assetName, asset.assetType, asset.billingLabel]) {
      if (typeof candidate !== 'string') continue;
      const code = normalizeDeviceCode(candidate);
      if (code) deviceCodes.add(code);
    }
  }

  return Array.from(deviceCodes);
}

export function readTermsOccupants(terms: unknown): number | null {
  if (!terms || typeof terms !== 'object') return null;
  const source = terms as Record<string, unknown>;
  const candidates = [
    source.occupants_for_billing,
    (source.utility as Record<string, unknown> | undefined)?.occupants_for_billing,
    (source.billing as Record<string, unknown> | undefined)?.occupants_for_billing,
  ];

  for (const candidate of candidates) {
    const numeric = toFiniteNumber(candidate, NaN);
    if (Number.isFinite(numeric) && numeric >= 0) return numeric;
  }

  return null;
}

export function parseSeasonMonths(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.padStart(2, '0').slice(-2));
}

export function resolveEffectivePolicy(
  policies: UtilityPolicyInput[],
  billingPeriod: string,
  scopeOrder: Array<UtilityPolicyInput['scopeType']>,
  scopeIds: Record<UtilityPolicyInput['scopeType'], number | null>,
): { policy: UtilityPolicyInput | null; sourceType: UtilitySnapshotResult['policySourceType'] } {
  const periodDate = new Date(`${billingPeriod}-01T00:00:00.000Z`);

  for (const scopeType of scopeOrder) {
    const matched = policies
      .filter((policy) => {
        if (policy.scopeType !== scopeType) return false;
        if (scopeType !== 'system' && policy.scopeId !== scopeIds[scopeType]) return false;
        const from = new Date(`${policy.effectiveFrom}T00:00:00.000Z`);
        const to = policy.effectiveTo ? new Date(`${policy.effectiveTo}T23:59:59.999Z`) : null;
        return from <= periodDate && (!to || to >= periodDate);
      })
      .sort((left, right) => right.effectiveFrom.localeCompare(left.effectiveFrom));

    if (matched[0]) {
      return {
        policy: matched[0],
        sourceType: scopeType,
      };
    }
  }

  return { policy: null, sourceType: 'system' };
}

function roundToIncrement(value: number, increment: number): number {
  if (increment <= 0) return Math.round(value);
  return Math.round(value / increment) * increment;
}

function getPeriodBounds(billingPeriod: string): { start: Date; end: Date; daysInPeriod: number } {
  const [year, month] = billingPeriod.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  const daysInPeriod = end.getUTCDate();
  return { start, end, daysInPeriod };
}

function computeOccupiedDays(contractStartDate: string, contractEndDate: string, billingPeriod: string) {
  const { start, end, daysInPeriod } = getPeriodBounds(billingPeriod);
  const occupiedStart = new Date(Math.max(start.getTime(), new Date(`${contractStartDate}T00:00:00.000Z`).getTime()));
  const occupiedEnd = new Date(Math.min(end.getTime(), new Date(`${contractEndDate}T00:00:00.000Z`).getTime()));

  if (occupiedEnd < occupiedStart) {
    return {
      periodStart: start,
      periodEnd: end,
      occupiedDays: 0,
      daysInPeriod,
      prorateRatio: 0,
    };
  }

  const occupiedDays = Math.floor((occupiedEnd.getTime() - occupiedStart.getTime()) / 86400000) + 1;

  return {
    periodStart: start,
    periodEnd: end,
    occupiedDays,
    daysInPeriod,
    prorateRatio: occupiedDays / daysInPeriod,
  };
}

export function computeUtilitySnapshot(input: UtilityComputationInput): UtilitySnapshotResult {
  const { periodStart, periodEnd, occupiedDays, daysInPeriod, prorateRatio } = computeOccupiedDays(
    input.contractStartDate,
    input.contractEndDate,
    input.billingPeriod,
  );

  if (occupiedDays <= 0) {
    throw new Error(`Contract does not overlap billing period ${input.billingPeriod}.`);
  }

  const override = input.override ?? null;
  const seasonMonths = override?.seasonMonthsOverride?.length
    ? override.seasonMonthsOverride
    : input.policy.seasonMonths;
  const month = input.billingPeriod.slice(5, 7);
  const isHotSeason = seasonMonths.includes(month);
  const electricSeasonMultiplier = isHotSeason
    ? toFiniteNumber(
        override?.electricHotSeasonMultiplierOverride,
        input.policy.electricHotSeasonMultiplier,
      )
    : 1;
  const locationMultiplier = toFiniteNumber(
    override?.locationMultiplierOverride,
    input.policy.locationMultiplier,
  );
  const roomAmenityDeviceCodes = extractDeviceCodes(input.roomAmenities);
  const roomAssetDeviceCodes = extractRoomAssetDeviceCodes(input.roomAssets);
  const deviceCodes = Array.from(new Set([...roomAmenityDeviceCodes, ...roomAssetDeviceCodes]));
  const resolvedDeviceSurcharges = input.deviceAdjustments
    .filter((adjustment) => deviceCodes.includes(adjustment.deviceCode))
    .map((adjustment) => ({
      deviceCode: adjustment.deviceCode,
      chargeAmount: toFiniteNumber(adjustment.chargeAmount),
    }));
  const electricDeviceSurcharge = resolvedDeviceSurcharges.reduce((sum, item) => sum + item.chargeAmount, 0);
  const electricBaseAmount = Math.max(
    0,
    toFiniteNumber(override?.electricBaseOverride, input.policy.electricBaseAmount),
  );
  const waterBaseAmount = Math.max(
    0,
    toFiniteNumber(override?.waterBaseOverride, input.policy.waterBaseAmount),
  );
  const waterPerPersonAmount = Math.max(0, toFiniteNumber(input.policy.waterPerPersonAmount));
  const waterPersonCharge = waterPerPersonAmount * input.occupantsForBilling;
  const electricSubtotal = electricBaseAmount + electricDeviceSurcharge;
  const electricRawAmount = Number((electricSubtotal * electricSeasonMultiplier * locationMultiplier * prorateRatio).toFixed(6));
  const electricRoundedAmount = roundToIncrement(electricRawAmount, input.policy.roundingIncrement);
  const electricFinalAmount = override?.electricFinalOverride != null
    ? Math.max(0, toFiniteNumber(override.electricFinalOverride))
    : Math.max(input.policy.minElectricFloor, electricRoundedAmount);

  const waterSubtotal = waterBaseAmount + waterPersonCharge;
  const waterRawAmount = Number((waterSubtotal * locationMultiplier * prorateRatio).toFixed(6));
  const waterRoundedAmount = roundToIncrement(waterRawAmount, input.policy.roundingIncrement);
  const waterFinalAmount = override?.waterFinalOverride != null
    ? Math.max(0, toFiniteNumber(override.waterFinalOverride))
    : Math.max(input.policy.minWaterFloor, waterRoundedAmount);

  const warnings: UtilityWarning[] = [];

  if (electricRoundedAmount < input.policy.minElectricFloor && override?.electricFinalOverride == null) {
    warnings.push({
      code: 'electric_below_floor',
      message: 'Tiền điện sau làm tròn thấp hơn mức sàn nên hệ thống nâng lên mức sàn.',
      metadata: {
        roundedAmount: electricRoundedAmount,
        floor: input.policy.minElectricFloor,
      },
    });
  }

  if (waterRoundedAmount < input.policy.minWaterFloor && override?.waterFinalOverride == null) {
    warnings.push({
      code: 'water_below_floor',
      message: 'Tiền nước sau làm tròn thấp hơn mức sàn nên hệ thống nâng lên mức sàn.',
      metadata: {
        roundedAmount: waterRoundedAmount,
        floor: input.policy.minWaterFloor,
      },
    });
  }

  if (input.policySourceType === 'system') {
    warnings.push({
      code: 'policy_fallback_system',
      message: 'Không tìm thấy chính sách ở phạm vi thấp hơn nên hệ thống dùng chính sách toàn hệ thống.',
    });
  }

  if (input.occupantsForBilling <= 0) {
    warnings.push({
      code: 'missing_occupants_for_billing',
      message: 'Hợp đồng chưa có số người tính phí hợp lệ.',
    });
  }

  if (deviceCodes.length > 0 && resolvedDeviceSurcharges.length === 0) {
    warnings.push({
      code: 'device_surcharge_missing',
      message: 'Phòng có thiết bị phù hợp nhưng chính sách chưa khai báo phụ phí tương ứng.',
      metadata: { deviceCodes },
    });
  }

  return {
    roomId: input.roomId,
    billingRunId: input.billingRunId ?? null,
    overrideId: input.override?.id ?? null,
    resolvedPolicyId: input.resolvedPolicyId,
    policySourceType: override ? 'invoice_override' : input.policySourceType,
    periodStart: periodStart.toISOString().slice(0, 10),
    periodEnd: periodEnd.toISOString().slice(0, 10),
    occupantsForBilling: input.occupantsForBilling,
    occupiedDays,
    daysInPeriod,
    prorateRatio,
    electricBaseAmount,
    electricDeviceSurcharge,
    electricSubtotal,
    electricSeasonMultiplier,
    electricLocationMultiplier: locationMultiplier,
    electricRawAmount,
    electricRoundedAmount,
    minElectricFloor: input.policy.minElectricFloor,
    electricFinalAmount,
    waterBaseAmount,
    waterPerPersonAmount,
    waterPersonCharge,
    waterSubtotal,
    waterLocationMultiplier: locationMultiplier,
    waterRawAmount,
    waterRoundedAmount,
    minWaterFloor: input.policy.minWaterFloor,
    waterFinalAmount,
    roundingIncrement: input.policy.roundingIncrement,
    resolvedDeviceSurcharges,
    warnings,
    formulaSnapshot: {
      billingPeriod: input.billingPeriod,
      isHotSeason,
      seasonMonths,
      deviceCodes,
      roomAmenityDeviceCodes,
      roomAssetDeviceCodes,
      overrideApplied: override,
      policy: input.policy,
    },
  };
}
