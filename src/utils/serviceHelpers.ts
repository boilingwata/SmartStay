import { ServiceType, BillingMethod } from "@/types/service";

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  Utility: "Tiện ích",
  Management: "Quản lý",
  Amenity: "Tiện nghi",
  Optional: "Tùy chọn",
};

export const SERVICE_TYPE_COLORS: Record<ServiceType, string> = {
  Utility: "bg-blue-100 text-blue-800",
  Management: "bg-purple-100 text-purple-800",
  Amenity: "bg-teal-100 text-teal-800",
  Optional: "bg-orange-100 text-orange-800",
};

export const BILLING_METHOD_LABELS: Record<BillingMethod, string> = {
  Fixed: "Cố định",
  PerPerson: "Theo người",
  PerM2: "Theo m²",
  Metered: "Theo chỉ số",
  Usage: "Theo lần dùng",
};

export const formatVND = (amount: number): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);

export const calcPriceChangePct = (oldPrice: number, newPrice: number): number =>
  Math.abs(((newPrice - oldPrice) / oldPrice) * 100);

export const isPriceChangeWarning = (oldPrice: number, newPrice: number): boolean =>
  calcPriceChangePct(oldPrice, newPrice) > 20;
