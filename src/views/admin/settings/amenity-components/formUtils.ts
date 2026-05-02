import { type AmenityPolicyFormInput } from '@/services/amenityAdminService';

export type AmenityRulesFormState = {
  openingHours: string;
  residentLimitPerDay: number;
  gracePeriodMinutes: number;
};

export function createPolicyForm(): AmenityPolicyFormInput {
  return {
    code: '',
    name: '',
    serviceId: 0,
    buildingId: null,
    bookingMode: 'slot_based',
    chargeMode: 'free',
    status: 'draft',
    slotGranularityMinutes: 60,
    maxCapacityPerSlot: 1,
    maxAdvanceDays: 7,
    cancellationCutoffHours: 2,
    autoCompleteAfterMinutes: 90,
    allowWaitlist: false,
    requiresStaffApproval: false,
    requiresCheckin: true,
    priceOverrideAmount: null,
    activeFrom: new Date().toISOString().slice(0, 10),
    activeTo: null,
    notes: null,
    rulesJson: { openingHours: '06:00-22:00', residentLimitPerDay: 1, gracePeriodMinutes: 15 },
    changeSummary: '',
  };
}

export function createPolicyRulesForm(): AmenityRulesFormState {
  return { openingHours: '06:00-22:00', residentLimitPerDay: 1, gracePeriodMinutes: 15 };
}

export function parsePolicyRulesForm(value: Record<string, unknown> | null | undefined): AmenityRulesFormState {
  return {
    openingHours: typeof value?.openingHours === 'string' && value.openingHours.trim() ? value.openingHours : '06:00-22:00',
    residentLimitPerDay: Number(value?.residentLimitPerDay ?? 1) || 1,
    gracePeriodMinutes: Number(value?.gracePeriodMinutes ?? 15) || 15,
  };
}

export function buildPolicyRulesJson(value: AmenityRulesFormState): Record<string, unknown> {
  return {
    openingHours: value.openingHours.trim() || '06:00-22:00',
    residentLimitPerDay: Math.max(1, Number(value.residentLimitPerDay) || 1),
    gracePeriodMinutes: Math.max(0, Number(value.gracePeriodMinutes) || 0),
  };
}
