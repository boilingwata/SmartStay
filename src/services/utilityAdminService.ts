import { FunctionsHttpError } from '@supabase/functions-js';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import type { Json } from '@/types/supabase';

export type UtilityScopeType = 'system' | 'building' | 'room' | 'contract';

export interface UtilityPolicyAdjustmentForm {
  deviceCode: string;
  chargeAmount: number;
  isActive: boolean;
}

export interface UtilityPolicyRecord {
  id: number;
  code: string;
  name: string;
  scopeType: UtilityScopeType;
  scopeId: number | null;
  isActive: boolean;
  description: string | null;
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
  effectiveTo: string | null;
  createdAt: string;
  adjustments: UtilityPolicyAdjustmentForm[];
}

export interface UtilityPolicyFormInput {
  code: string;
  name: string;
  scopeType: UtilityScopeType;
  scopeId: number | null;
  description?: string | null;
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
  adjustments: UtilityPolicyAdjustmentForm[];
}

export interface UtilityScopeOption {
  value: number;
  label: string;
}

export interface UtilityOverrideRecord {
  id: number;
  contractId: number;
  contractCode: string;
  roomCode: string;
  billingPeriod: string;
  reason: string;
  occupantsForBillingOverride: number | null;
  electricBaseOverride: number | null;
  electricFinalOverride: number | null;
  waterBaseOverride: number | null;
  waterFinalOverride: number | null;
  locationMultiplierOverride: number | null;
  seasonMonthsOverride: string[];
  electricHotSeasonMultiplierOverride: number | null;
  createdAt: string;
}

export interface UtilityOverrideFormInput {
  contractId: number;
  billingPeriod: string;
  reason: string;
  occupantsForBillingOverride?: number | null;
  electricBaseOverride?: number | null;
  electricFinalOverride?: number | null;
  waterBaseOverride?: number | null;
  waterFinalOverride?: number | null;
  locationMultiplierOverride?: number | null;
  seasonMonthsOverride?: string[] | null;
  electricHotSeasonMultiplierOverride?: number | null;
}

export interface BillingRunRecord {
  id: number;
  billingPeriod: string;
  status: 'draft' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string | null;
  completedAt: string | null;
  lockVersion: number;
  summary: Record<string, unknown>;
  error: Record<string, unknown>;
  createdAt: string;
}

export interface BillingRunPreview {
  billingPeriod: string;
  dueDate: string;
  totalContracts: number;
  validContracts: number;
  skippedContracts: number;
  existingInvoices: number;
  eligibleContracts: Array<{ contractId: number; contractCode: string }>;
  existingInvoiceContracts: Array<{ contractId: number; contractCode: string }>;
  ineligibleContracts: Array<{ contractId: number; contractCode: string; reason: string }>;
  diagnostics: {
    billingPeriodStart: string;
    billingPeriodEnd: string;
    totalContracts: number;
    validContracts: number;
    skippedContracts: number;
    existingInvoiceContracts: number;
    eligibleContracts: number;
  };
}

export interface BillingRunExecutionResult {
  status: string;
  billingRunId?: number;
  billingPeriod: string;
  dueDate: string;
  totalContracts: number;
  validContracts: number;
  skippedContracts: number;
  createdInvoices: number;
  skippedInvoices: number;
  failedInvoices: number;
  failures: Array<{ contractId: number; contractCode: string; message: string }>;
  ineligibleContracts: Array<{ contractId: number; contractCode: string; reason: string }>;
  existingInvoiceContracts?: Array<{ contractId: number; contractCode: string }>;
}

export interface BillingRunSnapshotRecord {
  id: number;
  contractCode: string;
  roomCode: string;
  billingPeriod: string;
  electricFinalAmount: number;
  waterFinalAmount: number;
  occupantsForBilling: number;
  occupiedDays: number;
  warnings: Array<{ code: string; message: string }>;
  policySourceType: string;
  createdAt: string;
}

interface PolicyRow {
  id: number;
  code: string;
  name: string;
  scope_type: UtilityScopeType;
  scope_id: number | null;
  is_active: boolean;
  description: string | null;
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
  created_at: string;
}

interface AdjustmentRow {
  id: number;
  utility_policy_id: number;
  device_code: string;
  charge_amount: number;
  is_active: boolean;
}

