import { formatDate } from '@/utils';

const scopeLabels = {
  system: 'Toàn hệ thống',
  building: 'Tòa nhà',
  room: 'Phòng',
  contract: 'Hợp đồng',
} as const;

const sourceLabels = {
  invoice_override: 'Ghi đè kỳ hóa đơn',
  contract: 'Chính sách hợp đồng',
  room: 'Chính sách phòng',
  building: 'Chính sách tòa nhà',
  system: 'Chính sách toàn hệ thống',
} as const;

const statusLabels = {
  draft: 'Bản nháp',
  running: 'Đang chạy',
  completed: 'Hoàn thành',
  failed: 'Thất bại',
  cancelled: 'Đã hủy',
} as const;

const warningMeta = {
  electric_below_floor: {
    label: 'Chạm mức sàn điện',
    message: 'Tiền điện sau làm tròn thấp hơn mức sàn nên hệ thống nâng lên mức sàn.',
  },
  water_below_floor: {
    label: 'Chạm mức sàn nước',
    message: 'Tiền nước sau làm tròn thấp hơn mức sàn nên hệ thống nâng lên mức sàn.',
  },
  policy_fallback_system: {
    label: 'Dùng chính sách toàn hệ thống',
    message: 'Không tìm thấy chính sách ở phạm vi thấp hơn nên hệ thống dùng chính sách toàn hệ thống.',
  },
  missing_occupants_for_billing: {
    label: 'Thiếu số người tính phí',
    message: 'Hợp đồng chưa có số người tính phí hợp lệ.',
  },
  device_surcharge_missing: {
    label: 'Thiếu phụ phí thiết bị',
    message: 'Phòng có thiết bị phù hợp nhưng chính sách chưa khai báo phụ phí tương ứng.',
  },
  ELECTRIC_FINAL_OVERRIDE: {
    label: 'Điện đã chốt tay',
    message: 'Tiền điện kỳ này đã được chốt thủ công, không dùng công thức tính.',
  },
  WATER_FINAL_OVERRIDE: {
    label: 'Nước đã chốt tay',
    message: 'Tiền nước kỳ này đã được chốt thủ công, không dùng công thức tính.',
  },
} as const;

