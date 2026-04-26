import {
  AlertTriangle,
  BellRing,
  FileQuestion,
  Home,
  ShieldAlert,
  Wrench,
  type LucideIcon,
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
    description:
      'Dùng khi thiết bị, nội thất hoặc hạ tầng trong phòng đang hư hỏng, xuống cấp hoặc cần kiểm tra kỹ thuật.',
    icon: Wrench,
    accentClassName: 'from-teal-500 via-cyan-500 to-sky-500',
    badgeClassName: 'bg-teal-50 text-teal-700 border-teal-200',
    suggestedPriority: 'Medium',
    titlePlaceholder: 'Ví dụ: Máy lạnh không mát từ tối qua',
    descriptionPlaceholder:
      'Mô tả vị trí hư hỏng, thời điểm bắt đầu, tình trạng hiện tại và mức độ ảnh hưởng đến sinh hoạt.',
    helperPoints: [
      'Chụp rõ vị trí hư hỏng hoặc thiết bị cần kiểm tra.',
      'Nêu thời điểm bắt đầu xảy ra và việc bạn đã tự xử lý trước đó.',
      'Cho biết sự cố ảnh hưởng thế nào đến việc sử dụng phòng.',
    ],
    illustration:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop',
  },
  Complaint: {
    id: 'Complaint',
    label: 'Phản ánh và khiếu nại',
    shortLabel: 'Phản ánh',
    description:
      'Dùng khi cần phản ánh tiếng ồn, vệ sinh, an ninh, thái độ phục vụ hoặc vấn đề vận hành gây khó chịu.',
    icon: BellRing,
    accentClassName: 'from-amber-500 via-orange-500 to-rose-500',
    badgeClassName: 'bg-amber-50 text-amber-700 border-amber-200',
    suggestedPriority: 'High',
    titlePlaceholder: 'Ví dụ: Hành lang tầng 3 có mùi hôi kéo dài',
    descriptionPlaceholder:
      'Nêu rõ sự việc, thời gian xảy ra, khu vực liên quan và mong muốn được hỗ trợ như thế nào.',
    helperPoints: [
      'Ghi đúng thời gian, địa điểm và tần suất xảy ra.',
      'Mô tả sự việc theo quan sát thực tế, tránh suy đoán.',
      'Nếu có ảnh hoặc video, nên chụp cả toàn cảnh và chi tiết.',
    ],
    illustration:
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1200&auto=format&fit=crop',
  },
  ServiceRequest: {
    id: 'ServiceRequest',
    label: 'Yêu cầu dịch vụ',
    shortLabel: 'Dịch vụ',
    description:
      'Dùng để đặt lịch hỗ trợ, vệ sinh, kiểm tra thiết bị hoặc nhờ ban quản lý hỗ trợ một nhu cầu phục vụ cụ thể.',
    icon: Home,
    accentClassName: 'from-blue-500 via-sky-500 to-cyan-500',
    badgeClassName: 'bg-sky-50 text-sky-700 border-sky-200',
    suggestedPriority: 'Medium',
    titlePlaceholder: 'Ví dụ: Cần hỗ trợ kiểm tra máy nước nóng',
    descriptionPlaceholder:
      'Mô tả rõ dịch vụ cần hỗ trợ, thời gian mong muốn và người liên hệ khi nhân viên đến.',
    helperPoints: [
      'Cho biết khung giờ thuận tiện để nhân viên đến hỗ trợ.',
      'Nếu cần vào phòng, hãy để lại người liên hệ tại chỗ.',
      'Ảnh minh họa giúp nhân viên chuẩn bị đúng dụng cụ.',
    ],
    illustration:
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop',
  },
  Inquiry: {
    id: 'Inquiry',
    label: 'Hỏi đáp và thông tin',
    shortLabel: 'Hỏi đáp',
    description:
      'Dùng khi cần hỏi thủ tục, nội quy, hóa đơn, hợp đồng, tiện ích hoặc thông tin vận hành chung.',
    icon: FileQuestion,
    accentClassName: 'from-violet-500 via-indigo-500 to-blue-500',
    badgeClassName: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    suggestedPriority: 'Low',
    titlePlaceholder: 'Ví dụ: Xin hướng dẫn quy trình đăng ký khách qua đêm',
    descriptionPlaceholder:
      'Nêu rõ câu hỏi hoặc nội dung cần xác nhận để ban quản lý phản hồi chính xác hơn.',
    helperPoints: [
      'Mỗi yêu cầu nên tập trung vào một câu hỏi chính.',
      'Nếu liên quan hồ sơ hoặc chi phí, hãy đính kèm hình minh họa nếu có.',
      'Ghi rõ thời điểm cần phản hồi nếu có liên quan kế hoạch cá nhân.',
    ],
    illustration:
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1200&auto=format&fit=crop',
  },
  Emergency: {
    id: 'Emergency',
    label: 'Khẩn cấp',
    shortLabel: 'Khẩn cấp',
    description:
      'Dùng cho rò điện, rò nước nghiêm trọng, cháy nổ, khóa cửa kẹt hoặc sự cố ảnh hưởng an toàn ngay lập tức.',
    icon: ShieldAlert,
    accentClassName: 'from-rose-600 via-red-500 to-orange-500',
    badgeClassName: 'bg-rose-50 text-rose-700 border-rose-200',
    suggestedPriority: 'Critical',
    titlePlaceholder: 'Ví dụ: Nước tràn mạnh từ trần phòng ngủ',
    descriptionPlaceholder:
      'Mô tả nguy cơ hiện tại, khu vực bị ảnh hưởng, các bước bạn đã xử lý khẩn cấp và số liên hệ ngay.',
    helperPoints: [
      'Ưu tiên ảnh cho thấy mức độ nguy hiểm và phạm vi ảnh hưởng.',
      'Nêu ngay nếu có tia lửa, mùi khét, nước ngập hoặc người bị kẹt.',
      'Sau khi gửi yêu cầu, nên gọi hotline hoặc ban quản lý để được hỗ trợ ngay.',
    ],
    illustration:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop',
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

export const TICKET_CATEGORY_ICONS = {
  Maintenance: Wrench,
  Complaint: BellRing,
  ServiceRequest: Home,
  Inquiry: FileQuestion,
  Emergency: AlertTriangle,
};
