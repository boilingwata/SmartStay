import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  MessageSquare, 
  Phone, 
  ChevronDown,
  BookOpen,
  ArrowLeft,
  FileText,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { BottomSheet } from '@/components/portal/BottomSheet';
import { RichTextViewer } from '@/components/shared/RichTextEditor';
import { m, AnimatePresence } from 'framer-motion';

// Mock API Call
const fetchKnowledgeBase = async (category: string, search: string) => {
  await new Promise(res => setTimeout(res, 500));
  const allArticles = [
    { id: '1', type: 'faq', category: 'payment', title: 'Làm thế nào để thanh toán hóa đơn?', content: 'Bạn có thể vào mục "Hóa đơn", chọn hóa đơn chưa thanh toán và nhấn "Thanh toán ngay". Hệ thống hỗ trợ chuyển khoản ngân hàng và các ví điện tử.' },
    { id: '2', type: 'faq', category: 'issue', title: 'Thời gian xử lý sự cố là bao lâu?', content: 'Ban quản lý tiếp nhận yêu cầu 24/7. Các sự cố khẩn cấp sẽ được xử lý trong vòng 30 phút. Các yêu cầu khác sẽ được phản hồi trong vòng 4-8 giờ làm việc.' },
    { id: '3', type: 'article', category: 'utility', title: 'Hướng dẫn sử dụng phòng Gym 24/7', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop', content: '<p>Phòng Gym mở cửa 24/7 cho toàn bộ cư dân. Vui lòng mang theo thẻ từ hoặc mã QR cá nhân để check-in tại cửa.</p><ul><li>Không mang đồ ăn vào chuỗi phòng tập.</li><li>Dọn dẹp tạ sau khi sử dụng.</li></ul>' },
    { id: '4', type: 'article', category: 'contract', title: 'Quy trình gia hạn hợp đồng thuê nhà', image: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=400&auto=format&fit=crop', content: '<p>Trước khi hợp đồng hết hạn 30 ngày, ban quản lý sẽ gửi thông báo. Bạn có thể gia hạn bằng cách điền form yêu cầu trực tuyến hoặc liên hệ trực tiếp BQL.</p>' },
  ];
  return allArticles.filter(a => {
    const matchCat = category === 'all' || a.category === category;
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });
};

const FAQ_CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'payment', label: 'Thanh toán' },
  { id: 'utility', label: 'Tiện ích' },
  { id: 'issue', label: 'Sự cố' },
  { id: 'contract', label: 'Hợp đồng' },
];

