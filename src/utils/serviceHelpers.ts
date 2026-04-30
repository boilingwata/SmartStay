import { BillingMethod, ServiceType } from "@/types/service";
import { formatVND } from "@/utils/index";

export { formatVND };

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  FixedService: "Dịch vụ tính tiền",
  Utility: "Điện nước",
  Management: "Dịch vụ quản lý",
  Amenity: "Tiện ích đặt chỗ",
  Optional: "Dịch vụ tùy chọn",
};

export const SERVICE_TYPE_COLORS: Record<ServiceType, string> = {
  FixedService: "bg-amber-100 text-amber-800",
  Utility: "bg-sky-100 text-sky-800",
  Management: "bg-amber-100 text-amber-800",
  Amenity: "bg-teal-100 text-teal-800",
  Optional: "bg-orange-100 text-orange-800",
};

export const BILLING_METHOD_LABELS: Record<BillingMethod, string> = {
  Fixed: "Cố định",
  PerPerson: "Theo người",
  PerRoom: "Theo phòng",
  PerUnit: "Theo số lượng",
  PerM2: "Theo m²",
  Usage: "Theo sử dụng",
};

export const calcPriceChangePct = (oldPrice: number, newPrice: number): number => {
  if (oldPrice === 0) return newPrice > 0 ? 100 : 0;
  return Math.abs(((newPrice - oldPrice) / oldPrice) * 100);
};

export const isPriceChangeWarning = (oldPrice: number, newPrice: number): boolean =>
  calcPriceChangePct(oldPrice, newPrice) > 20;
