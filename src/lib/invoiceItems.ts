import type { InvoiceItemType, InvoiceItemTypeKey } from '@/models/Invoice';

export function normalizeInvoiceItemText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function normalizeInvoiceItemType(
  itemType: string | null | undefined,
  description?: string | null
): InvoiceItemTypeKey {
  switch (itemType) {
    case 'rent':
    case 'utility_electric':
    case 'utility_water':
    case 'service':
    case 'asset':
    case 'discount':
    case 'other':
      return itemType;
    default:
      break;
  }

  const normalizedDescription = normalizeInvoiceItemText(description ?? '');
  if (normalizedDescription.includes('giam tru')) return 'discount';
  if (normalizedDescription.includes('dien')) return 'utility_electric';
  if (normalizedDescription.includes('nuoc')) return 'utility_water';
  if (normalizedDescription.includes('phu phi thiet bi')) return 'asset';
  if (normalizedDescription.includes('thue')) return 'rent';
  return 'service';
}

export function toUiInvoiceItemType(type: InvoiceItemTypeKey): InvoiceItemType {
  switch (type) {
    case 'rent':
      return 'Rent';
    case 'utility_electric':
      return 'Electricity';
    case 'utility_water':
      return 'Water';
    case 'asset':
      return 'Asset';
    case 'discount':
      return 'Discount';
    case 'other':
      return 'Other';
    default:
      return 'Service';
  }
}

export function getInvoiceItemGroupLabel(type: InvoiceItemTypeKey): string {
  switch (type) {
    case 'rent':
      return 'Tiền thuê';
    case 'utility_electric':
      return 'Tiền điện';
    case 'utility_water':
      return 'Tiền nước';
    case 'service':
      return 'Dịch vụ';
    case 'asset':
      return 'Thiết bị tính phí';
    case 'discount':
      return 'Giảm trừ';
    default:
      return 'Khác';
  }
}

export function groupInvoiceItemsByType<T extends { typeKey?: InvoiceItemTypeKey; itemType?: InvoiceItemTypeKey; amount?: number; lineTotal?: number }>(
  items: T[]
): Array<{ key: InvoiceItemTypeKey; label: string; total: number; items: T[] }> {
  const order: InvoiceItemTypeKey[] = [
    'rent',
    'utility_electric',
    'utility_water',
    'service',
    'asset',
    'discount',
    'other',
  ];

  const buckets = new Map<InvoiceItemTypeKey, T[]>();
  for (const item of items) {
    const key = item.typeKey ?? item.itemType ?? 'other';
    const group = buckets.get(key) ?? [];
    group.push(item);
    buckets.set(key, group);
  }

  return order
    .filter((key) => (buckets.get(key)?.length ?? 0) > 0)
    .map((key) => ({
      key,
      label: getInvoiceItemGroupLabel(key),
      total: (buckets.get(key) ?? []).reduce(
        (sum, item) => sum + Number(item.amount ?? item.lineTotal ?? 0),
        0
      ),
      items: buckets.get(key) ?? [],
    }));
}
