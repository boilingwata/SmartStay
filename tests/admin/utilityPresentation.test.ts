import { describe, expect, it } from 'vitest';
import {
  formatUtilityBillingMonthCompact,
  getUtilityWarningMeta,
  translateUtilityBackendMessage,
} from '../../src/lib/utilityPresentation';

describe('utilityPresentation', () => {
  it('formats billing periods in compact Vietnamese month/year form', () => {
    expect(formatUtilityBillingMonthCompact('2026-04')).toBe('04/2026');
    expect(formatUtilityBillingMonthCompact('invalid')).toBe('invalid');
  });

  it('translates live backend errors to Vietnamese', () => {
    expect(translateUtilityBackendMessage('Missing Authorization header')).toBe(
      'Thiếu thông tin xác thực để chạy đợt xuất hóa đơn tiện ích.',
    );
    expect(translateUtilityBackendMessage('No active utility policy found for this contract')).toBe(
      'Không tìm thấy chính sách tiện ích đang áp dụng cho hợp đồng này.',
    );
    expect(translateUtilityBackendMessage('Discount cannot exceed invoice subtotal')).toBe(
      'Giảm trừ không thể lớn hơn tổng tiền hóa đơn.',
    );
  });

  it('returns Vietnamese warning metadata for legacy English warning messages', () => {
    expect(
      getUtilityWarningMeta(
        'electric_below_floor',
        'Electric rounded amount is below the minimum floor and was raised to the floor.',
      ),
    ).toEqual({
      label: 'Chạm mức sàn điện',
      message: 'Tiền điện sau làm tròn thấp hơn mức sàn nên hệ thống nâng lên mức sàn.',
    });
  });
});
