import { buildBillableAssetLines } from '@/lib/assetBilling';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import {
  computeUtilitySnapshot,
  parseSeasonMonths,
  resolveEffectivePolicy,
  type UtilityDeviceAdjustmentInput,
  type UtilityOverrideInput,
  type UtilityPolicyInput,
  type UtilitySnapshotResult,
} from '@/lib/utilityBilling';

export interface UtilityBillingLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  itemType: 'rent' | 'utility_electric' | 'utility_water' | 'service' | 'asset' | 'discount' | 'other';
  source: 'rent' | 'service' | 'utility' | 'asset' | 'discount';
  sortOrder: number;
  sourceRefType?: string;
  sourceRefId?: number;
}

export interface PolicyInvoiceDraft {
  contractId: string;
  contractCode: string;
  roomId: string;
  roomCode: string;
  buildingId: string;
  buildingName: string;
  tenantName: string;
  billingPeriod: string;
  dueDate: string;
  items: UtilityBillingLineItem[];
  subtotal: number;
  totalAmount: number;
  missingUtilityItems: string[];
  note?: string;
  utilitySnapshot: UtilitySnapshotResult;
}

interface DraftInput {
  contractId: string;
  monthYear: string;
  dueDate: string;
  discountAmount?: number;
  discountReason?: string;
  note?: string;
}

