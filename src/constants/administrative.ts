/**
 * Fallback administrative data for Vietnam (Provinces, Districts, Wards)
 * Used when the external API (provinces.open-api.vn) is unavailable.
 */

export const FALLBACK_PROVINCES = [
  { id: '1', name: 'Hà Nội' },
  { id: '79', name: 'TP. Hồ Chí Minh' }
];

export const FALLBACK_DISTRICTS: Record<string, { id: string; name: string }[]> = {
  '1': [
    { id: '101', name: 'Nam Từ Liêm' },
    { id: '102', name: 'Ba Đình' }
  ],
  '79': [
    { id: '7901', name: 'Quận 1' }
  ]
};

export const FALLBACK_WARDS: Record<string, { id: string; name: string }[]> = {
  '101': [
    { id: '10101', name: 'Mễ Trì' }
  ],
  '102': [
    { id: '10201', name: 'Ngọc Khánh' }
  ],
  '7901': [
    { id: '790101', name: 'Bến Nghé' }
  ]
};