interface RunUtilityBillingPayload {
  trigger: 'manual' | 'cron';
  dryRun: boolean;
  billingPeriod: string;
  dueDate: string | null;
}

interface EdgeFunctionErrorBody {
  error?: string;
  message?: string;
  success?: boolean;
}

const DEFAULT_DEVICE_CODES = ['aircon', 'electric_stove', 'water_heater', 'dryer', 'freezer'];

function parseSeasonMonths(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.padStart(2, '0').slice(-2));
}

function isAuthErrorMessage(message: string): boolean {
  return (
    message.includes('401') ||
    message.includes('unauthorized') ||
    message.includes('unsupported jwt algorithm') ||
    message.includes('invalid token') ||
    message.includes('expired token') ||
    message.includes('jwt') ||
    message.includes('authentication')
  );
}

async function validateSession(session: Session | null): Promise<Session> {
  if (!session?.access_token) {
    throw new Error('Khong tim thay access token de goi utility billing.');
  }

  const activeSession = session as Session;

  const { data: userData, error: userError } = await supabase.auth.getUser(activeSession.access_token);
  if (userError || !userData.user) {
    throw new Error('Supabase Auth khong xac nhan duoc access token hien tai cho utility billing.');
  }

  return activeSession;
}

async function requireActiveSession(): Promise<Session> {
  const { data, error } = await supabase.auth.getSession();
  if (!error && data.session?.access_token) {
    try {
      return await validateSession(data.session);
    } catch {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError && refreshData.session?.access_token) {
        return validateSession(refreshData.session);
      }
    }
  }

  throw new Error('Khong lay duoc access token hop le de goi utility billing.');
}

async function getEdgeFunctionMessage(error: Error): Promise<string> {
  const message = error.message.toLowerCase();
  const status =
    error instanceof FunctionsHttpError && error.context instanceof Response
      ? error.context.status
      : null;

  let responseBodyMessage: string | null = null;
  if (error instanceof FunctionsHttpError && error.context instanceof Response) {
    try {
      const json = (await error.context.clone().json()) as EdgeFunctionErrorBody;
      responseBodyMessage = json.error ?? json.message ?? null;
    } catch {
      try {
        responseBodyMessage = await error.context.clone().text();
      } catch {
        responseBodyMessage = null;
      }
    }
  }

  if (status === 401) {
    if ((responseBodyMessage ?? '').toLowerCase().includes('unsupported jwt algorithm')) {
      return `Utility billing bi tu choi xac thuc (401): ${responseBodyMessage}. Edge function dang bi verify_jwt o layer Supabase thay vi custom auth, can deploy lai voi verify_jwt=false.`;
    }
    return responseBodyMessage
      ? `Utility billing bi tu choi xac thuc (401): ${responseBodyMessage}`
      : 'Utility billing bi tu choi xac thuc (401).';
  }

  if (status === 403) {
    return responseBodyMessage
      ? `Tai khoan hien tai khong du quyen chay utility billing (403): ${responseBodyMessage}`
      : 'Tai khoan hien tai khong du quyen chay utility billing (403).';
  }

  if (isAuthErrorMessage(message)) {
    return responseBodyMessage ?? 'Utility billing tra ve loi xac thuc tu Supabase.';
  }

  if (message.includes('non-2xx')) {
    return responseBodyMessage
      ? `Khong the chay utility billing: ${responseBodyMessage}`
      : 'Khong the chay utility billing vi edge function tra ve non-2xx.';
  }

  return responseBodyMessage ?? error.message;
}

