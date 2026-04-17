import { BillingMethod, ServiceType } from "@/types/service";
import { formatVND } from "@/utils/index";

export { formatVND };

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  FixedService: "Dich vu tinh tien",
  Utility: "Dien nuoc",
  Management: "Dich vu tinh tien",
  Amenity: "Tien ich dat cho",
  Optional: "Dich vu tinh tien",
};

export const SERVICE_TYPE_COLORS: Record<ServiceType, string> = {
  FixedService: "bg-amber-100 text-amber-800",
  Utility: "bg-sky-100 text-sky-800",
  Management: "bg-amber-100 text-amber-800",
  Amenity: "bg-teal-100 text-teal-800",
  Optional: "bg-orange-100 text-orange-800",
};

export const BILLING_METHOD_LABELS: Record<BillingMethod, string> = {
  Fixed: "Co dinh",
  PerPerson: "Theo nguoi",
  PerRoom: "Theo phong",
  PerUnit: "Theo so luong",
  PerM2: "Theo m2",
  Usage: "Theo su dung",
};

export const calcPriceChangePct = (oldPrice: number, newPrice: number): number => {
  if (oldPrice === 0) return newPrice > 0 ? 100 : 0;
  return Math.abs(((newPrice - oldPrice) / oldPrice) * 100);
};

export const isPriceChangeWarning = (oldPrice: number, newPrice: number): boolean =>
  calcPriceChangePct(oldPrice, newPrice) > 20;
