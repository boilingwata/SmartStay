import { supabase } from "@/lib/supabase";
import { unwrap } from "@/lib/supabaseHelpers";
import { buildingService } from "./buildingService";
import {
  getLegacyAmenityServiceIds,
  isLegacyUtilityServiceName,
  isSchemaCompatError,
} from "./domainSchemaCompat";

const db = supabase as any;

export type AmenityPolicyStatus = "draft" | "pending_approval" | "approved" | "archived";
export type AmenityBookingMode = "slot_based" | "capacity_based" | "open_access";
export type AmenityChargeMode = "free" | "fixed_per_booking" | "fixed_per_person";
export type AmenityExceptionType =
  | "closure"
  | "blackout"
  | "capacity_override"
  | "price_override"
  | "rule_override";

export interface AmenityOption {
  value: string | number;
  label: string;
}

export interface AmenityPolicyRecord {
  id: number;
  code: string;
  name: string;
  serviceId: number;
  amenityName: string;
  buildingId: number | null;
  buildingName: string | null;
  bookingMode: AmenityBookingMode;
  chargeMode: AmenityChargeMode;
  status: AmenityPolicyStatus;
  slotGranularityMinutes: number;
  maxCapacityPerSlot: number;
  maxAdvanceDays: number;
  cancellationCutoffHours: number;
  autoCompleteAfterMinutes: number;
  allowWaitlist: boolean;
  requiresStaffApproval: boolean;
  requiresCheckin: boolean;
  priceOverrideAmount: number | null;
  activeFrom: string;
  activeTo: string | null;
  notes: string | null;
  rulesJson: Record<string, unknown>;
  currentVersionNo: number;
  createdAt: string;
  approvedAt: string | null;
}

export interface AmenityPolicyFormInput {
  code: string;
  name: string;
  serviceId: number;
  buildingId: number | null;
  bookingMode: AmenityBookingMode;
  chargeMode: AmenityChargeMode;
  status: AmenityPolicyStatus;
  slotGranularityMinutes: number;
  maxCapacityPerSlot: number;
  maxAdvanceDays: number;
  cancellationCutoffHours: number;
  autoCompleteAfterMinutes: number;
  allowWaitlist: boolean;
  requiresStaffApproval: boolean;
  requiresCheckin: boolean;
  priceOverrideAmount: number | null;
  activeFrom: string;
  activeTo: string | null;
  notes: string | null;
  rulesJson: Record<string, unknown>;
  changeSummary?: string;
}

export interface AmenityPolicyFilters {
  search: string;
  status: AmenityPolicyStatus | "all";
  serviceId: number | null;
  page: number;
  limit: number;
}

