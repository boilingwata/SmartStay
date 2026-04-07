import {
  AlertTriangle,
  BellRing,
  FileQuestion,
  Home,
  type LucideIcon,
  ShieldAlert,
  Wrench,
} from 'lucide-react';

import type { TicketPriority, TicketType } from '@/models/Ticket';

export type TicketCategoryMeta = {
  id: TicketType;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  accentClassName: string;
  badgeClassName: string;
  suggestedPriority: TicketPriority;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  helperPoints: string[];
  illustration: string;
};

export const TICKET_CATEGORY_META: Record<TicketType, TicketCategoryMeta> = {
  Maintenance: {
    id: 'Maintenance',
    label: 'Sửa chữa và bảo trì',
    shortLabel: 'Sửa chữa',
    description: 'Dùng khi thiết bị, nội thất hoặc hạ tầng phòng đang hư hỏng, xuống cấp hoặc cần kiểm tra kỹ thuật.',
    icon: Wrench,
    accentClassName: 'from-teal-500 via-cyan-500 to-sky-500',
    badgeClassName: 'bg-teal-50 text-teal-700 border-teal-200',
    suggestedPriority: 'Medium',
    titlePlaceholder: 'Ví dụ: Máy lạnh không mát từ tối qua',
    descriptionPlaceholder: 'Mô tả vị trí hư hỏng, thời điểm bắt đầu xảy ra, tình trạng hiện tại và mức độ ảnh hưởng.',
    helperPoints: [
      'Chụp rõ vị trí hư hỏng hoặc mã thiết bị nếu có.',
      'Nêu thời điểm bắt đầu xảy ra và đã thử xử lý gì chưa.',
      'Cho biết sự cố ảnh hưởng sinh hoạt ở mức nào.',
    ],
    illustration: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop',
  },
  Complaint: {
    id: 'Complaint',
    label: 'Phản ánh và khiếu nại',
    shortLabel: 'Phản ánh',
    description: 'Dùng khi cần phản ánh thái độ phục vụ, tiếng ồn, vệ sinh, an ninh hoặc chất lượng vận hành.',
    icon: BellRing,
    accentClassName: 'from-amber-500 via-orange-500 to-rose-500',
    badgeClassName: 'bg-amber-50 text-amber-700 border-amber-200',
    suggestedPriority: 'High',
    titlePlaceholder: 'Ví dụ: Hành lang tầng 3 có mùi hôi kéo dài',
    descriptionPlaceholder: 'Nêu rõ sự việc, thời gian xảy ra, khu vực liên quan và mong muốn hỗ trợ cụ thể.',
    helperPoints: [
      'Nêu chính xác thời gian, khu vực và tần suất xảy ra.',
      'Nếu liên quan người khác, mô tả hành vi thay vì suy đoán.',
      'Ảnh hoặc video nên chụp toàn cảnh và chi tiết.',
    ],
    illustration: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1200&auto=format&fit=crop',
  },
  ServiceRequest: {
    id: 'ServiceRequest',
    label: 'Yêu cầu dịch vụ',
    shortLabel: 'Dịch vụ',
    description: 'Dùng để đặt lịch hỗ trợ, vệ sinh, kiểm tra thiết bị, cấp thêm vật dụng hoặc nhờ ban quản lý hỗ trợ dịch vụ.',
    icon: Home,
    accentClassName: 'from-blue-500 via-sky-500 to-cyan-500',
    badgeClassName: 'bg-sky-50 text-sky-700 border-sky-200',
    suggestedPriority: 'Medium',
    titlePlaceholder: 'Ví dụ: Cần hỗ trợ kiểm tra máy nước nóng',
    descriptionPlaceholder: 'Mô tả dịch vụ cần hỗ trợ, thời gian mong muốn và người liên hệ khi nhân viên đến.',
    helperPoints: [
      'Ghi rõ khung giờ mong muốn để ban quản lý sắp lịch.',
      'Nếu cần vào phòng, cho biết người liên hệ tại chỗ.',
      'Ảnh minh họa giúp nhân viên chuẩn bị đúng dụng cụ.',
    ],
    illustration: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop',
  },
  Inquiry: {
    id: 'Inquiry',
    label: 'Hỏi đáp và thông tin',
    shortLabel: 'Hỏi đáp',
    description: 'Dùng khi cần hỏi thủ tục, nội quy, hóa đơn, hợp đồng, tiện ích hoặc các thông tin vận hành chung.',
    icon: FileQuestion,
    accentClassName: 'from-violet-500 via-indigo-500 to-blue-500',
    badgeClassName: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    suggestedPriority: 'Low',
    titlePlaceholder: 'Ví dụ: Xin hướng dẫn quy trình đăng ký khách qua đêm',
    descriptionPlaceholder: 'Nêu rõ câu hỏi hoặc nội dung cần xác nhận để ban quản lý phản hồi chính xác.',
    helperPoints: [
      'Đặt câu hỏi ngắn gọn, một mục tiêu chính mỗi ticket.',
      'Đính kèm ảnh chứng từ nếu đang hỏi về thủ tục hoặc phí.',
      'Ghi rõ hạn cần phản hồi nếu có liên quan lịch cá nhân.',
    ],
    illustration: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1200&auto=format&fit=crop',
  },
  Emergency: {
    id: 'Emergency',
    label: 'Khẩn cấp',
    shortLabel: 'Khẩn cấp',
    description: 'Dùng cho rò điện, rò nước nghiêm trọng, cháy nổ, khóa cửa kẹt hoặc sự cố ảnh hưởng an toàn ngay lập tức.',
    icon: ShieldAlert,
    accentClassName: 'from-rose-600 via-red-500 to-orange-500',
    badgeClassName: 'bg-rose-50 text-rose-700 border-rose-200',
    suggestedPriority: 'Critical',
    titlePlaceholder: 'Ví dụ: Nước tràn mạnh từ trần phòng ngủ',
    descriptionPlaceholder: 'Mô tả nguy cơ hiện tại, khu vực bị ảnh hưởng, đã ngắt điện hoặc khóa van chưa và số điện thoại cần liên hệ ngay.',
    helperPoints: [
      'Ưu tiên ảnh thể hiện mức độ nguy hiểm và phạm vi ảnh hưởng.',
      'Nêu ngay nếu có người bị kẹt, có mùi khét, tia lửa hoặc nước ngập.',
      'Sau khi gửi ticket, nên gọi hotline/BQL để xử lý tức thời.',
    ],
    illustration: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop',
  },
};

