/**
 * Danh sách các error codes được coi là "mất kết nối mạng".
 * Những lỗi này KHÔNG phải bug code — không cần log Sentry.
 */
const NETWORK_ERROR_MESSAGES = [
  'Failed to fetch',
  'NetworkError',
  'Network request failed',
  'ERR_INTERNET_DISCONNECTED',
  'ERR_NAME_NOT_RESOLVED',
  'ERR_ADDRESS_UNREACHABLE',
  'ERR_NETWORK_CHANGED',
  'Load failed', // Safari
] as const;

/**
 * Kiểm tra xem một error có phải là lỗi mạng hay không.
 * Sử dụng để phân biệt "mất internet" vs "chưa đăng nhập" vs bug code.
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const msg = error.message ?? '';
  return NETWORK_ERROR_MESSAGES.some((pattern) => msg.includes(pattern));
}

/**
 * Lấy message thân thiện cho user khi mất mạng.
 */
export function getNetworkErrorMessage(): string {
  return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.';
}
