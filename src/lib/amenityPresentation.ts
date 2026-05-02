export type AmenityBookingStatus = 'booked' | 'in_use' | 'completed' | 'cancelled';

const bookingStatusLabels: Record<AmenityBookingStatus, string> = {
  booked: 'Đã xác nhận',
  in_use: 'Đang sử dụng',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export function getAmenityBookingStatusLabel(status: string): string {
  return bookingStatusLabels[status as AmenityBookingStatus] ?? 'Không xác định';
}

export function getAmenityBookingStatusClass(status: string): string {
  switch (status) {
    case 'booked':
      return 'border-primary/20 bg-primary/10 text-primary';
    case 'in_use':
      return 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300';
    case 'completed':
      return 'border-border bg-muted text-muted-foreground';
    case 'cancelled':
      return 'border-destructive/20 bg-destructive/10 text-destructive';
    default:
      return 'border-border bg-muted text-muted-foreground';
  }
}

export function translateAmenityError(error: unknown, fallback = 'Không thể xử lý yêu cầu tiện ích.'): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
  const normalized = `${code} ${message}`.toLowerCase();

  if (normalized.includes('23505') || normalized.includes('conflict') || normalized.includes('duplicate')) {
    return 'Khung giờ này đã có người đặt. Vui lòng chọn khung giờ khác.';
  }

  if (normalized.includes('auth') || normalized.includes('jwt') || normalized.includes('unauthenticated')) {
    return 'Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.';
  }

  if (normalized.includes('permission') || normalized.includes('rls') || normalized.includes('forbidden')) {
    return 'Tài khoản hiện tại chưa có quyền thực hiện thao tác này.';
  }

  if (normalized.includes('network') || normalized.includes('fetch')) {
    return 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.';
  }

  return fallback;
}

export function getAmenityDisplayName(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed : 'Tiện ích chưa xác định';
}