const Faq = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['kb-articles', activeFilter, searchQuery],
    queryFn: () => fetchKnowledgeBase(activeFilter, searchQuery)
  });

  const faqs = results.filter(a => a.type === 'faq') || [];
  const guides = results.filter(a => a.type === 'article') || [];

  return (
    <div className="min-h-screen bg-white pb-32 animate-in fade-in slide-in-from-right-6 duration-700 font-sans">
      {/* F.15.1 Search Header */}
      <div className="bg-[#0D8A8A] rounded-b-[40px] px-6 pt-6 pb-12 shadow-2xl shadow-teal-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
           <HelpCircle size={160} strokeWidth={1} className="text-white" />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white backdrop-blur-md border border-white/20 active:scale-95 transition-all">
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-base font-black text-white tracking-tight uppercase">Trung tâm hỗ trợ</h2>
          </div>

          <div className="space-y-4">
             <h3 className="text-2xl font-black text-white leading-tight">Chúng tôi có thể <br/> giúp gì cho bạn?</h3>
             <div className="relative flex items-center">
                <Search size={18} className="absolute left-5 text-teal-200" />
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm câu hỏi hoặc bài viết..."
                  className="w-full h-14 pl-14 pr-5 bg-white/10 border border-white/20 rounded-[20px] text-white font-bold placeholder:text-teal-100/40 focus:bg-white focus:text-slate-800 focus:placeholder:text-slate-400 outline-none transition-all focus:ring-4 focus:ring-white/10"
                />
             </div>
          </div>
        </div>
      </div>

      {/* Category Chips */}
      <div className="px-5 -mt-6 relative z-20">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          {FAQ_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={cn(
                "px-5 h-10 rounded-full text-[10px] font-black uppercase tracking-widest border whitespace-nowrap transition-all shadow-lg",
                activeFilter === cat.id 
                  ? "bg-slate-900 border-slate-900 text-white" 
                  : "bg-white border-gray-100 text-slate-400 shadow-slate-200/50"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-10">
        {/* F.15.2 Accordion FAQ */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={16} className="text-teal-600" />
            <h4 className="text-[11px] font-black uppercase tracking-[3px] text-slate-400">Câu hỏi thường gặp</h4>
          </div>

          <div className="space-y-1">
            {isLoading ? (
               Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-2xl" />)
            ) : faqs.length > 0 ? (
              faqs.map((faq) => {
                const isOpen = openId === faq.id;
                return (
                  <div key={faq.id} className="border-b border-gray-100 overflow-hidden">
                    <button 
                      onClick={() => setOpenId(isOpen ? null : faq.id)}
                      className="w-full py-5 flex items-center justify-between text-left group transition-all"
                    >
                      <span className={cn(
                        "text-[14px] font-black tracking-tight transition-colors",
                        isOpen ? "text-teal-600" : "text-slate-700 group-hover:text-slate-900"
                      )}>{faq.title}</span>
                      <div className={cn(
                         "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                         isOpen ? "bg-teal-50 text-teal-600 rotate-180" : "bg-gray-50 text-slate-300"
                      )}>
                         <ChevronDown size={14} strokeWidth={3} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <m.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          <div className="pb-6 text-[13px] text-slate-500 font-medium leading-relaxed italic">
                            {faq.content}
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            ) : (
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest text-center py-10">Không tìm thấy kết quả</p>
            )}
          </div>
        </section>

        {/* Knowledge Articles */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} className="text-teal-600" />
            <h4 className="text-[11px] font-black uppercase tracking-[3px] text-slate-400">Cẩm nang cư dân</h4>
          </div>

          <div className="grid grid-cols-1 gap-5">
             {guides.map((guide) => (
                <div 
                  key={guide.id}
                  onClick={() => setSelectedArticle(guide)}
                  className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden group active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex gap-4 p-4">
                     <div className="w-20 h-20 rounded-[24px] overflow-hidden shrink-0 border border-gray-50 flex items-center justify-center bg-teal-50">
                        {guide.image ? (
                           <img src={guide.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                        ) : (
                           <FileText size={24} className="text-teal-600" />
                        )}
                     </div>
                     <div className="flex-1 space-y-2 py-1">
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black uppercase text-teal-600 tracking-widest">{guide.category}</span>
                           <span className="w-1 h-1 bg-slate-200 rounded-full" />
                           <span className="text-[9px] font-bold text-slate-400 uppercase">Bài viết</span>
                        </div>
                        <h4 className="text-[14px] font-black text-slate-800 leading-tight tracking-tight uppercase line-clamp-2">{guide.title}</h4>
                     </div>
                     <div className="shrink-0 flex items-center px-1">
                        <ChevronRight size={18} className="text-slate-200 group-hover:text-teal-600 transition-colors" />
                     </div>
                  </div>
                </div>
             ))}
          </div>
        </section>

        {/* Contact Hero */}
        <div className="p-8 bg-slate-900 rounded-[40px] text-center space-y-6 relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
           
           <div className="space-y-2">
             <h4 className="text-white text-xl font-black uppercase tracking-tight">Vẫn cần hỗ trợ?</h4>
             <p className="text-slate-400 text-xs font-medium max-w-[200px] mx-auto leading-relaxed">Đừng ngần ngại liên hệ trực tiếp với chúng tôi bất cứ lúc nào.</p>
           </div>

           <div className="flex gap-3">
              <button className="flex-1 h-14 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-white font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                <Phone size={14} className="text-teal-400" /> Hotline
              </button>
              <button className="flex-1 h-14 bg-teal-600 rounded-2xl flex items-center justify-center gap-2 text-white font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-teal-600/20">
                <MessageSquare size={14} /> Chat ngay
              </button>
           </div>
        </div>
      </div>

      <BottomSheet isOpen={!!selectedArticle} onClose={() => setSelectedArticle(null)} title="Chi tiết bài viết">
        {selectedArticle && (
          <div className="space-y-6 pb-10 px-2">
             {selectedArticle.image && (
               <div className="h-48 rounded-[32px] overflow-hidden border border-gray-100 shadow-sm">
                  <img src={selectedArticle.image} className="w-full h-full object-cover" alt="" />
               </div>
             )}
             <div className="space-y-4">
                <span className="px-3 py-1 bg-teal-50 rounded-lg text-[10px] font-black uppercase tracking-widest text-[#0D8A8A]">
                  {selectedArticle.category}
                </span>
                <h3 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight">
                  {selectedArticle.title}
                </h3>
             </div>
             <div className="prose prose-slate max-w-none text-slate-600 font-medium text-sm leading-relaxed">
               <RichTextViewer html={selectedArticle.content} />
             </div>
             <button 
                onClick={() => setSelectedArticle(null)}
                className="w-full h-14 bg-slate-900 text-white rounded-[20px] font-black uppercase tracking-[2px] text-[10px] active:scale-95 transition-all shadow-xl shadow-slate-900/10"
              >
                Đã hiểu
              </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default Faq;