interface ContractDraftRow {
  id: number;
  contract_code: string;
  room_id: number;
  start_date: string;
  end_date: string;
  occupants_for_billing: number;
  utility_policy_id: number | null;
  monthly_rent: number | null;
  rooms: {
    room_code: string;
    building_id: number;
    amenities: unknown;
    max_occupants: number | null;
    buildings: { name: string } | null;
      room_assets?: Array<{
      id: number;
      status: string | null;
      quantity: number | null;
      assigned_at: string | null;
      is_billable: boolean | null;
      billing_label: string | null;
      monthly_charge: number | null;
      billing_start_date: string | null;
        billing_end_date: string | null;
        billing_status: string | null;
        assets: {
          name: string;
          category: string | null;
        } | null;
      }> | null;
  } | null;
  contract_tenants: Array<{
    is_primary: boolean | null;
    tenants: { full_name: string } | null;
  }>;
  contract_services: Array<{
    service_catalog_id: number;
    quantity: number | null;
    fixed_price: number | null;
    service_catalog: {
      name: string;
      unit: string | null;
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

function toPolicyInput(row: UtilityPolicyRow): UtilityPolicyInput {
  return {
    id: row.id,
    scopeType: row.scope_type,
    scopeId: row.scope_id,
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
    id: row.id,
    occupantsForBillingOverride: row.occupants_for_billing_override,
    electricBaseOverride: row.electric_base_override,
    electricFinalOverride: row.electric_final_override,
    waterBaseOverride: row.water_base_override,
    waterFinalOverride: row.water_final_override,
    locationMultiplierOverride: row.location_multiplier_override,
    seasonMonthsOverride: parseSeasonMonths(row.season_months_override),
    electricHotSeasonMultiplierOverride: row.electric_hot_season_multiplier_override,
  };
}

async function fetchContractDraft(contractId: number): Promise<ContractDraftRow> {
  return (await unwrap(
    (supabase as any)
      .from('contracts')
      .select(`
        id,
        contract_code,
        room_id,
        start_date,
        end_date,
        occupants_for_billing,
        utility_policy_id,
        monthly_rent,
        rooms (
          room_code,
          building_id,
          amenities,
          max_occupants,
          buildings ( name ),
          room_assets (
            id,
            status,
            quantity,
            assigned_at,
            is_billable,
            billing_label,
            monthly_charge,
            billing_start_date,
            billing_end_date,
            billing_status,
      assets ( name, category )
          )
        ),
        contract_tenants (
          is_primary,
          tenants ( full_name )
        ),
        contract_services (
          service_catalog_id,
          quantity,
          fixed_price,
          service_catalog!contract_services_service_catalog_id_fkey ( name, unit )
        )
      `)
      .eq('id', contractId)
      .eq('status', 'active')
      .eq('is_deleted', false)
      .single()
  )) as ContractDraftRow;
}

async function fetchPolicies(): Promise<UtilityPolicyInput[]> {
  const rows = (await unwrap(
    supabase
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
      .eq('is_active', true)
  )) as UtilityPolicyRow[];

  return rows.map(toPolicyInput);
}

async function fetchOverride(contractId: number, billingPeriod: string): Promise<UtilityOverrideInput | null> {
  const row = (await unwrap(
    supabase
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
      .eq('contract_id', contractId)
      .eq('billing_period', billingPeriod)
      .maybeSingle()
  )) as UtilityOverrideRow | null;

  return toOverrideInput(row);
}

async function fetchDeviceAdjustments(policyId: number): Promise<UtilityDeviceAdjustmentInput[]> {
  const rows = (await unwrap(
    supabase
      .from('utility_policy_device_adjustments')
      .select('device_code, charge_amount')
      .eq('utility_policy_id', policyId)
      .eq('is_active', true)
  )) as Array<{ device_code: string; charge_amount: number }>;

  return rows.map((row) => ({
    deviceCode: row.device_code,
    chargeAmount: Number(row.charge_amount ?? 0),
  }));
}

export function inferUtilityKind(_serviceName: string): 'electricity' | 'water' | null {
  return null;
}

export function isLegacyMeteredService(): boolean {
  return false;
}

export function resolveContractUtilityMode(): 'policy' | 'legacy_metered' {
  return 'policy';
}

export async function buildPolicyInvoiceDraft(input: DraftInput): Promise<PolicyInvoiceDraft> {
  const contractId = Number(input.contractId);
  if (!Number.isFinite(contractId)) throw new Error('Hop dong khong hop le.');
  if (!/^\d{4}-\d{2}$/.test(input.monthYear)) throw new Error('Ky thanh toan khong hop le.');
  if (!input.dueDate) throw new Error('Vui long chon han thanh toan.');

  const contract = await fetchContractDraft(contractId);
  const policies = await fetchPolicies();
  const override = await fetchOverride(contractId, input.monthYear);
  const room = contract.rooms;

  if (!room) throw new Error('Khong tim thay phong cua hop dong.');

  const pinnedPolicy =
    contract.utility_policy_id == null
      ? null
      : policies.find((policy) => policy.id === contract.utility_policy_id) ?? null;

  const policyResolution = pinnedPolicy
    ? { policy: pinnedPolicy, sourceType: 'contract' as const }
    : resolveEffectivePolicy(policies, input.monthYear, ['contract', 'room', 'building', 'system'], {
        contract: contract.id,
        room: contract.room_id,
        building: room.building_id,
        system: null,
      });

  if (!policyResolution.policy) {
    throw new Error('Thieu utility policy de tinh hoa don.');
  }

  const primaryTenant = contract.contract_tenants.find((item) => item.is_primary) ?? contract.contract_tenants[0];
  const tenantName = primaryTenant?.tenants?.full_name ?? '';
  const occupantsForBilling = override?.occupantsForBillingOverride ?? Number(contract.occupants_for_billing ?? 0);
  if (!Number.isFinite(occupantsForBilling) || occupantsForBilling <= 0) {
    throw new Error('Hop dong thieu occupants_for_billing hop le.');
  }

  const deviceAdjustments = await fetchDeviceAdjustments(policyResolution.policy.id);
  const utilitySnapshot = computeUtilitySnapshot({
    billingPeriod: input.monthYear,
    roomId: contract.room_id,
    policySourceType: policyResolution.sourceType,
    resolvedPolicyId: policyResolution.policy.id,
    overrideId: override?.id ?? null,
    contractStartDate: contract.start_date,
    contractEndDate: contract.end_date,
    occupantsForBilling,
      roomAmenities: room.amenities,
      roomAssets: (room.room_assets ?? []).map((asset) => ({
        assetName: asset.assets?.name ?? null,
        assetType: asset.assets?.category ?? null,
        billingLabel: asset.billing_label ?? null,
      })),
      policy: policyResolution.policy,
      override,
      deviceAdjustments,
  });

  const items: UtilityBillingLineItem[] = [];
  let sortOrder = 1;
  const monthlyRent = Number(contract.monthly_rent ?? 0);

  if (monthlyRent > 0) {
    items.push({
      description: `Tien thue thang ${input.monthYear}`,
      quantity: 1,
      unitPrice: monthlyRent,
      lineTotal: monthlyRent,
      itemType: 'rent',
      source: 'rent',
      sortOrder: sortOrder++,
    });
  }

  for (const service of contract.contract_services ?? []) {
    const serviceName = service.service_catalog?.name ?? `Dich vu #${service.service_catalog_id}`;
    const quantity = Math.max(1, Number(service.quantity ?? 1));
    const unitPrice = Number(service.fixed_price ?? 0);
    items.push({
      description: `${serviceName} thang ${input.monthYear}`,
      quantity,
      unitPrice,
      lineTotal: quantity * unitPrice,
      itemType: 'service',
      source: 'service',
      sortOrder: sortOrder++,
      sourceRefType: 'contract_service',
      sourceRefId: service.service_catalog_id,
    });
  }

  const assetItems = buildBillableAssetLines({
    monthYear: input.monthYear,
    contractStartDate: contract.start_date,
    contractEndDate: contract.end_date,
    startingSortOrder: sortOrder,
    assets: (room.room_assets ?? []).map((asset) => ({
      id: asset.id,
      assetName: asset.assets?.name ?? `Tai san #${asset.id}`,
      billingLabel: asset.billing_label,
      quantity: asset.quantity,
      monthlyCharge: asset.monthly_charge,
      billingStartDate: asset.billing_start_date,
      billingEndDate: asset.billing_end_date,
      assignedAt: asset.assigned_at,
      isBillable: asset.is_billable,
      billingStatus: asset.billing_status,
      physicalStatus: asset.status,
    })),
  });

  for (const assetItem of assetItems) {
    items.push({
      description: assetItem.description,
      quantity: assetItem.quantity,
      unitPrice: assetItem.unitPrice,
      lineTotal: assetItem.lineTotal,
      itemType: assetItem.itemType,
      source: assetItem.source,
      sortOrder: assetItem.sortOrder,
      sourceRefType: 'room_asset',
      sourceRefId: Number(assetItem.assetId),
    });
  }
  sortOrder += assetItems.length;

  items.push({
    description: `Tien dien thang ${input.monthYear}`,
    quantity: 1,
    unitPrice: utilitySnapshot.electricFinalAmount,
    lineTotal: utilitySnapshot.electricFinalAmount,
    itemType: 'utility_electric',
    source: 'utility',
    sortOrder: sortOrder++,
  });

  items.push({
    description: `Tien nuoc thang ${input.monthYear}`,
    quantity: 1,
    unitPrice: utilitySnapshot.waterFinalAmount,
    lineTotal: utilitySnapshot.waterFinalAmount,
    itemType: 'utility_water',
    source: 'utility',
    sortOrder: sortOrder++,
  });

  const discountAmount = Math.max(0, Number(input.discountAmount ?? 0));
  if (discountAmount > 0) {
    items.push({
      description: input.discountReason?.trim() ? `Giam tru: ${input.discountReason.trim()}` : 'Giam tru hoa don',
      quantity: 1,
      unitPrice: -discountAmount,
      lineTotal: -discountAmount,
      itemType: 'discount',
      source: 'discount',
      sortOrder: sortOrder++,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  if (subtotal < 0) throw new Error('Giam tru khong the lon hon tong tien hoa don.');

  return {
    contractId: String(contract.id),
    contractCode: contract.contract_code,
    roomId: String(contract.room_id),
    roomCode: room.room_code,
    buildingId: String(room.building_id),
    buildingName: room.buildings?.name ?? '',
    tenantName,
    billingPeriod: input.monthYear,
    dueDate: input.dueDate,
    items,
    subtotal,
    totalAmount: subtotal,
    missingUtilityItems: [],
    note: input.note?.trim() || undefined,
    utilitySnapshot,
  };
}
