import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format number to VND currency
 */
export const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Format date to standard SmartStay format
 */
export const formatDate = (date: Date | string | number | null | undefined, formatStr: string = 'dd/MM/yyyy'): string => {
  if (!date || date === '--') return '--';
  try {
     const d = new Date(date);
     if (isNaN(d.getTime())) return '--';
     return format(d, formatStr, { locale: vi });
  } catch {
     return '--';
  }
};

/**
 * Format a date value for <input type="datetime-local"> in local time.
 */
export const formatDateTimeLocalValue = (
  date: Date | string | number | null | undefined = new Date(),
): string => {
  const parsed = date ? new Date(date) : new Date();
  if (Number.isNaN(parsed.getTime())) {
    return formatDateTimeLocalValue(new Date());
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Convert a local datetime-local input value to an ISO string for storage.
 */
export const toIsoFromDateTimeLocal = (value: string, fallback: Date = new Date()): string => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback.toISOString() : parsed.toISOString();
};

/**
 * Mask CCCD/ID Card number for security (Requirement: Mask first 8 chars)
 */
export const maskCCCD = (id: string): string => {
  if (!id || id.length < 12) return id;
  return '********' + id.substring(8);
};

/**
 * Mask Phone number (Hide middle numbers)
 */
export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 9) return phone;
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 3);
};

import { differenceInYears, formatDistanceToNow } from 'date-fns';
export const calculateAge = (dob: string | Date | null | undefined): string => {
  if (!dob || dob === '--') return '--';
  try {
     const d = new Date(dob);
     if (isNaN(d.getTime())) return '--';
     const age = differenceInYears(new Date(), d);
     return `${age} tuổi`;
  } catch {
     return '--';
  }
};

/**
 * Format relative time (e.g. "2 mins ago")
 */
export const formatRelativeTime = (date: string | Date | null | undefined): string => {
  if (!date || date === '--') return '--';
  try {
     const d = new Date(date);
     if (isNaN(d.getTime())) return '--';
     return formatDistanceToNow(d, { addSuffix: true, locale: vi });
  } catch {
     return '--';
  }
};

/**
 * Format number to percentage
 */
export const formatPercentage = (val: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(val / 100);
};

export * from './textEncoding';
