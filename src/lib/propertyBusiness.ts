import type { Furnishing, RoomType } from '@/models/Room';

const AMENITY_LABELS: Record<string, string> = {
  WiFi: 'Wi-Fi miễn phí',
  Balcony: 'Ban công',
  Window: 'Cửa sổ thoáng',
  Parking: 'Chỗ để xe',
  Security: 'An ninh tòa nhà',
  PrivateBathroom: 'WC riêng',
  KitchenCabinet: 'Tủ bếp cơ bản',
  AirConditioner: 'Điều hòa',
  HotWater: 'Bình nóng lạnh',
  Fridge: 'Tủ lạnh',
  Washer: 'Máy giặt',
  TV: 'Tivi',
  Furniture: 'Nội thất cơ bản',
};

export function normalizeAmenityCodes(amenities: unknown): string[] {
  if (Array.isArray(amenities)) {
    return amenities.filter((item): item is string => typeof item === 'string');
  }

  if (!amenities || typeof amenities !== 'object') {
    return [];
  }

  return Object.entries(amenities as Record<string, unknown>)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => key);
}

export function getAmenityLabel(code: string): string {
  return AMENITY_LABELS[code] ?? code;
}

export function getAmenityViewModel(amenities: unknown): Array<{ code: string; label: string }> {
  return normalizeAmenityCodes(amenities).map((code) => ({
    code,
    label: getAmenityLabel(code),
  }));
}

export function deriveRoomType(areaSqm: number | null | undefined, explicit?: string | null): RoomType {
  if (explicit) {
    return explicit as RoomType;
  }

  const area = Number(areaSqm ?? 0);
  if (area <= 0) return 'Studio';
  if (area <= 28) return 'Studio';
  if (area <= 45) return '1BR';
  if (area <= 65) return '2BR';
  if (area <= 95) return '3BR';
  return 'Penthouse';
}

function normalizeAssetText(value: string | null | undefined): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function deriveFurnishingFromAssets(
  assets: Array<{ assetName?: string | null; type?: string | null }> | null | undefined,
): Furnishing {
  if (!assets?.length) return 'Unfurnished';

  let furnishingSignals = 0;
  let applianceSignals = 0;

  for (const asset of assets) {
    const text = `${normalizeAssetText(asset.assetName)} ${normalizeAssetText(asset.type)}`;

    if (
      text.includes('giuong') ||
      text.includes('bed') ||
      text.includes('tu ao') ||
      text.includes('wardrobe') ||
      text.includes('sofa') ||
      text.includes('ban ') ||
      text.includes('table') ||
      text.includes('ghe') ||
      text.includes('chair') ||
      text.includes('noi that') ||
      text.includes('furniture')
    ) {
      furnishingSignals += 1;
    }

    if (
      text.includes('aircon') ||
      text.includes('dieu hoa') ||
      text.includes('may lanh') ||
      text.includes('fridge') ||
      text.includes('tu lanh') ||
      text.includes('washer') ||
      text.includes('may giat') ||
      text.includes('tv') ||
      text.includes('tivi')
    ) {
      applianceSignals += 1;
    }
  }

  const totalSignals = furnishingSignals + applianceSignals;
  if (totalSignals >= 4 || (furnishingSignals >= 2 && applianceSignals >= 1)) return 'FullyFurnished';
  if (totalSignals >= 1) return 'SemiFurnished';
  return 'Unfurnished';
}
