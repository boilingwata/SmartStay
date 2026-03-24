import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Search, 
  ChevronRight, 
  MessageSquare, 
  Phone, 
  Mail, 
  ChevronDown,
  Sparkles,
  BookOpen,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BottomSheet } from '@/components/portal/BottomSheet';
import { RichTextViewer } from '@/components/shared/RichTextEditor';

// Mock API Call
const fetchKnowledgeBase = async (category: string, search: string) => {
  // Simulate network delay
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
  { id: 'process', label: 'Quy trình' },
  { id: 'other', label: 'Khác' },
];

const Faq = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['knowledge-base', activeFilter, debouncedSearch],
    queryFn: () => fetchKnowledgeBase(activeFilter, debouncedSearch)
  });

  const faqs = results.filter(r => r.type === 'faq');
  const articles = results.filter(r => r.type === 'article');

  const handleFeedback = (isHelpful: boolean) => {
    toast.success('Cảm ơn phản hồi của bạn!');
    setSelectedArticle(null);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 animate-in fade-in slide-in-from-right-6 duration-700 font-sans">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl px-5 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-11 h-11 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition-all">
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Hỗ trợ & FAQ</h2>
        </div>
      </div>

      <div className="p-5 space-y-8 max-w-[430px] mx-auto pt-6">
        {/* Search & Hero Card */}
        <div className="relative p-7 bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <HelpCircle size={120} className="text-white rotate-12" />
          </div>
          <div className="relative z-10 space-y-5">
             <div className="space-y-1.5">
                <h3 className="text-[15px] font-black text-white uppercase tracking-[2px]">Cẩm nang cư dân</h3>
                <p className="text-[11px] font-bold text-slate-400">Tìm kiếm hướng dẫn và giải đáp thắc mắc</p>
             </div>
             <div className="relative">
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nhập từ khóa cần tìm..."
                  className="w-full h-14 pl-12 pr-4 bg-white/10 backdrop-blur-md border-none rounded-2xl text-white placeholder:text-white/40 font-bold text-sm focus:bg-white/20 outline-none transition-all ring-0"
                />
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
             </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {FAQ_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={cn(
                "whitespace-nowrap px-6 h-11 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all",
                activeFilter === cat.id 
                  ? "bg-[#0D8A8A] text-white shadow-lg shadow-[#0D8A8A]/30" 
                  : "bg-white text-slate-500 border border-slate-100 shadow-sm"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0D8A8A] rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Guide Articles */}
            {articles.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen size={16} className="text-[#0D8A8A]" /> Bài viết hướng dẫn
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {articles.map(article => (
                    <div 
                      key={article.id} 
                      onClick={() => setSelectedArticle(article)}
                      className="bg-white p-3 rounded-[24px] shadow-sm border border-slate-100 flex flex-col gap-3 group active:scale-95 transition-all overflow-hidden cursor-pointer"
                    >
                      {article.image ? (
                         <div className="w-full h-24 rounded-[16px] bg-slate-100 overflow-hidden relative">
                           <img src={article.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                         </div>
                      ) : (
                         <div className="w-full h-24 rounded-[16px] bg-teal-50 flex items-center justify-center text-teal-200">
                           <FileText size={32} />
                         </div>
                      )}
                      <h5 className="text-[12px] font-black text-slate-800 leading-tight line-clamp-2 px-1 pb-1">{article.title}</h5>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs Accordion */}
            {faqs.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare size={16} className="text-[#0D8A8A]" /> Câu hỏi thường gặp
                </h4>
                <div className="space-y-3">
                   {faqs.map((faq) => (
                      <div 
                        key={faq.id}
                        className={cn(
                          "bg-white rounded-[24px] transition-all overflow-hidden border",
                          openIndex === faq.id ? "border-[#0D8A8A]/30 shadow-md shadow-slate-200" : "border-slate-100 shadow-sm"
                        )}
                      >
                         <button 
                           onClick={() => setOpenIndex(openIndex === faq.id ? null : faq.id)}
                           className="w-full p-5 flex items-start justify-between gap-4 text-left group"
                         >
                            <span className={cn(
                              "text-[13px] font-black leading-snug pt-0.5",
                              openIndex === faq.id ? "text-[#0D8A8A]" : "text-slate-800"
                            )}>
                               {faq.title}
                            </span>
                            <div className={cn(
                              "w-7 h-7 shrink-0 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 transition-all",
                              openIndex === faq.id && "bg-teal-50 text-[#0D8A8A] rotate-180"
                            )}>
                               <ChevronDown size={14} strokeWidth={3} />
                            </div>
                         </button>
                         
                         <div className={cn(
                           "px-5 transition-all duration-300 ease-in-out",
                           openIndex === faq.id ? "max-h-[300px] pb-5 opacity-100" : "max-h-0 opacity-0"
                         )}>
                            <div className="p-4 bg-slate-50/50 rounded-2xl text-[12px] font-medium text-slate-600 leading-relaxed italic border border-slate-100">
                              {faq.content}
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
              </div>
            )}
            
            {results.length === 0 && (
               <div className="text-center py-10 opacity-50">
                  <HelpCircle size={40} className="mx-auto text-slate-300 ring-4 ring-slate-100 rounded-full mb-3" />
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Không tìm thấy kết quả</p>
               </div>
            )}
          </div>
        )}

      </div>

      {/* Article Detail Bottom Sheet */}
      <BottomSheet isOpen={!!selectedArticle} onClose={() => setSelectedArticle(null)} title="Chi tiết cẩm nang">
        {selectedArticle && (
          <div className="space-y-6 py-2 pb-10 max-h-[80vh] overflow-y-auto no-scrollbar font-sans px-2">
             <div className="space-y-4">
               {selectedArticle.image && (
                 <div className="w-full h-48 rounded-[24px] overflow-hidden mb-6 shadow-sm border border-slate-100">
                   <img src={selectedArticle.image} alt="" className="w-full h-full object-cover" />
                 </div>
               )}
               <h3 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">{selectedArticle.title}</h3>
               <div className="prose prose-slate prose-sm max-w-none text-slate-600 font-medium">
                 <RichTextViewer html={selectedArticle.content} />
               </div>
             </div>

             <div className="pt-8 border-t border-slate-100">
                <p className="text-center text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">Bài viết này có giúp ích không?</p>
                <div className="flex gap-3 justify-center">
                   <button 
                     onClick={() => handleFeedback(true)}
                     className="flex-1 h-12 max-w-[140px] bg-teal-50 text-[#0D8A8A] border border-teal-100 rounded-[16px] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-teal-100 active:scale-95 transition-all"
                   >
                      <ThumbsUp size={16} /> Có
                   </button>
                   <button 
                     onClick={() => handleFeedback(false)}
                     className="flex-1 h-12 max-w-[140px] bg-slate-50 text-slate-500 border border-slate-200 rounded-[16px] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 active:scale-95 transition-all"
                   >
                      <ThumbsDown size={16} /> Không
                   </button>
                </div>
             </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default Faq;
