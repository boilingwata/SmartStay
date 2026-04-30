import type { DirectionFacing, Furnishing, RoomStatus, RoomType } from '@/models/Room';

import { getAmenityLabel } from '@/lib/propertyBusiness';

export const BUILDING_AMENITY_OPTIONS = [
  { id: 'Gym', label: 'Phòng gym' },
  { id: 'Pool', label: 'Hồ bơi' },
  { id: 'Parking', label: 'Chỗ để xe' },
  { id: 'Security24h', label: 'An ninh 24/7' },
  { id: 'Elevator', label: 'Thang máy' },
  { id: 'Lobby', label: 'Sảnh chờ' },
  { id: 'Garden', label: 'Khu cây xanh' },
  { id: 'Supermarket', label: 'Cửa hàng tiện lợi' },
] as const;

export const ROOM_AMENITY_OPTIONS = [
  { id: 'WiFi', label: 'Wi-Fi miễn phí' },
  { id: 'Window', label: 'Cửa sổ thoáng' },
  { id: 'PrivateBathroom', label: 'WC riêng' },
  { id: 'KitchenCabinet', label: 'Tủ bếp cơ bản' },
  { id: 'Parking', label: 'Chỗ để xe' },
  { id: 'Security', label: 'An ninh tòa nhà' },
] as const;

export const ROOM_TYPE_LABELS: Record<string, string> = {
  Studio: 'Căn studio',
  studio: 'Căn studio',
  '1BR': '1 phòng ngủ',
  '1br': '1 phòng ngủ',
  '2BR': '2 phòng ngủ',
  '2br': '2 phòng ngủ',
  '3BR': '3 phòng ngủ',
  '3br': '3 phòng ngủ',
  Penthouse: 'Căn áp mái',
  penthouse: 'Căn áp mái',
  Commercial: 'Mặt bằng kinh doanh',
  commercial: 'Mặt bằng kinh doanh',
  Dormitory: 'Phòng ở ghép',
  dormitory: 'Phòng ở ghép',
};

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  Vacant: 'Phòng trống',
  Occupied: 'Đang ở',
  Maintenance: 'Bảo trì',
  Reserved: 'Đã giữ chỗ',
};

export const DIRECTION_LABELS: Record<DirectionFacing, string> = {
  N: 'Bắc',
  S: 'Nam',
  E: 'Đông',
  W: 'Tây',
  NE: 'Đông Bắc',
  NW: 'Tây Bắc',
  SE: 'Đông Nam',
  SW: 'Tây Nam',
};

export const FURNISHING_LABELS: Record<Furnishing, string> = {
  Unfurnished: 'Không nội thất',
  SemiFurnished: 'Nội thất cơ bản',
  FullyFurnished: 'Đầy đủ nội thất',
};

export const ASSET_CONDITION_LABELS: Record<string, string> = {
  New: 'Mới',
  Good: 'Tốt',
  Fair: 'Trung bình',
  Poor: 'Kém',
  Broken: 'Hư hỏng',
};

export const ASSET_TYPE_LABELS: Record<string, string> = {
  Furniture: 'Nội thất',
  Appliance: 'Thiết bị',
  Electronics: 'Điện tử',
  Fixture: 'Thiết bị cố định',
  Other: 'Khác',
};

export const HANDOVER_TYPE_LABELS: Record<string, string> = {
  CheckIn: 'Nhận phòng',
  CheckOut: 'Trả phòng',
  Periodic: 'Kiểm tra định kỳ',
  Other: 'Khác',
};

export function getBuildingAmenityLabel(code: string) {
  return BUILDING_AMENITY_OPTIONS.find((item) => item.id === code)?.label ?? code;
}

export function getRoomTypeLabel(type: RoomType | string | null | undefined) {
  if (!type) return '--';
  return ROOM_TYPE_LABELS[type] ?? type;
}

export function getRoomStatusLabel(status: RoomStatus | string | null | undefined) {
  if (!status) return '--';
  return ROOM_STATUS_LABELS[status as RoomStatus] ?? status;
}

export function getDirectionLabel(direction: DirectionFacing | string | null | undefined) {
  if (!direction) return '--';
  return DIRECTION_LABELS[direction as DirectionFacing] ?? direction;
}

export function getFurnishingLabel(furnishing: Furnishing | string | null | undefined) {
  if (!furnishing) return '--';
  return FURNISHING_LABELS[furnishing as Furnishing] ?? furnishing;
}

export function getAssetConditionLabel(condition: string | null | undefined) {
  if (!condition) return '--';
  return ASSET_CONDITION_LABELS[condition] ?? condition;
}

export function getAssetTypeLabel(type: string | null | undefined) {
  if (!type) return '--';
  return ASSET_TYPE_LABELS[type] ?? type;
}

export function getHandoverTypeLabel(type: string | null | undefined) {
  if (!type) return '--';
  return HANDOVER_TYPE_LABELS[type] ?? type;
}

export function getRoomAmenityLabel(code: string) {
  return ROOM_AMENITY_OPTIONS.find((item) => item.id === code)?.label ?? getAmenityLabel(code);
}