export interface AmenityPolicyVersionRecord {
  id: number;
  policyId: number;
  versionNo: number;
  changeType: string;
  status: string;
  changeSummary: string | null;
  reviewNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface AmenityExceptionRecord {
  id: number;
  policyId: number | null;
  serviceId: number;
  amenityName: string;
  buildingId: number | null;
  buildingName: string | null;
  title: string;
  exceptionType: AmenityExceptionType;
  startAt: string;
  endAt: string;
  reason: string | null;
  isActive: boolean;
  overrideJson: Record<string, unknown>;
  createdAt: string;
}

export interface AmenityExceptionFilters {
  search: string;
  exceptionType: AmenityExceptionType | "all";
  page: number;
  limit: number;
}

export interface AmenityExceptionFormInput {
  policyId: number | null;
  serviceId: number;
  buildingId: number | null;
  title: string;
  exceptionType: AmenityExceptionType;
  startAt: string;
  endAt: string;
  reason: string | null;
  overrideJson: Record<string, unknown>;
}

export interface AmenityPolicyNotificationRecord {
  id: number;
  policyId: number;
  versionId: number | null;
  title: string;
  message: string;
  channel: string;
  audienceScope: string;
  status: string;
  createdAt: string;
  sentAt: string | null;
}

export interface AmenityPolicyNotificationInput {
  policyId: number;
  versionId: number | null;
  title: string;
  message: string;
  channel: "in_app" | "email" | "sms";
  audienceScope: "active_residents" | "building_residents" | "manual_selection";
  payloadJson?: Record<string, unknown>;
}

export interface AmenityDashboardSummary {
  totalPolicies: number;
  pendingApprovals: number;
  activeExceptions: number;
  queuedNotifications: number;
  todayBookings: number;
  todayCheckins: number;
}

interface CatalogMaps {
  amenities: AmenityOption[];
  buildings: AmenityOption[];
  amenityMap: Map<number, string>;
  buildingMap: Map<number, string>;
}

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeJson(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function getCurrentProfileId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function getCatalogMaps(): Promise<CatalogMaps> {
  const buildings = await buildingService.getBuildings();
  const buildingMap = new Map(buildings.map((item) => [Number(item.id), item.buildingName]));

  try {
    const amenities = (await unwrap(
      db
        .from("amenity_catalog")
        .select("id, name")
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("name"),
    )) as Array<{ id: number; name: string }>;

    const amenityMap = new Map(amenities.map((item) => [item.id, item.name]));
    return {
      amenities: amenities.map((item) => ({ value: item.id, label: item.name })),
      buildings: buildings.map((item) => ({ value: item.id, label: item.buildingName })),
      amenityMap,
      buildingMap,
    };
  } catch (error) {
    if (!isSchemaCompatError(error as { code?: string; message?: string })) throw error;

    const [amenityServiceIds, legacyServices] = await Promise.all([
      getLegacyAmenityServiceIds(),
      unwrap(
        db
          .from("services")
          .select("id, name, is_active, is_deleted")
          .eq("is_deleted", false)
          .eq("is_active", true)
          .order("name"),
      ) as Promise<Array<{ id: number; name: string; is_active: boolean; is_deleted: boolean }>>,
    ]);

    const amenities = legacyServices
      .filter((item) => !isLegacyUtilityServiceName(item.name))
      .filter((item) => amenityServiceIds.size === 0 || amenityServiceIds.has(Number(item.id)))
      .map((item) => ({ id: Number(item.id), name: item.name }));

    const amenityMap = new Map(amenities.map((item) => [item.id, item.name]));
    return {
      amenities: amenities.map((item) => ({ value: item.id, label: item.name })),
      buildings: buildings.map((item) => ({ value: item.id, label: item.buildingName })),
      amenityMap,
      buildingMap,
    };
  }
}

function mapPolicyRow(row: Record<string, unknown>, amenityField: "amenity_id" | "service_id", maps: CatalogMaps): AmenityPolicyRecord {
  const amenityId = Number(row[amenityField]);
  const buildingId = toNumber(row.building_id);
  return {
    id: Number(row.id),
    code: String(row.code ?? ""),
    name: String(row.name ?? ""),
    serviceId: amenityId,
    amenityName: maps.amenityMap.get(amenityId) ?? `Tiện ích #${amenityId}`,
    buildingId,
    buildingName: buildingId ? maps.buildingMap.get(buildingId) ?? null : null,
    bookingMode: (row.booking_mode as AmenityBookingMode) ?? "slot_based",
    chargeMode: (row.charge_mode as AmenityChargeMode) ?? "free",
    status: (row.status as AmenityPolicyStatus) ?? "draft",
    slotGranularityMinutes: Number(row.slot_granularity_minutes ?? 60),
    maxCapacityPerSlot: Number(row.max_capacity_per_slot ?? 1),
    maxAdvanceDays: Number(row.max_advance_days ?? 7),
    cancellationCutoffHours: Number(row.cancellation_cutoff_hours ?? 2),
    autoCompleteAfterMinutes: Number(row.auto_complete_after_minutes ?? 90),
    allowWaitlist: Boolean(row.allow_waitlist),
    requiresStaffApproval: Boolean(row.requires_staff_approval),
    requiresCheckin: row.requires_checkin == null ? true : Boolean(row.requires_checkin),
    priceOverrideAmount: toNumber(row.price_override_amount),
    activeFrom: String(row.active_from ?? ""),
    activeTo: row.active_to ? String(row.active_to) : null,
    notes: row.notes ? String(row.notes) : null,
    rulesJson: normalizeJson(row.rules_json),
    currentVersionNo: Number(row.current_version_no ?? 1),
    createdAt: String(row.created_at ?? ""),
    approvedAt: row.approved_at ? String(row.approved_at) : null,
  };
}

function mapExceptionRow(row: Record<string, unknown>, amenityField: "amenity_id" | "service_id", maps: CatalogMaps): AmenityExceptionRecord {
  const amenityId = Number(row[amenityField]);
  const buildingId = toNumber(row.building_id);
  return {
    id: Number(row.id),
    policyId: toNumber(row.policy_id),
    serviceId: amenityId,
    amenityName: maps.amenityMap.get(amenityId) ?? `Tiện ích #${amenityId}`,
    buildingId,
    buildingName: buildingId ? maps.buildingMap.get(buildingId) ?? null : null,
    title: String(row.title ?? ""),
    exceptionType: (row.exception_type as AmenityExceptionType) ?? "closure",
    startAt: String(row.start_at ?? ""),
    endAt: String(row.end_at ?? ""),
    reason: row.reason ? String(row.reason) : null,
    isActive: Boolean(row.is_active),
    overrideJson: normalizeJson(row.override_json),
    createdAt: String(row.created_at ?? ""),
  };
}

async function listPoliciesUsing(field: "amenity_id" | "service_id", filters: AmenityPolicyFilters) {
  let query = db
    .from("amenity_policies")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.serviceId) query = query.eq(field, filters.serviceId);
  if (filters.search.trim()) {
    query = query.or(`name.ilike.%${filters.search.trim()}%,code.ilike.%${filters.search.trim()}%`);
  }

  const from = (filters.page - 1) * filters.limit;
  const to = from + filters.limit - 1;
  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  const maps = await getCatalogMaps();
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  return {
    total: count ?? rows.length,
    data: rows.map((row) => mapPolicyRow(row, field, maps)),
  };
}

async function listExceptionsUsing(field: "amenity_id" | "service_id", filters: AmenityExceptionFilters) {
  let query = db
    .from("amenity_booking_exceptions")
    .select("*", { count: "exact" })
    .order("start_at", { ascending: false });

  if (filters.exceptionType !== "all") query = query.eq("exception_type", filters.exceptionType);
  if (filters.search.trim()) query = query.ilike("title", `%${filters.search.trim()}%`);

  const from = (filters.page - 1) * filters.limit;
  const to = from + filters.limit - 1;
  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  const maps = await getCatalogMaps();
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  return {
    total: count ?? rows.length,
    data: rows.map((row) => mapExceptionRow(row, field, maps)),
  };
}

export const amenityAdminService = {
  async getFormOptions(): Promise<{ amenities: AmenityOption[]; buildings: AmenityOption[] }> {
    const maps = await getCatalogMaps();
    return { amenities: maps.amenities, buildings: maps.buildings };
  },

  async listPolicies(filters: AmenityPolicyFilters): Promise<{ data: AmenityPolicyRecord[]; total: number }> {
    try {
      return await listPoliciesUsing("amenity_id", filters);
    } catch (error) {
      if (isSchemaCompatError(error as { code?: string; message?: string })) {
        return listPoliciesUsing("service_id", filters);
      }
      throw error;
    }
  },

  async createPolicy(input: AmenityPolicyFormInput): Promise<void> {
    const profileId = await getCurrentProfileId();

    const buildPayload = (field: "amenity_id" | "service_id") => ({
      code: input.code.trim(),
      name: input.name.trim(),
      [field]: input.serviceId,
      building_id: input.buildingId,
      booking_mode: input.bookingMode,
      charge_mode: input.chargeMode,
      status: input.status,
      slot_granularity_minutes: input.slotGranularityMinutes,
      max_capacity_per_slot: input.maxCapacityPerSlot,
      max_advance_days: input.maxAdvanceDays,
      cancellation_cutoff_hours: input.cancellationCutoffHours,
      auto_complete_after_minutes: input.autoCompleteAfterMinutes,
      allow_waitlist: input.allowWaitlist,
      requires_staff_approval: input.requiresStaffApproval,
      requires_checkin: input.requiresCheckin,
      price_override_amount: input.priceOverrideAmount,
      active_from: input.activeFrom,
      active_to: input.activeTo,
      notes: input.notes,
      rules_json: input.rulesJson,
      created_by: profileId,
      approved_by: input.status === "approved" ? profileId : null,
      approved_at: input.status === "approved" ? new Date().toISOString() : null,
    });

    let policy: { id: number; current_version_no: number };
    try {
      policy = (await unwrap(
        db.from("amenity_policies").insert(buildPayload("amenity_id")).select("id, current_version_no").single(),
      )) as { id: number; current_version_no: number };
    } catch (error) {
      if (!isSchemaCompatError(error as { code?: string; message?: string })) throw error;
      policy = (await unwrap(
        db.from("amenity_policies").insert(buildPayload("service_id")).select("id, current_version_no").single(),
      )) as { id: number; current_version_no: number };
    }

    await unwrap(
      db.from("amenity_policy_versions").insert({
        policy_id: policy.id,
        version_no: policy.current_version_no,
        change_type: "create",
        status: input.status,
        change_summary: input.changeSummary ?? "Khởi tạo chính sách tiện ích mới.",
        snapshot_json: input,
        submitted_by: profileId,
        reviewed_by: input.status === "approved" ? profileId : null,
        reviewed_at: input.status === "approved" ? new Date().toISOString() : null,
      }),
    );
  },

  async updatePolicy(policyId: number, input: AmenityPolicyFormInput): Promise<void> {
    const profileId = await getCurrentProfileId();
    const current = (await unwrap(
      db.from("amenity_policies").select("current_version_no").eq("id", policyId).single(),
    )) as { current_version_no: number };

    const nextVersion = Number(current.current_version_no ?? 1) + 1;
    const buildPayload = (field: "amenity_id" | "service_id") => ({
      code: input.code.trim(),
      name: input.name.trim(),
      [field]: input.serviceId,
      building_id: input.buildingId,
      booking_mode: input.bookingMode,
      charge_mode: input.chargeMode,
      status: input.status,
      slot_granularity_minutes: input.slotGranularityMinutes,
      max_capacity_per_slot: input.maxCapacityPerSlot,
      max_advance_days: input.maxAdvanceDays,
      cancellation_cutoff_hours: input.cancellationCutoffHours,
      auto_complete_after_minutes: input.autoCompleteAfterMinutes,
      allow_waitlist: input.allowWaitlist,
      requires_staff_approval: input.requiresStaffApproval,
      requires_checkin: input.requiresCheckin,
      price_override_amount: input.priceOverrideAmount,
      active_from: input.activeFrom,
      active_to: input.activeTo,
      notes: input.notes,
      rules_json: input.rulesJson,
      current_version_no: nextVersion,
      approved_by: input.status === "approved" ? profileId : null,
      approved_at: input.status === "approved" ? new Date().toISOString() : null,
    });

    try {
      await unwrap(db.from("amenity_policies").update(buildPayload("amenity_id")).eq("id", policyId));
    } catch (error) {
      if (!isSchemaCompatError(error as { code?: string; message?: string })) throw error;
      await unwrap(db.from("amenity_policies").update(buildPayload("service_id")).eq("id", policyId));
    }

    await unwrap(
      db.from("amenity_policy_versions").insert({
        policy_id: policyId,
        version_no: nextVersion,
        change_type: "update",
        status: input.status,
        change_summary: input.changeSummary ?? "Cập nhật chính sách tiện ích.",
        snapshot_json: input,
        submitted_by: profileId,
        reviewed_by: input.status === "approved" ? profileId : null,
        reviewed_at: input.status === "approved" ? new Date().toISOString() : null,
      }),
    );
  },

  async archivePolicy(policyId: number): Promise<void> {
    const profileId = await getCurrentProfileId();
    const current = (await unwrap(
      db.from("amenity_policies").select("current_version_no").eq("id", policyId).single(),
    )) as { current_version_no: number };

    const nextVersion = Number(current.current_version_no ?? 1) + 1;
    await unwrap(
      db
        .from("amenity_policies")
        .update({
          status: "archived",
          deleted_at: new Date().toISOString(),
          current_version_no: nextVersion,
        })
        .eq("id", policyId),
    );

    await unwrap(
      db.from("amenity_policy_versions").insert({
        policy_id: policyId,
        version_no: nextVersion,
        change_type: "archive",
        status: "archived",
        change_summary: "Lưu trữ chính sách tiện ích.",
        snapshot_json: { archived: true },
        submitted_by: profileId,
        reviewed_by: profileId,
        reviewed_at: new Date().toISOString(),
      }),
    );
  },

  async listPolicyVersions(policyId: number): Promise<AmenityPolicyVersionRecord[]> {
    try {
      const rows = (await unwrap(
        db.from("amenity_policy_versions").select("*").eq("policy_id", policyId).order("version_no", { ascending: false }),
      )) as Array<Record<string, unknown>>;

      return rows.map((row) => ({
        id: Number(row.id),
        policyId: Number(row.policy_id),
        versionNo: Number(row.version_no),
        changeType: String(row.change_type ?? ""),
        status: String(row.status ?? ""),
        changeSummary: row.change_summary ? String(row.change_summary) : null,
        reviewNote: row.review_note ? String(row.review_note) : null,
        submittedAt: String(row.submitted_at ?? row.created_at ?? ""),
        reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
      }));
    } catch (error) {
      if (isSchemaCompatError(error as { code?: string; message?: string })) return [];
      throw error;
    }
  },

  async reviewVersion(versionId: number, decision: "approved" | "rejected", reviewNote?: string | null): Promise<void> {
    const profileId = await getCurrentProfileId();
    const version = (await unwrap(
      db.from("amenity_policy_versions").select("policy_id, version_no").eq("id", versionId).single(),
    )) as { policy_id: number; version_no: number };

    await unwrap(
      db
        .from("amenity_policy_versions")
        .update({
          status: decision,
          reviewed_by: profileId,
          reviewed_at: new Date().toISOString(),
          review_note: reviewNote ?? null,
        })
        .eq("id", versionId),
    );

    await unwrap(
      db
        .from("amenity_policies")
        .update({
          status: decision === "approved" ? "approved" : "draft",
          approved_by: decision === "approved" ? profileId : null,
          approved_at: decision === "approved" ? new Date().toISOString() : null,
          current_version_no: Number(version.version_no ?? 1),
        })
        .eq("id", version.policy_id),
    );
  },

  async listExceptions(filters: AmenityExceptionFilters): Promise<{ data: AmenityExceptionRecord[]; total: number }> {
    try {
      return await listExceptionsUsing("amenity_id", filters);
    } catch (error) {
      if (isSchemaCompatError(error as { code?: string; message?: string })) {
        return listExceptionsUsing("service_id", filters);
      }
      throw error;
    }
  },

  async createException(input: AmenityExceptionFormInput): Promise<void> {
    const profileId = await getCurrentProfileId();

    const buildPayload = (field: "amenity_id" | "service_id") => ({
      policy_id: input.policyId,
      [field]: input.serviceId,
      building_id: input.buildingId,
      title: input.title.trim(),
      exception_type: input.exceptionType,
      start_at: input.startAt,
      end_at: input.endAt,
      reason: input.reason,
      override_json: input.overrideJson,
      created_by: profileId,
    });

    try {
      await unwrap(db.from("amenity_booking_exceptions").insert(buildPayload("amenity_id")));
    } catch (error) {
      if (!isSchemaCompatError(error as { code?: string; message?: string })) throw error;
      await unwrap(db.from("amenity_booking_exceptions").insert(buildPayload("service_id")));
    }
  },

  async listNotifications(limit = 10): Promise<AmenityPolicyNotificationRecord[]> {
    try {
      const rows = (await unwrap(
        db.from("amenity_policy_notifications").select("*").order("created_at", { ascending: false }).limit(limit),
      )) as Array<Record<string, unknown>>;

      return rows.map((row) => ({
        id: Number(row.id),
        policyId: Number(row.policy_id),
        versionId: toNumber(row.version_id),
        title: String(row.title ?? ""),
        message: String(row.message ?? ""),
        channel: String(row.channel ?? "in_app"),
        audienceScope: String(row.audience_scope ?? "active_residents"),
        status: String(row.status ?? "queued"),
        createdAt: String(row.created_at ?? ""),
        sentAt: row.sent_at ? String(row.sent_at) : null,
      }));
    } catch (error) {
      if (isSchemaCompatError(error as { code?: string; message?: string })) return [];
      throw error;
    }
  },

  async queuePolicyNotification(input: AmenityPolicyNotificationInput): Promise<void> {
    const profileId = await getCurrentProfileId();
    await unwrap(
      db.from("amenity_policy_notifications").insert({
        policy_id: input.policyId,
        version_id: input.versionId,
        title: input.title.trim(),
        message: input.message.trim(),
        channel: input.channel,
        audience_scope: input.audienceScope,
        payload_json: input.payloadJson ?? {},
        created_by: profileId,
      }),
    );
  },

  async getDashboard(): Promise<AmenityDashboardSummary> {
    const summary: AmenityDashboardSummary = {
      totalPolicies: 0,
      pendingApprovals: 0,
      activeExceptions: 0,
      queuedNotifications: 0,
      todayBookings: 0,
      todayCheckins: 0,
    };

    const today = new Date().toISOString().slice(0, 10);
    const queries = await Promise.allSettled([
      db.from("amenity_policies").select("id", { count: "exact", head: true }).is("deleted_at", null),
      db.from("amenity_policy_versions").select("id", { count: "exact", head: true }).eq("status", "pending_approval"),
      db.from("amenity_booking_exceptions").select("id", { count: "exact", head: true }).eq("is_active", true),
      db.from("amenity_policy_notifications").select("id", { count: "exact", head: true }).eq("status", "queued"),
      db.from("amenity_bookings").select("id", { count: "exact", head: true }).eq("booking_date", today),
      db.from("amenity_booking_checkins").select("id", { count: "exact", head: true }).gte("created_at", `${today}T00:00:00`),
    ]);

    const counts = queries.map((result) => {
      if (result.status !== "fulfilled") return null;
      const value = result.value as { count?: number; error?: { code?: string; message?: string } | null };
      if (value.error && !isSchemaCompatError(value.error)) throw new Error(value.error.message);
      return value.count ?? 0;
    });

    summary.totalPolicies = counts[0] ?? 0;
    summary.pendingApprovals = counts[1] ?? 0;
    summary.activeExceptions = counts[2] ?? 0;
    summary.queuedNotifications = counts[3] ?? 0;
    summary.todayBookings = counts[4] ?? 0;
    summary.todayCheckins = counts[5] ?? 0;

    return summary;
  },
};

export default amenityAdminService;