export const TICKET_CATEGORY_OPTIONS = Object.values(TICKET_CATEGORY_META);

export const PRIORITY_LABELS_VI: Record<TicketPriority, string> = {
  Low: 'Thấp',
  Medium: 'Trung bình',
  High: 'Cao',
  Critical: 'Khẩn cấp',
};

export const PRIORITY_HINTS_VI: Record<TicketPriority, string> = {
  Low: 'Vấn đề không gấp, có thể xử lý theo lịch.',
  Medium: 'Ảnh hưởng vừa phải, nên xử lý trong ngày hoặc ca gần nhất.',
  High: 'Ảnh hưởng rõ rệt đến sinh hoạt hoặc vận hành.',
  Critical: 'Ưu tiên xử lý ngay vì liên quan an toàn hoặc gián đoạn nghiêm trọng.',
};

export function getTicketCategoryMeta(type?: TicketType | ''): TicketCategoryMeta {
  return TICKET_CATEGORY_META[(type || 'Maintenance') as TicketType];
}

export function getTicketTypeLabel(type?: TicketType | ''): string {
  if (!type) return 'Chưa phân loại';
  return getTicketCategoryMeta(type).label;
}

export function buildTicketAttachmentSummary(files: File[]): string {
  const totalSizeMb = files.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024;
  if (files.length === 0) return 'Chưa có hình ảnh đính kèm';
  return `${files.length} tệp, ${totalSizeMb.toFixed(1)} MB`;
}

export const TICKET_IMAGE_LIMIT = 4;
