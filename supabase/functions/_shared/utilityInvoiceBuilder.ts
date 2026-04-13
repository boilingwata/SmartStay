/// <reference path="./deno-globals.d.ts" />

import type { SupabaseClient } from './supabaseAdmin.ts';
import {
  computeUtilitySnapshot,
  parseSeasonMonths,
  readTermsOccupants,
  resolveEffectivePolicy,
  type UtilityDeviceAdjustmentInput,
  type UtilityOverrideInput,
  type UtilityPolicyInput,
} from './utilityBilling.ts';

export interface BuildUtilityInvoiceInput {
  contractId: number;
  billingPeriod: string;
  dueDate: string;
  discountAmount?: number;
  discountReason?: string | null;
  note?: string | null;
  billingRunId?: number | null;
}

export interface BuiltUtilityInvoicePayload {
  contractId: number;
  contractCode: string;
  roomId: number;
  billingPeriod: string;
  dueDate: string;
  subtotal: number;
  totalAmount: number;
  note: string | null;
  items: Array<Record<string, unknown>>;
  snapshotPayload: Record<string, unknown>;
}

interface ContractInvoiceRow {
  id: number;
  contract_code: string;
  room_id: number;
  start_date: string;
  end_date: string;
  terms: unknown;
  monthly_rent: number | null;
  rooms: {
    room_code: string;
    building_id: number;
    amenities: unknown;
    buildings: { name: string } | null;
  } | null;
  contract_tenants: Array<{
    is_primary: boolean | null;
    tenants: { full_name: string } | null;
  }>;
  contract_services: Array<{
    service_id: number;
    quantity: number | null;
    fixed_price: number | null;
    services: {
      name: string;
      calc_type: string | null;
    } | null;
  }>;
}

interface UtilityPolicyRow {
  id: number;
  scope_type: UtilityPolicyInput['scopeType'];
  scope_id: number | null;
  electric_base_amount: number;
  water_base_amount: number;
  water_per_person_amount: number;
  electric_hot_season_multiplier: number;
  location_multiplier: number;
  season_months: unknown;
  rounding_increment: number;
  min_electric_floor: number;
  min_water_floor: number;
  effective_from: string;
  effective_to: string | null;
}

interface UtilityOverrideRow {
  id: number;
  occupants_for_billing_override: number | null;
  electric_base_override: number | null;
  electric_final_override: number | null;
  water_base_override: number | null;
  water_final_override: number | null;
  location_multiplier_override: number | null;
  season_months_override: unknown;
  electric_hot_season_multiplier_override: number | null;
}

