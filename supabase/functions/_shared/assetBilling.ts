export type AssetBillingStatus = 'inactive' | 'active' | 'suspended' | 'stopped';

export interface BillableRoomAssetInput {
  id: string | number;
  assetName: string;
  billingLabel?: string | null;
  quantity?: number | null;
  monthlyCharge?: number | null;
  billingStartDate?: string | null;
  billingEndDate?: string | null;
  assignedAt?: string | null;
  isBillable?: boolean | null;
  billingStatus?: AssetBillingStatus | string | null;
  physicalStatus?: string | null;
}

export interface BillableAssetInvoiceLine {
  assetId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  itemType: 'asset';
  source: 'asset';
  sortOrder: number;
  activeDays: number;
  daysInPeriod: number;
  prorateRatio: number;
}

function toUtcDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function fromDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfMonth(monthYear: string): Date {
  return toUtcDate(`${monthYear}-01`);
}

function endOfMonth(monthYear: string): Date {
  const start = startOfMonth(monthYear);
  return addDays(new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1)), -1);
}

function daysInclusive(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

function minDate(values: Date[]): Date {
  return values.reduce((smallest, current) => (current < smallest ? current : smallest));
}

function maxDate(values: Date[]): Date {
  return values.reduce((largest, current) => (current > largest ? current : largest));
}

function isAssetBillingActive(asset: BillableRoomAssetInput): boolean {
  const monthlyCharge = Number(asset.monthlyCharge ?? 0);
  const billingStatus = String(asset.billingStatus ?? 'inactive');
  const physicalStatus = String(asset.physicalStatus ?? '').toLowerCase();

  if (!asset.isBillable || monthlyCharge <= 0) return false;
  if (billingStatus === 'inactive' || billingStatus === 'suspended' || billingStatus === 'stopped') return false;
  if (physicalStatus === 'disposed' || physicalStatus === 'cancelled') return false;
  return true;
}

export function buildBillableAssetLines(input: {
  monthYear: string;
  contractStartDate: string;
  contractEndDate: string;
  assets: BillableRoomAssetInput[];
  startingSortOrder?: number;
}): BillableAssetInvoiceLine[] {
  if (!/^\d{4}-\d{2}$/.test(input.monthYear)) {
    throw new Error('Billing period is invalid.');
  }

  const periodStart = startOfMonth(input.monthYear);
  const periodEnd = endOfMonth(input.monthYear);
  const contractStart = toUtcDate(input.contractStartDate);
  const contractEnd = toUtcDate(input.contractEndDate);
  const daysInPeriod = daysInclusive(periodStart, periodEnd);
  let sortOrder = input.startingSortOrder ?? 1;

  return input.assets.flatMap((asset) => {
    if (!isAssetBillingActive(asset)) return [];

    const assetStart = toUtcDate(asset.billingStartDate ?? asset.assignedAt ?? fromDate(periodStart));
    const assetEnd = asset.billingEndDate ? toUtcDate(asset.billingEndDate) : periodEnd;
    const effectiveStart = maxDate([periodStart, contractStart, assetStart]);
    const effectiveEnd = minDate([periodEnd, contractEnd, assetEnd]);

    if (effectiveStart > effectiveEnd) return [];

    const quantity = Math.max(1, Number(asset.quantity ?? 1));
    const activeDays = daysInclusive(effectiveStart, effectiveEnd);
    const prorateRatio = activeDays / daysInPeriod;
    const unitPrice = Number((Number(asset.monthlyCharge ?? 0) * prorateRatio).toFixed(2));
    const lineTotal = Number((unitPrice * quantity).toFixed(2));
    const descriptionBase = asset.billingLabel?.trim() || `Phụ phí thiết bị: ${asset.assetName}`;
    const description =
      activeDays === daysInPeriod
        ? `${descriptionBase} tháng ${input.monthYear}`
        : `${descriptionBase} tháng ${input.monthYear} (${activeDays}/${daysInPeriod} ngày)`;

    return [
      {
        assetId: String(asset.id),
        description,
        quantity,
        unitPrice,
        lineTotal,
        itemType: 'asset',
        source: 'asset',
        sortOrder: sortOrder++,
        activeDays,
        daysInPeriod,
        prorateRatio,
      },
    ];
  });
}