async function invokeRunUtilityBilling<T>(payload: RunUtilityBillingPayload): Promise<T> {
  const session = await requireActiveSession();

  const attemptInvoke = async (accessToken: string) =>
    supabase.functions.invoke('run-utility-billing', {
      body: payload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

  let { data, error } = await attemptInvoke(session.access_token);

  if (error && isAuthErrorMessage(error.message.toLowerCase())) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshData.session?.access_token) {
      throw new Error('Supabase Auth khong cap lai duoc access token cho utility billing.');
    }

    const refreshedSession = refreshData.session as Session;
    ({ data, error } = await attemptInvoke(refreshedSession.access_token));
  }

  if (error) {
    throw new Error(await getEdgeFunctionMessage(error));
  }

  return data as T;
}

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export const utilityAdminService = {
  getPolicyScopeOptions: async (): Promise<Record<Exclude<UtilityScopeType, 'system'>, UtilityScopeOption[]>> => {
    const [buildings, rooms, contracts] = await Promise.all([
      unwrap(supabase.from('buildings').select('id, name').eq('is_deleted', false).order('name')),
      unwrap(supabase.from('rooms').select('id, room_code').eq('is_deleted', false).order('room_code')),
      unwrap(
        supabase
          .from('contracts')
          .select('id, contract_code')
          .eq('is_deleted', false)
          .eq('status', 'active')
          .order('contract_code'),
      ),
    ]) as [
      Array<{ id: number; name: string }>,
      Array<{ id: number; room_code: string }>,
      Array<{ id: number; contract_code: string }>,
    ];

    return {
      building: buildings.map((item) => ({ value: item.id, label: item.name })),
      room: rooms.map((item) => ({ value: item.id, label: item.room_code })),
      contract: contracts.map((item) => ({ value: item.id, label: item.contract_code })),
    };
  },

  listPolicies: async (): Promise<UtilityPolicyRecord[]> => {
    const [policies, adjustments] = await Promise.all([
      unwrap(
        supabase
          .from('utility_policies')
          .select(`
            id, code, name, scope_type, scope_id, is_active, description,
            electric_base_amount, water_base_amount, water_per_person_amount,
            electric_hot_season_multiplier, location_multiplier, season_months,
            rounding_increment, min_electric_floor, min_water_floor,
            effective_from, effective_to, created_at
          `)
          .order('effective_from', { ascending: false })
          .order('created_at', { ascending: false }),
      ),
      unwrap(
        supabase
          .from('utility_policy_device_adjustments')
          .select('id, utility_policy_id, device_code, charge_amount, is_active')
          .order('device_code'),
      ),
    ]) as [PolicyRow[], AdjustmentRow[]];

    return policies.map((policy) => ({
      id: policy.id,
      code: policy.code,
      name: policy.name,
      scopeType: policy.scope_type,
      scopeId: policy.scope_id,
      isActive: policy.is_active,
      description: policy.description,
      electricBaseAmount: Number(policy.electric_base_amount ?? 0),
      waterBaseAmount: Number(policy.water_base_amount ?? 0),
      waterPerPersonAmount: Number(policy.water_per_person_amount ?? 0),
      electricHotSeasonMultiplier: Number(policy.electric_hot_season_multiplier ?? 1.15),
      locationMultiplier: Number(policy.location_multiplier ?? 1),
      seasonMonths: parseSeasonMonths(policy.season_months),
      roundingIncrement: Number(policy.rounding_increment ?? 1000),
      minElectricFloor: Number(policy.min_electric_floor ?? 120000),
      minWaterFloor: Number(policy.min_water_floor ?? 60000),
      effectiveFrom: policy.effective_from,
      effectiveTo: policy.effective_to,
      createdAt: policy.created_at,
      adjustments: adjustments
        .filter((item) => item.utility_policy_id === policy.id)
        .map((item) => ({
          deviceCode: item.device_code,
          chargeAmount: Number(item.charge_amount ?? 0),
          isActive: item.is_active,
        })),
    }));
  },

  createPolicy: async (input: UtilityPolicyFormInput): Promise<number> => {
    const createdBy = await getCurrentUserId();
    const { data, error } = await supabase
      .from('utility_policies')
      .insert({
        code: input.code.trim(),
        name: input.name.trim(),
        scope_type: input.scopeType,
        scope_id: input.scopeType === 'system' ? null : input.scopeId,
        is_active: true,
        description: input.description?.trim() || null,
        electric_base_amount: input.electricBaseAmount,
        water_base_amount: input.waterBaseAmount,
        water_per_person_amount: input.waterPerPersonAmount,
        electric_hot_season_multiplier: input.electricHotSeasonMultiplier,
        location_multiplier: input.locationMultiplier,
        season_months: input.seasonMonths,
        rounding_increment: input.roundingIncrement,
        min_electric_floor: input.minElectricFloor,
        min_water_floor: input.minWaterFloor,
        effective_from: input.effectiveFrom,
        effective_to: input.effectiveTo || null,
        created_by: createdBy,
      })
      .select('id')
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Failed to create utility policy');

    const activeAdjustments = input.adjustments.filter((item) => item.isActive);
    if (activeAdjustments.length > 0) {
      const { error: adjustmentsError } = await supabase
        .from('utility_policy_device_adjustments')
        .insert(
          activeAdjustments.map((item) => ({
            utility_policy_id: data.id,
            device_code: item.deviceCode,
            charge_amount: item.chargeAmount,
            is_active: true,
          })),
        );

      if (adjustmentsError) throw new Error(adjustmentsError.message);
    }

    return data.id;
  },

  setPolicyActiveStatus: async (policyId: number, isActive: boolean): Promise<void> => {
    const { error } = await supabase
      .from('utility_policies')
      .update({ is_active: isActive })
      .eq('id', policyId);

    if (error) throw new Error(error.message);
  },

  getDefaultDeviceAdjustments: (): UtilityPolicyAdjustmentForm[] =>
    DEFAULT_DEVICE_CODES.map((deviceCode) => ({
      deviceCode,
      chargeAmount: 0,
      isActive: false,
    })),

  listOverrides: async (): Promise<UtilityOverrideRecord[]> => {
    const rows = await unwrap(
      supabase
        .from('invoice_utility_overrides')
        .select(`
          id, contract_id, billing_period, reason,
          occupants_for_billing_override, electric_base_override, electric_final_override,
          water_base_override, water_final_override, location_multiplier_override,
          season_months_override, electric_hot_season_multiplier_override, created_at,
          contracts (
            contract_code,
            rooms ( room_code )
          )
        `)
        .order('created_at', { ascending: false }),
    ) as Array<Record<string, unknown>>;

    return rows.map((row) => {
      const contract = row.contracts as Record<string, unknown> | null;
      const room = contract?.rooms as Record<string, unknown> | null;

      return {
        id: Number(row.id),
        contractId: Number(row.contract_id),
        contractCode: String(contract?.contract_code ?? `#${row.contract_id}`),
        roomCode: String(room?.room_code ?? ''),
        billingPeriod: String(row.billing_period),
        reason: String(row.reason ?? ''),
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
        createdAt: String(row.created_at),
      };
    });
  },

  upsertOverride: async (input: UtilityOverrideFormInput): Promise<void> => {
    const createdBy = await getCurrentUserId();
    const existing = await unwrap(
      supabase
        .from('invoice_utility_overrides')
        .select('*')
        .eq('contract_id', input.contractId)
        .eq('billing_period', input.billingPeriod)
        .maybeSingle(),
    ) as Record<string, unknown> | null;

    const newValues = {
      occupants_for_billing_override: input.occupantsForBillingOverride ?? null,
      electric_base_override: input.electricBaseOverride ?? null,
      electric_final_override: input.electricFinalOverride ?? null,
      water_base_override: input.waterBaseOverride ?? null,
      water_final_override: input.waterFinalOverride ?? null,
      location_multiplier_override: input.locationMultiplierOverride ?? null,
      season_months_override: input.seasonMonthsOverride?.length ? input.seasonMonthsOverride : null,
      electric_hot_season_multiplier_override: input.electricHotSeasonMultiplierOverride ?? null,
      reason: input.reason.trim(),
      old_values_json: (existing ?? {}) as Json,
      new_values_json: input as unknown as Json,
      created_by: createdBy,
    };

    const { error } = await supabase
      .from('invoice_utility_overrides')
      .upsert(
        {
          contract_id: input.contractId,
          billing_period: input.billingPeriod,
          ...newValues,
        },
        { onConflict: 'contract_id,billing_period' },
      );

    if (error) throw new Error(error.message);
  },

  deleteOverride: async (overrideId: number): Promise<void> => {
    const { error } = await supabase.from('invoice_utility_overrides').delete().eq('id', overrideId);
    if (error) throw new Error(error.message);
  },

  listBillingRuns: async (): Promise<BillingRunRecord[]> => {
    const rows = await unwrap(
      supabase
        .from('billing_runs')
        .select('id, billing_period, status, started_at, completed_at, lock_version, summary_json, error_json, created_at')
        .order('created_at', { ascending: false }),
    ) as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      id: Number(row.id),
      billingPeriod: String(row.billing_period),
      status: row.status as BillingRunRecord['status'],
      startedAt: row.started_at == null ? null : String(row.started_at),
      completedAt: row.completed_at == null ? null : String(row.completed_at),
      lockVersion: Number(row.lock_version ?? 0),
      summary: (row.summary_json as Record<string, unknown> | null) ?? {},
      error: (row.error_json as Record<string, unknown> | null) ?? {},
      createdAt: String(row.created_at),
    }));
  },

  previewBillingRun: async (billingPeriod: string, dueDate?: string): Promise<BillingRunPreview> => {
    const payload = await invokeRunUtilityBilling<
      BillingRunPreview & {
        status?: string;
        existingInvoiceContracts?: Array<{ contractId: number; contractCode: string }>;
        diagnostics?: Partial<BillingRunPreview['diagnostics']>;
      }
    >({
      trigger: 'manual',
      dryRun: true,
      billingPeriod,
      dueDate: dueDate ?? null,
    });

    return {
      billingPeriod: payload.billingPeriod,
      dueDate: payload.dueDate,
      totalContracts: Number(payload.totalContracts ?? 0),
      validContracts: Number(payload.validContracts ?? 0),
      skippedContracts: Number(payload.skippedContracts ?? payload.ineligibleContracts?.length ?? 0),
      existingInvoices: Number(payload.existingInvoices ?? 0),
      eligibleContracts: Array.isArray(payload.eligibleContracts) ? payload.eligibleContracts : [],
      existingInvoiceContracts: Array.isArray(payload.existingInvoiceContracts) ? payload.existingInvoiceContracts : [],
      ineligibleContracts: Array.isArray(payload.ineligibleContracts) ? payload.ineligibleContracts : [],
      diagnostics: {
        billingPeriodStart: String(payload.diagnostics?.billingPeriodStart ?? `${payload.billingPeriod}-01`),
        billingPeriodEnd: String(payload.diagnostics?.billingPeriodEnd ?? `${payload.billingPeriod}-31`),
        totalContracts: Number(payload.diagnostics?.totalContracts ?? payload.totalContracts ?? 0),
        validContracts: Number(payload.diagnostics?.validContracts ?? payload.validContracts ?? 0),
        skippedContracts: Number(payload.diagnostics?.skippedContracts ?? payload.skippedContracts ?? payload.ineligibleContracts?.length ?? 0),
        existingInvoiceContracts: Number(payload.diagnostics?.existingInvoiceContracts ?? payload.existingInvoices ?? 0),
        eligibleContracts: Number(payload.diagnostics?.eligibleContracts ?? payload.eligibleContracts?.length ?? 0),
      },
    };
  },

  startBillingRun: async (billingPeriod: string, dueDate?: string): Promise<BillingRunExecutionResult> =>
    invokeRunUtilityBilling<BillingRunExecutionResult>({
      trigger: 'manual',
      dryRun: false,
      billingPeriod,
      dueDate: dueDate ?? null,
    }),

  listBillingRunSnapshots: async (billingRunId: number): Promise<BillingRunSnapshotRecord[]> => {
    const rows = await unwrap(
      supabase
        .from('invoice_utility_snapshots')
        .select(`
          id, billing_period, policy_source_type, occupants_for_billing, occupied_days,
          electric_final_amount, water_final_amount, warnings_json, created_at,
          contracts ( contract_code ),
          rooms ( room_code )
        `)
        .eq('billing_run_id', billingRunId)
        .order('created_at', { ascending: false }),
    ) as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      id: Number(row.id),
      contractCode: String((row.contracts as Record<string, unknown> | null)?.contract_code ?? ''),
      roomCode: String((row.rooms as Record<string, unknown> | null)?.room_code ?? ''),
      billingPeriod: String(row.billing_period),
      electricFinalAmount: Number(row.electric_final_amount ?? 0),
      waterFinalAmount: Number(row.water_final_amount ?? 0),
      occupantsForBilling: Number(row.occupants_for_billing ?? 0),
      occupiedDays: Number(row.occupied_days ?? 0),
      warnings: Array.isArray(row.warnings_json)
        ? (row.warnings_json as Array<{ code: string; message: string }>)
        : [],
      policySourceType: String(row.policy_source_type ?? ''),
      createdAt: String(row.created_at),
    }));
  },
};

export default utilityAdminService;
