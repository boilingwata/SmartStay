export interface KnowledgeArticle {
  id: string;
  type: 'faq' | 'article';
  category: string;
  title: string;
  content: string;
  image?: string;
}

export const KNOWLEDGE_BASE_ARTICLES: KnowledgeArticle[] = [
  { 
    id: '1', 
    type: 'faq', 
    category: 'payment', 
    title: 'Làm thế nào để thanh toán hóa đơn?', 
    content: 'Bạn có thể vào mục "Hóa đơn", chọn hóa đơn chưa thanh toán và nhấn "Thanh toán ngay". Hệ thống hỗ trợ chuyển khoản ngân hàng và các ví điện tử.' 
  },
  { 
    id: '2', 
    type: 'faq', 
    category: 'issue', 
    title: 'Thời gian xử lý sự cố là bao lâu?', 
    content: 'Ban quản lý tiếp nhận yêu cầu 24/7. Các sự cố khẩn cấp sẽ được xử lý trong vòng 30 phút. Các yêu cầu khác sẽ được phản hồi trong vòng 4-8 giờ làm việc.' 
  },
  { 
    id: '3', 
    type: 'article', 
    category: 'utility', 
    title: 'Hướng dẫn sử dụng phòng Gym 24/7', 
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop', 
    content: '<p>Phòng Gym mở cửa 24/7 cho toàn bộ cư dân. Vui lòng mang theo thẻ từ hoặc mã QR cá nhân để check-in tại cửa.</p><ul><li>Không mang đồ ăn vào chuỗi phòng tập.</li><li>Dọn dẹp tạ sau khi sử dụng.</li></ul>' 
  },
  { 
    id: '4', 
    type: 'article', 
    category: 'contract', 
    title: 'Quy trình gia hạn hợp đồng thuê nhà', 
    image: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=400&auto=format&fit=crop', 
    content: '<p>Trước khi hợp đồng hết hạn 30 ngày, ban quản lý sẽ gửi thông báo. Bạn có thể gia hạn bằng cách điền form yêu cầu trực tuyến hoặc liên hệ trực tiếp BQL.</p>' 
  },
];
