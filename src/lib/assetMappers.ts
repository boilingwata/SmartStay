import { mapAssetStatus } from '@/lib/enumMaps';
import { Asset, AssetCondition, AssetType } from '@/models/Asset';

export function mapAssetCondition(dbStatus: string | null): AssetCondition {
  if (!dbStatus) return 'New';
  const mapped = mapAssetStatus.fromDb(dbStatus);
  const valid: AssetCondition[] = ['New', 'Good', 'Fair', 'Poor'];
  return valid.includes(mapped as AssetCondition) ? (mapped as AssetCondition) : 'Good';
}

export function mapAssetType(category: string | null): AssetType {
  if (!category) return 'Other';
  const lower = category.toLowerCase();
  if (lower.includes('furniture') || lower.includes('noi that')) return 'Furniture';
  if (lower.includes('appliance') || lower.includes('thiet bi')) return 'Appliance';
  if (lower.includes('electronic') || lower.includes('dien tu')) return 'Electronics';
  if (lower.includes('fixture') || lower.includes('co dinh')) return 'Fixture';
  return 'Other';
}

export function mapBillingStatusFromDb(status: string | null): Asset['billingStatus'] {
  switch (status) {
    case 'active':
      return 'Active';
    case 'suspended':
      return 'Suspended';
    case 'stopped':
      return 'Stopped';
    default:
      return 'Inactive';
  }
}

export function mapBillingStatusToDb(status: Asset['billingStatus'] | undefined): string | undefined {
  switch (status) {
    case 'Active':
      return 'active';
    case 'Suspended':
      return 'suspended';
    case 'Stopped':
      return 'stopped';
    case 'Inactive':
      return 'inactive';
    default:
      return undefined;
  }
}