const backendMessageMap: Array<{ pattern: RegExp; replacement: string }> = [
  {
    pattern: /Hop dong chua duoc chuan hoa sang utility policy\./i,
    replacement: 'Hợp đồng chưa dùng chế độ tính tiện ích theo chính sách.',
  },
  {
    pattern: /Hop dong thieu occupants_for_billing hop le\.?/i,
    replacement: 'Hợp đồng chưa có số người tính phí hợp lệ.',
  },
  {
    pattern: /Contract is missing a valid occupants_for_billing value/i,
    replacement: 'Hợp đồng chưa có số người tính phí hợp lệ.',
  },
  {
    pattern: /Contract not found/i,
    replacement: 'Không tìm thấy hợp đồng cần tính tiện ích.',
  },
  {
    pattern: /Room not found for this contract/i,
    replacement: 'Không tìm thấy phòng gắn với hợp đồng này.',
  },
  {
    pattern: /No active utility policy found for this contract/i,
    replacement: 'Không tìm thấy chính sách tiện ích đang áp dụng cho hợp đồng này.',
  },
  {
    pattern: /Thieu utility policy de tinh hoa don\./i,
    replacement: 'Chưa tìm thấy chính sách tiện ích phù hợp để tính hóa đơn.',
  },
  {
    pattern: /Contract does not overlap billing period\s+\d{4}-\d{2}\.?/i,
    replacement: 'Hợp đồng không giao với kỳ tính tiền đã chọn.',
  },
  {
    pattern: /billingPeriod must be in YYYY-MM format/i,
    replacement: 'Kỳ tính tiền phải theo định dạng YYYY-MM.',
  },
  {
    pattern: /dueDate must be in YYYY-MM-DD format/i,
    replacement: 'Hạn thanh toán phải theo định dạng YYYY-MM-DD.',
  },
  {
    pattern: /Failed to initialize billing run/i,
    replacement: 'Không thể khởi tạo đợt xuất hóa đơn tiện ích.',
  },
  {
    pattern: /Billing period is invalid\.?/i,
    replacement: 'Kỳ tính tiền không hợp lệ.',
  },
  {
    pattern: /Discount cannot exceed invoice subtotal/i,
    replacement: 'Giảm trừ không thể lớn hơn tổng tiền hóa đơn.',
  },
  {
    pattern: /Unknown billing error/i,
    replacement: 'Đã xảy ra lỗi không xác định khi tạo hóa đơn tiện ích.',
  },
  {
    pattern: /Missing Authorization header/i,
    replacement: 'Thiếu thông tin xác thực để chạy đợt xuất hóa đơn tiện ích.',
  },
  {
    pattern: /Invalid or expired token/i,
    replacement: 'Phiên đăng nhập đã hết hạn hoặc không còn hợp lệ.',
  },
  {
    pattern: /Failed to resolve caller profile/i,
    replacement: 'Không xác định được quyền của tài khoản hiện tại.',
  },
  {
    pattern: /Insufficient permissions/i,
    replacement: 'Tài khoản hiện tại không đủ quyền thực hiện thao tác này.',
  },
  {
    pattern: /Authentication failed/i,
    replacement: 'Xác thực không thành công khi gọi đợt xuất hóa đơn tiện ích.',
  },
  {
    pattern: /Method not allowed/i,
    replacement: 'Yêu cầu gửi lên không đúng phương thức cho phép.',
  },
  {
    pattern: /Khong tim thay access token de goi utility billing\./i,
    replacement: 'Không tìm thấy phiên đăng nhập hợp lệ để chạy tính tiền tiện ích.',
  },
  {
    pattern: /Khong lay duoc access token hop le de goi utility billing\./i,
    replacement: 'Không lấy được phiên đăng nhập hợp lệ để chạy tính tiền tiện ích.',
  },
  {
    pattern: /Supabase Auth khong xac nhan duoc access token hien tai cho utility billing\./i,
    replacement: 'Phiên đăng nhập hiện tại không còn hợp lệ để chạy tính tiền tiện ích.',
  },
  {
    pattern: /Supabase Auth khong cap lai duoc access token cho utility billing\./i,
    replacement: 'Không thể làm mới phiên đăng nhập để chạy tính tiền tiện ích.',
  },
  {
    pattern: /Utility billing bi tu choi xac thuc/i,
    replacement: 'Supabase đang từ chối xác thực khi gọi đợt xuất hóa đơn tiện ích.',
  },
  {
    pattern: /Tai khoan hien tai khong du quyen chay utility billing/i,
    replacement: 'Tài khoản hiện tại không đủ quyền chạy đợt xuất hóa đơn tiện ích.',
  },
  {
    pattern: /Utility billing tra ve loi xac thuc tu Supabase\./i,
    replacement: 'Supabase trả về lỗi xác thực khi chạy đợt xuất hóa đơn tiện ích.',
  },
  {
    pattern: /Khong the chay utility billing/i,
    replacement: 'Không thể chạy đợt xuất hóa đơn tiện ích.',
  },
  {
    pattern: /Failed to create utility policy/i,
    replacement: 'Không thể tạo chính sách tiện ích.',
  },
  {
    pattern: /Electric rounded amount is below the minimum floor and was raised to the floor\./i,
    replacement: 'Tiền điện sau làm tròn thấp hơn mức sàn nên hệ thống nâng lên mức sàn.',
  },
  {
    pattern: /Water rounded amount is below the minimum floor and was raised to the floor\./i,
    replacement: 'Tiền nước sau làm tròn thấp hơn mức sàn nên hệ thống nâng lên mức sàn.',
  },
  {
    pattern: /Billing used the system default utility policy\./i,
    replacement: 'Không tìm thấy chính sách ở phạm vi thấp hơn nên hệ thống dùng chính sách toàn hệ thống.',
  },
  {
    pattern: /Occupants for billing resolved to 0\./i,
    replacement: 'Hợp đồng chưa có số người tính phí hợp lệ.',
  },
  {
    pattern: /Room amenities resolved to device codes, but the policy has no matching device surcharge\./i,
    replacement: 'Phòng có thiết bị phù hợp nhưng chính sách chưa khai báo phụ phí tương ứng.',
  },
];

export function getUtilityScopeLabel(scopeType: string): string {
  return scopeLabels[scopeType as keyof typeof scopeLabels] ?? scopeType;
}

export function getUtilityPolicySourceLabel(sourceType: string): string {
  return sourceLabels[sourceType as keyof typeof sourceLabels] ?? sourceType;
}

export function getUtilityRunStatusLabel(status: string): string {
  return statusLabels[status.toLowerCase() as keyof typeof statusLabels] ?? status;
}

export function formatUtilityBillingMonthCompact(billingPeriod: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(billingPeriod);
  if (!match) return billingPeriod;
  return `${match[2]}/${match[1]}`;
}

export function formatUtilityBillingPeriod(billingPeriod: string): string {
  return `Tháng ${formatUtilityBillingMonthCompact(billingPeriod)}`;
}

export function formatUtilityDateTime(value: string | null | undefined): string {
  if (!value) return '--';
  return formatDate(value, 'dd/MM/yyyy HH:mm');
}

export function formatUtilityMonthList(months: string[]): string {
  if (!months.length) return 'Không chọn tháng';
  return months.map((month) => `Th${month}`).join(', ');
}

export function translateUtilityBackendMessage(message: string): string {
  const input = message.trim();
  if (!input) return 'Đã xảy ra lỗi tiện ích chưa xác định.';

  for (const entry of backendMessageMap) {
    if (entry.pattern.test(input)) {
      return entry.replacement;
    }
  }

  return input;
}

export function getUtilityWarningMeta(code: string, fallbackMessage?: string) {
  const meta = warningMeta[code as keyof typeof warningMeta];
  return {
    label: meta?.label ?? code,
    message: meta?.message ?? translateUtilityBackendMessage(fallbackMessage ?? code),
  };
}
