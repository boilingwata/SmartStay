import { z } from 'zod';

/**
 * 6.1 Zod Schemas Quan Trong
 */

// Contract Form Schema
export const contractSchema = z.object({
  contractCode: z.string().regex(/^HD-[A-Z0-9]+-\d{4}-\d{4}$/, "Mã hợp đồng không đúng định dạng (VD: HD-BUILDING-2024-0001)"),
  startDate: z.coerce.date({ required_error: "Vui lòng chọn ngày bắt đầu" }),
  endDate: z.coerce.date({ required_error: "Vui lòng chọn ngày kết thúc" }),
  rentPrice: z.number({ required_error: "Vui lòng nhập giá thuê" }).positive("Giá thuê phải lớn hơn 0"),
  paymentCycle: z.enum(["1", "2", "3", "6", "12"], { required_error: "Vui lòng chọn kỳ thanh toán" }),
  depositAmount: z.number().min(0, "Tiền cọc phải >= 0"),
}).refine(d => d.endDate > d.startDate, {
  message: "Ngày kết thúc phải sau ngày bắt đầu",
  path: ["endDate"]
});

// Meter Reading Form Schema
export const meterReadingSchema = z.object({
  currentIndex: z.number({ required_error: "Vui lòng nhập chỉ số mới" }).min(0, "Chỉ số phải >= 0"),
  previousIndex: z.number({ required_error: "Vui lòng nhập chỉ số cũ" }).min(0, "Chỉ số phải >= 0"),
  monthYear: z.string().regex(/^\d{4}-\d{2}$/, "Định dạng tháng/năm không đúng (YYYY-MM)"),
  readingDate: z.coerce.date().max(new Date(), "Ngày chốt số không được vượt quá hôm nay"),
}).refine(d => d.currentIndex >= d.previousIndex, {
  message: "Chỉ số hiện tại không được nhỏ hơn chỉ số trước",
  path: ["currentIndex"]
});

/**
 * 6.2 Global Validation Rules & Helpers
 */

export const globalRules = {
  // CCCD: 12 số
  cccd: z.string().regex(/^\d{12}$/, "CCCD phải có đúng 12 chữ số"),
  
  // Phone VN
  phoneVN: z.string().regex(/(?:\+84|0)(?:\d){9,10}$/, "Số điện thoại không hợp lệ"),
  
  // Email
  email: z.string().email("Email không hợp lệ"),
  
  // Password Complexity
  password: z.string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
    .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 chữ số")
    .regex(/[^A-Za-z0-9]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt"),
    
  // File Validation
  imageFile: z.instanceof(File)
    .refine(file => file.size <= 5 * 1024 * 1024, "File ảnh tối đa 5MB")
    .refine(file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type), "Định dạng ảnh phải là JPG/PNG/WEBP"),
    
  pdfFile: z.instanceof(File)
    .refine(file => file.size <= 10 * 1024 * 1024, "File PDF tối đa 10MB")
    .refine(file => file.type === 'application/pdf', "Định dạng phải là PDF"),
};
