import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Megaphone, 
  Search, 
  ChevronRight,
  AlertTriangle,
  Pin,
  Share2,
  History,
  Info,
  Sparkles,
  ArrowRight,
  BellRing,
  ArrowLeft,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

import portalAnnouncementService from '@/services/portalAnnouncementService';
import { cn } from '@/utils';
import { BottomSheet } from '@/components/portal/BottomSheet';
import { RichTextViewer } from '@/components/shared/RichTextEditor';

const ANNOUNCEMENT_TYPES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'Maintenance', label: 'Bảo trì', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { id: 'Policy', label: 'Chính sách', color: 'bg-purple-50 text-purple-600 border-purple-100' },
  { id: 'Event', label: 'Sự kiện', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { id: 'Emergency', label: 'Khẩn cấp', color: 'bg-red-50 text-red-600 border-red-100' },
];

const Announcements = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedAnn, setSelectedAnn] = useState<any>(null);

  // 1. Fetch Announcements
  const { data: annData, isLoading } = useQuery({
    queryKey: ['portal-announcements', activeFilter],
    queryFn: () => portalAnnouncementService.getAnnouncements({ type: activeFilter })
  });

  // 2. Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => portalAnnouncementService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-unread-count'] });
    }
  });

  const handleOpenDetail = (ann: any) => {
    setSelectedAnn(ann);
    markReadMutation.mutate(ann.id);
  };

  const handleShare = async (ann: any) => {
    const shareData = {
      title: ann.title,
      text: ann.summary || ann.title,
      url: window.location.href
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        toast.info('Link bài viết đã sẵn sàng chia sẻ');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép link liên kết');
    }
  };

  const items = annData?.items || [];
  const pinnedItems = items.filter((i: any) => i.isPinned);
  const otherItems = items.filter((i: any) => !i.isPinned);

  return (
    <div className="min-h-screen bg-transparent pb-32 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Hero Banner Section */}
      <div className="px-5 pt-6 pb-2">
        <div className="relative p-7 bg-gradient-to-br from-[#0D8A8A] to-[#0A6B6B] rounded-[32px] overflow-hidden shadow-2xl shadow-[#0D8A8A]/20">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm border border-white/20">
                <Megaphone size={24} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-[2px]">Cố định</p>
                <h3 className="text-xl font-black text-white tracking-tight leading-none">Thông báo từ BQL</h3>
              </div>
            </div>
            <p className="text-sm text-teal-50/80 font-medium leading-relaxed max-w-[240px]">
              Cập nhật tin tức, sự kiện và thông báo quan trọng nhất dành cho cư dân.
            </p>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 -rotate-12">
            <Megaphone size={140} className="text-white" />
          </div>
        </div>
      </div>

      <div className="p-5 space-y-7 w-full mx-auto">
        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          {ANNOUNCEMENT_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveFilter(type.id)}
              className={cn(
                "whitespace-nowrap px-6 h-11 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border shadow-sm",
                activeFilter === type.id 
                  ? "bg-[#0D8A8A] text-white border-[#0D8A8A] shadow-[#0D8A8A]/20" 
                  : "bg-white text-slate-400 border-slate-100"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* News Feed Area */}
        <div className="space-y-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-slate-50 rounded-[28px] animate-pulse"></div>
            ))
          ) : items.length > 0 ? (
            <>
              {pinnedItems.map((ann: any) => (
                <AnnouncementCard key={ann.id} ann={ann} onClick={() => handleOpenDetail(ann)} pinned />
              ))}
              {otherItems.map((ann: any) => (
                <AnnouncementCard key={ann.id} ann={ann} onClick={() => handleOpenDetail(ann)} />
              ))}
            </>
          ) : (
            <div className="text-center py-20 bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200">
               <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center mx-auto mb-5 shadow-sm">
                 <Megaphone size={32} className="text-slate-200" />
               </div>
               <p className="text-sm font-black text-slate-400 uppercase tracking-[3px]">Chưa có thông báo</p>
            </div>
          )}
        </div>
      </div>

      <BottomSheet 
        isOpen={!!selectedAnn} 
        onClose={() => setSelectedAnn(null)} 
        title="Thông báo chi tiết"
      >
        {selectedAnn && (
          <div className="space-y-7 pb-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                    ANNOUNCEMENT_TYPES.find(t => t.id === selectedAnn.type)?.color || 'bg-slate-50 text-slate-500'
                  )}>
                    {selectedAnn.type}
                  </span>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    {formatDistanceToNow(new Date(selectedAnn.createdAt), { addSuffix: true, locale: vi })}
                  </p>
               </div>
               <h3 className="text-2xl font-black text-slate-900 leading-tight tracking-tight uppercase">
                 {selectedAnn.title}
               </h3>
               <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 flex items-center gap-3">
                  <Sparkles size={18} className="text-[#0D8A8A]" />
                  <p className="text-[11px] font-black text-teal-800 uppercase tracking-[2px]">Tin chính thức từ BQL</p>
               </div>
            </div>

            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-medium">
               <RichTextViewer html={selectedAnn.content} />
            </div>

            <div className="pt-6 border-t border-slate-50 flex gap-4">
               <button 
                 onClick={() => handleShare(selectedAnn)}
                 className="flex-1 h-15 bg-white border border-slate-100 rounded-[20px] font-black uppercase tracking-[2px] text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all text-slate-500"
               >
                  <Share2 size={18} />
                  Chia sẻ
               </button>
               <button 
                 onClick={() => setSelectedAnn(null)}
                 className="flex-1 h-15 bg-[#0D8A8A] text-white rounded-[20px] font-black uppercase tracking-[2px] text-[10px] active:scale-95 transition-all shadow-xl shadow-[#0D8A8A]/20"
               >
                  Đã đọc
               </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

const AnnouncementCard = ({ ann, onClick, pinned }: any) => {
  const isEmergency = ann.type === 'Emergency';
  const typeStyle = ANNOUNCEMENT_TYPES.find(t => t.id === ann.type);
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 transition-all active:scale-[0.98] relative overflow-hidden group hover:border-[#0D8A8A]/20 hover:shadow-xl hover:shadow-slate-200/50",
        isEmergency && "border-red-100 bg-red-50/10",
        pinned && "border-teal-100 shadow-teal-100/20"
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
           <div className={cn(
              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
              typeStyle?.color || "bg-slate-50 text-slate-500 border-slate-100"
           )}>
              {ann.type}
           </div>
           {pinned ? (
             <div className="w-7 h-7 bg-[#0D8A8A] rounded-full flex items-center justify-center text-white rotate-45 shadow-lg">
                <Pin size={12} strokeWidth={3} />
             </div>
           ) : (
             <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
               {formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true, locale: vi })}
             </p>
           )}
        </div>

        <div className="flex gap-4">
           {isEmergency && (
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                 <AlertTriangle size={24} strokeWidth={2.5} />
              </div>
           )}
           <div className="flex-1 space-y-1.5">
              <h4 className={cn("text-[15px] font-black tracking-tight leading-tight uppercase line-clamp-1", isEmergency ? "text-red-700" : "text-slate-800")}>
                {ann.title}
              </h4>
              <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed tracking-tight">
                {ann.summary || 'Nhấn để xem chi tiết các cập nhật mới nhất từ Ban quản lý SmartStay...'}
              </p>
           </div>
           <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 group-hover:text-[#0D8A8A] group-hover:bg-teal-50 transition-all shrink-0">
              <ArrowRight size={20} strokeWidth={3} />
           </div>
        </div>
      </div>
    </div>
  );
};

export default Announcements;