interface UtilityPolicyDeviceAdjustmentRow {
  device_code: string;
  charge_amount: number | null;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function inferUtilityKind(serviceName: string): 'electricity' | 'water' | null {
  const normalized = normalizeText(serviceName);
  if (normalized.includes('dien') || normalized.includes('electric')) return 'electricity';
  if (normalized.includes('nuoc') || normalized.includes('water')) return 'water';
  return null;
}

export function isLegacyMeteredService(service: ContractInvoiceRow['contract_services'][number]): boolean {
  const serviceName = service.services?.name ?? '';
  return service.services?.calc_type === 'per_unit' && inferUtilityKind(serviceName) != null;
}

export function resolveContractUtilityMode(
  contractServices: ContractInvoiceRow['contract_services'] = [],
): 'policy' | 'legacy_metered' {
  return contractServices.some(isLegacyMeteredService) ? 'legacy_metered' : 'policy';
}

function toPolicyInput(row: UtilityPolicyRow): UtilityPolicyInput {
  return {
    id: Number(row.id),
    scopeType: row.scope_type,
    scopeId: row.scope_id == null ? null : Number(row.scope_id),
    electricBaseAmount: Number(row.electric_base_amount ?? 0),
    waterBaseAmount: Number(row.water_base_amount ?? 0),
    waterPerPersonAmount: Number(row.water_per_person_amount ?? 0),
    electricHotSeasonMultiplier: Number(row.electric_hot_season_multiplier ?? 1.15),
    locationMultiplier: Number(row.location_multiplier ?? 1),
    seasonMonths: parseSeasonMonths(row.season_months),
    roundingIncrement: Number(row.rounding_increment ?? 1000),
    minElectricFloor: Number(row.min_electric_floor ?? 120000),
    minWaterFloor: Number(row.min_water_floor ?? 60000),
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
  };
}

function toOverrideInput(row: UtilityOverrideRow | null): UtilityOverrideInput | null {
  if (!row) return null;
  return {
    id: Number(row.id),
    occupantsForBillingOverride:
      row.occupants_for_billing_override == null ? null : Number(row.occupants_for_billing_override),
    electricBaseOverride: row.electric_base_override == null ? null : Number(row.electric_base_override),
    electricFinalOverride: row.electric_final_override == null ? null : Number(row.electric_final_override),
    waterBaseOverride: row.water_base_override == null ? null : Number(row.water_base_override),
    waterFinalOverride: row.water_final_override == null ? null : Number(row.water_final_override),
    locationMultiplierOverride:
      row.location_multiplier_override == null ? null : Number(row.location_multiplier_override),
    seasonMonthsOverride: parseSeasonMonths(row.season_months_override),
    electricHotSeasonMultiplierOverride:
      row.electric_hot_season_multiplier_override == null
        ? null
        : Number(row.electric_hot_season_multiplier_override),
  };
}

export async function buildUtilityInvoicePayload(
  db: SupabaseClient,
  input: BuildUtilityInvoiceInput,
): Promise<BuiltUtilityInvoicePayload> {
  const { data: contract, error: contractError } = await db
    .from('contracts')
    .select(`
      id,
      contract_code,
      room_id,
      start_date,
      end_date,
      terms,
      monthly_rent,
      rooms (
        room_code,
        building_id,
        amenities,
        buildings ( name )
      ),
      contract_tenants (
        is_primary,
        tenants ( full_name )
      ),
      contract_services (
        service_id,
        quantity,
        fixed_price,
        services ( name, calc_type )
      )
    `)
    .eq('id', input.contractId)
    .eq('status', 'active')
    .eq('is_deleted', false)
    .single();

  if (contractError || !contract) {
    throw new Error(contractError?.message ?? 'Contract not found');
  }

  const typedContract = contract as unknown as ContractInvoiceRow;
  const room = typedContract.rooms;
  if (!room) {
    throw new Error('Room not found for this contract');
  }

  if (resolveContractUtilityMode(typedContract.contract_services ?? []) === 'legacy_metered') {
    throw new Error('Contract uses legacy metered utility flow and is not eligible for policy utility billing');
  }

  const { data: policies, error: policyError } = await db
    .from('utility_policies')
    .select(`
      id,
      scope_type,
      scope_id,
      electric_base_amount,
      water_base_amount,
      water_per_person_amount,
      electric_hot_season_multiplier,
      location_multiplier,
      season_months,
      rounding_increment,
      min_electric_floor,
      min_water_floor,
      effective_from,
      effective_to
    `)
    .eq('is_active', true);

  if (policyError) {
    throw new Error(policyError.message);
  }

  const { data: overrideRow, error: overrideError } = await db
    .from('invoice_utility_overrides')
    .select(`
      id,
      occupants_for_billing_override,
      electric_base_override,
      electric_final_override,
      water_base_override,
      water_final_override,
      location_multiplier_override,
      season_months_override,
      electric_hot_season_multiplier_override
    `)
    .eq('contract_id', input.contractId)
    .eq('billing_period', input.billingPeriod)
    .maybeSingle();

  if (overrideError) {
    throw new Error(overrideError.message);
  }

  const resolved = resolveEffectivePolicy(
    ((policies ?? []) as unknown as UtilityPolicyRow[]).map((row) => toPolicyInput(row)),
    input.billingPeriod,
    ['contract', 'room', 'building', 'system'],
    {
      contract: input.contractId,
      room: Number(typedContract.room_id),
      building: Number(room.building_id),
      system: null,
    },
  );

  if (!resolved.policy) {
    throw new Error('No active utility policy found for this contract');
  }

  const { data: deviceRows, error: deviceError } = await db
    .from('utility_policy_device_adjustments')
    .select('device_code, charge_amount')
    .eq('utility_policy_id', resolved.policy.id)
    .eq('is_active', true);

  if (deviceError) {
    throw new Error(deviceError.message);
  }

  const deviceAdjustments: UtilityDeviceAdjustmentInput[] =
    ((deviceRows ?? []) as unknown as UtilityPolicyDeviceAdjustmentRow[]).map((row) => ({
      deviceCode: String(row.device_code),
      chargeAmount: Number(row.charge_amount ?? 0),
    }));

  const contractTenants = typedContract.contract_tenants ?? [];
  const primaryTenant = contractTenants.find((item) => Boolean(item.is_primary)) ?? contractTenants[0];
  const override = toOverrideInput((overrideRow ?? null) as unknown as UtilityOverrideRow | null);

  const utilitySnapshot = computeUtilitySnapshot({
    billingPeriod: input.billingPeriod,
    roomId: Number(typedContract.room_id),
    policySourceType: resolved.sourceType,
    resolvedPolicyId: resolved.policy.id,
    overrideId: override?.id ?? null,
    billingRunId: input.billingRunId ?? null,
    contractStartDate: typedContract.start_date,
    contractEndDate: typedContract.end_date,
    occupantsForBilling:
      override?.occupantsForBillingOverride ??
      readTermsOccupants(typedContract.terms) ??
      contractTenants.length,
    roomAmenities: room.amenities,
    policy: resolved.policy,
    override,
    deviceAdjustments,
  });

  const items: Array<Record<string, unknown>> = [];
  let sortOrder = 1;
  const monthlyRent = Number(typedContract.monthly_rent ?? 0);

  if (monthlyRent > 0) {
    items.push({
      description: `Ti\u1ec1n thu\u00ea th\u00e1ng ${input.billingPeriod}`,
      quantity: 1,
      unitPrice: monthlyRent,
      lineTotal: monthlyRent,
      sortOrder: sortOrder++,
    });
  }

  for (const service of typedContract.contract_services ?? []) {
    const serviceName = String(service.services?.name ?? `D\u1ecbch v\u1ee5 #${service.service_id}`);
    if (inferUtilityKind(serviceName)) continue;

    const quantity = Math.max(1, Number(service.quantity ?? 1));
    const unitPrice = Number(service.fixed_price ?? 0);
    items.push({
      description: `${serviceName} th\u00e1ng ${input.billingPeriod}`,
      quantity,
      unitPrice,
      lineTotal: quantity * unitPrice,
      sortOrder: sortOrder++,
    });
  }

  items.push({
    description: `Ti\u1ec1n \u0111i\u1ec7n th\u00e1ng ${input.billingPeriod}`,
    quantity: 1,
    unitPrice: utilitySnapshot.electricFinalAmount,
    lineTotal: utilitySnapshot.electricFinalAmount,
    sortOrder: sortOrder++,
  });

  items.push({
    description: `Ti\u1ec1n n\u01b0\u1edbc th\u00e1ng ${input.billingPeriod}`,
    quantity: 1,
    unitPrice: utilitySnapshot.waterFinalAmount,
    lineTotal: utilitySnapshot.waterFinalAmount,
    sortOrder: sortOrder++,
  });

  const normalizedDiscount = Math.max(0, Number(input.discountAmount ?? 0));
  if (normalizedDiscount > 0) {
    items.push({
      description: input.discountReason?.trim()
        ? `Gi\u1ea3m tr\u1eeb: ${input.discountReason.trim()}`
        : 'Gi\u1ea3m tr\u1eeb h\u00f3a \u0111\u01a1n',
      quantity: 1,
      unitPrice: -normalizedDiscount,
      lineTotal: -normalizedDiscount,
      sortOrder: sortOrder++,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + Number(item.lineTotal ?? 0), 0);
  if (subtotal < 0) {
    throw new Error('Discount cannot exceed invoice subtotal');
  }

  return {
    contractId: input.contractId,
    contractCode: typedContract.contract_code,
    roomId: Number(typedContract.room_id),
    billingPeriod: input.billingPeriod,
    dueDate: input.dueDate,
    subtotal,
    totalAmount: subtotal,
    note: input.note ?? null,
    items,
    snapshotPayload: {
      roomId: Number(typedContract.room_id),
      resolvedPolicyId: utilitySnapshot.resolvedPolicyId,
      overrideId: utilitySnapshot.overrideId,
      billingRunId: utilitySnapshot.billingRunId,
      policySourceType: utilitySnapshot.policySourceType,
      periodStart: utilitySnapshot.periodStart,
      periodEnd: utilitySnapshot.periodEnd,
      occupantsForBilling: utilitySnapshot.occupantsForBilling,
      occupiedDays: utilitySnapshot.occupiedDays,
      daysInPeriod: utilitySnapshot.daysInPeriod,
      prorateRatio: utilitySnapshot.prorateRatio,
      electricBaseAmount: utilitySnapshot.electricBaseAmount,
      electricDeviceSurcharge: utilitySnapshot.electricDeviceSurcharge,
      electricSubtotal: utilitySnapshot.electricSubtotal,
      electricSeasonMultiplier: utilitySnapshot.electricSeasonMultiplier,
      electricLocationMultiplier: utilitySnapshot.electricLocationMultiplier,
      electricRawAmount: utilitySnapshot.electricRawAmount,
      electricRoundedAmount: utilitySnapshot.electricRoundedAmount,
      minElectricFloor: utilitySnapshot.minElectricFloor,
      electricFinalAmount: utilitySnapshot.electricFinalAmount,
      waterBaseAmount: utilitySnapshot.waterBaseAmount,
      waterPerPersonAmount: utilitySnapshot.waterPerPersonAmount,
      waterPersonCharge: utilitySnapshot.waterPersonCharge,
      waterSubtotal: utilitySnapshot.waterSubtotal,
      waterLocationMultiplier: utilitySnapshot.waterLocationMultiplier,
      waterRawAmount: utilitySnapshot.waterRawAmount,
      waterRoundedAmount: utilitySnapshot.waterRoundedAmount,
      minWaterFloor: utilitySnapshot.minWaterFloor,
      waterFinalAmount: utilitySnapshot.waterFinalAmount,
      roundingIncrement: utilitySnapshot.roundingIncrement,
      resolvedDeviceSurcharges: utilitySnapshot.resolvedDeviceSurcharges,
      warnings: utilitySnapshot.warnings,
      formulaSnapshot: {
        ...utilitySnapshot.formulaSnapshot,
        contractCode: typedContract.contract_code,
        tenantName: primaryTenant?.tenants?.full_name ?? null,
        buildingName: room.buildings?.name ?? null,
      },
    },
  };
}
