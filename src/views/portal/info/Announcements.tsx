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
    const shareText = `${ann.title}\n${ann.summary || ''}`;
    const shareData = {
      title: ann.title,
      text: shareText,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          navigator.clipboard.writeText(shareText);
          toast.info('Đã copy nội dung thông báo');
        }
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Đã copy nội dung thông báo');
    }
  };

  const items = annData?.items || [];
  const filteredItems = items.filter((i: any) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pinned') return i.isPinned;
    return i.type === activeFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 animate-in fade-in slide-in-from-right-6 duration-700 font-sans">
      {/* F.14.1 Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl px-5 py-4 border-b border-gray-100 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-slate-700 active:scale-95 transition-all">
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">Thông báo</h2>
          </div>
          <button className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-teal-600 active:scale-95 transition-all">
            <BellRing size={20} />
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'Tất cả', icon: Megaphone },
            { id: 'pinned', label: 'Ghim', icon: Pin },
            { id: 'Emergency', label: 'Khẩn cấp', icon: AlertTriangle }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 h-9 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shrink-0",
                activeFilter === filter.id 
                  ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                  : "bg-white border-gray-100 text-slate-400"
              )}
            >
              <filter.icon size={12} strokeWidth={3} />
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-white/50 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          filteredItems.map((ann: any) => {
            const isPinned = ann.isPinned;
            const isEmergency = ann.type === 'Emergency';

            return (
              <div 
                key={ann.id}
                onClick={() => handleOpenDetail(ann)}
                className={cn(
                  "relative p-5 rounded-[24px] border transition-all active:scale-[0.98] cursor-pointer group overflow-hidden",
                  isPinned 
                    ? "bg-gradient-to-br from-slate-800 to-slate-900 text-white border-slate-700 shadow-xl shadow-slate-900/10" 
                    : isEmergency 
                    ? "bg-white border-red-200 shadow-lg shadow-red-500/5" 
                    : "bg-white border-gray-100 shadow-sm hover:border-teal-100"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isPinned && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full border border-white/10">
                        <Pin size={10} className="text-amber-400" fill="currentColor" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">Đã ghim</span>
                      </div>
                    )}
                    {isEmergency && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500 rounded-full">
                        <AlertTriangle size={10} className="text-white" fill="currentColor" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white">Khẩn cấp</span>
                      </div>
                    )}
                    {!isPinned && !isEmergency && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Bản tin cư dân</span>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold tracking-tighter opacity-60 italic",
                    isPinned ? "text-slate-300" : "text-slate-400"
                  )}>
                    {formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true, locale: vi })}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className={cn(
                    "text-[15px] font-black leading-snug tracking-tight uppercase",
                    isPinned ? "text-white" : "text-slate-800"
                  )}>
                    {ann.title}
                  </h3>
                  <p className={cn(
                    "text-[12px] line-clamp-2 leading-relaxed opacity-70",
                    isPinned ? "text-slate-100" : "text-slate-500"
                  )}>
                    {ann.summary || 'Nhấn để xem chi tiết thông báo...'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t flex items-center justify-between border-white/5">
                   <div className="flex items-center gap-1">
                      {!ann.isRead && (
                        <div className="w-2 h-2 rounded-full bg-teal-500 ring-4 ring-teal-500/10" />
                      )}
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        isPinned ? "text-amber-400" : "text-teal-600"
                      )}>
                        Chi tiết <ArrowRight size={10} className="inline ml-0.5" strokeWidth={3} />
                      </span>
                   </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 opacity-40">
            <Megaphone size={48} className="mx-auto mb-2 text-slate-300" />
            <p className="text-[11px] font-black uppercase tracking-widest">Không có thông báo nào</p>
          </div>
        )}
      </div>

      {/* Detail Bottom Sheet */}
      <BottomSheet 
        isOpen={!!selectedAnn} 
        onClose={() => setSelectedAnn(null)} 
        title="Chi tiết thông báo"
      >
        {selectedAnn && (
          <div className="py-2 pb-10 space-y-6 max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                 <span className="px-2.5 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">
                    {selectedAnn.type}
                 </span>
                 <span className="text-[11px] font-bold text-slate-400 italic">
                    {new Date(selectedAnn.createdAt).toLocaleDateString('vi-VN')}
                 </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight tracking-tight uppercase">
                {selectedAnn.title}
              </h2>
            </div>
            
            <div className="prose prose-slate max-w-none text-slate-600 font-medium text-[14px] leading-relaxed">
              <RichTextViewer html={selectedAnn.content} />
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => handleShare(selectedAnn)}
                className="flex-1 h-15 bg-white border border-gray-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-[3px] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Share2 size={18} />
                Chia sẻ
              </button>
              <button 
                onClick={() => setSelectedAnn(null)}
                className="flex-[2] h-15 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[3px] shadow-xl active:scale-95 transition-all"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default Announcements;
