import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, Plus, Search, Filter, 
  MoreVertical, Edit, Trash2, 
  Eye, Pin, Calendar, Building2,
  Users, AlertTriangle, Send, 
  Layers, Megaphone, Smartphone, 
  CheckCircle2, Clock, Globe,
  ShieldCheck, ArrowRight
} from 'lucide-react';
import { announcementService } from '@/services/announcementService';
import { Announcement, AnnouncementType, AnnouncementStatus } from '@/types/announcement';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn, formatDate } from '@/utils';
import { useTranslation } from 'react-i18next';
import { Spinner } from '@/components/ui/Feedback';
import { toast } from 'sonner';
import { AnnouncementModal } from './components/AnnouncementModal';

/**
 * 6.1.1 Announcement management hub
 * Design focus: High-impact communications display and efficient broadcasting
 */
const AnnouncementPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<AnnouncementStatus | 'All'>('All');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ['announcements', activeTab],
    queryFn: () => announcementService.getAnnouncements()
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => announcementService.createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Đã tạo thông báo thành công');
      handleCloseModal();
    },
    onError: () => toast.error('Lỗi khi tạo thông báo')
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => announcementService.createAnnouncement(data), // Re-using for mock purposes, usually updateAnnouncement
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Đã cập nhật thông báo thành công');
      handleCloseModal();
    },
    onError: () => toast.error('Lỗi khi cập nhật thông báo')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => announcementService.deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Đã xóa thông báo');
    },
    onError: () => toast.error('Lỗi khi xóa thông báo')
  });

  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: Announcement) => {
    setEditingAnnouncement(a);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAnnouncement(null);
  };

  const handleSubmit = (data: any) => {
     if (editingAnnouncement) {
       updateMutation.mutate({ ...editingAnnouncement, ...data });
     } else {
       createMutation.mutate(data);
     }
  };

  const handleDelete = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
      deleteMutation.mutate(id);
    }
  };

  const getTypeIcon = (type: AnnouncementType) => {
    switch (type) {
      case 'Urgent': return <AlertTriangle className="text-danger" size={16} />;
      case 'Maintenance': return <Layers className="text-warning" size={16} />;
      case 'Event': return <Megaphone className="text-primary" size={16} />;
      case 'Holiday': return <Globe className="text-success" size={16} />;
      case 'Security': return <ShieldCheck className="text-slate-700" size={16} />;
      default: return <Bell className="text-muted" size={16} />;
    }
  };

  const filteredAnnouncements = announcements?.filter(a => {
    const matchesTab = activeTab === 'All' || a.status === activeTab;
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || 
                          a.content.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-sm">
              <Megaphone size={28} />
           </div>
           <div>
              <h1 className="text-display text-primary uppercase tracking-tighter">Bản tin thông báo</h1>
              <p className="text-body text-muted flex items-center gap-2">
                 Phát sóng tin tức tới cư dân và cộng tác viên. 
                 <span className="flex items-center gap-1 text-[10px] font-black bg-success/10 text-success px-1.5 py-0.5 rounded uppercase">
                    <ShieldCheck size={10} /> Kênh đã xác minh
                 </span>
              </p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <button className="btn-outline flex items-center gap-2">
              <Smartphone size={18} /> Gửi SMS/Zalo
           </button>
           <button 
             onClick={handleOpenCreate}
             className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20 bg-primary px-8"
           >
              <Plus size={18} /> Tạo thông báo
           </button>
        </div>
      </div>

      {/* Broadcasting Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: 'Tổng tin đã phát', value: '1,280+', icon: Globe, color: 'text-primary', bg: 'bg-primary/5' },
           { label: 'Lượt tiếp cận (Reach)', value: '85.4K', icon: Users, color: 'text-secondary', bg: 'bg-secondary/5' },
           { label: 'Tỉ lệ phản hồi', value: '24.2%', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/5' },
           { label: 'Tin khẩn cấp 24h', value: '03', icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/5' }
         ].map((stat, i) => (
           <div key={i} className="card-container p-6 flex flex-row items-center gap-4 shadow-xl shadow-primary/5 bg-white/60">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", stat.bg, stat.color)}>
                 <stat.icon size={24} />
              </div>
              <div className="space-y-0.5">
                 <p className="text-display text-[22px] leading-tight text-slate-900">{stat.value}</p>
                 <p className="text-[10px] text-muted font-black uppercase tracking-widest">{stat.label}</p>
              </div>
           </div>
         ))}
      </div>

      {/* Filter & List Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-4">
         <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-border/50">
            {['All', 'Published', 'Scheduled', 'Draft'].map((tab) => (
               <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                    activeTab === tab ? "bg-white text-primary shadow-lg" : "text-muted hover:text-text"
                  )}
               >
                  {tab === 'All' ? 'Tất cả' : t(`status.${tab}`, tab)}
               </button>
            ))}
         </div>
         
         <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input 
               type="text" 
               placeholder="Tìm kiếm tiêu đề, nội dung..." 
               className="input-base w-full pl-12 h-12 shadow-sm"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
            />
         </div>
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <div className="py-20 flex justify-center"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
           {filteredAnnouncements?.map((a) => (
             <div 
               key={a.id}
               className="group card-container p-6 bg-white hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 relative overflow-hidden"
             >
                <div className="flex flex-col md:flex-row gap-6 relative z-10">
                   <div className="flex flex-col items-center justify-between space-y-3 shrink-0">
                      <div className="w-14 h-14 rounded-3xl bg-slate-50 border border-border/50 flex items-center justify-center group-hover:bg-primary/5 group-hover:text-primary transition-all duration-500">
                         {getTypeIcon(a.type)}
                      </div>
                      {a.isPinned && (
                        <div className="p-2 bg-orange-50 text-orange-500 rounded-xl" title="Pinned">
                           <Pin size={16} />
                        </div>
                      )}
                   </div>

                   <div className="flex-1 space-y-2">
                       <div className="flex flex-col md:flex-row md:items-center gap-3">
                          <StatusBadge status={a.status} size="sm" />
                          <h3 
                            className="text-h3 text-primary group-hover:underline cursor-pointer"
                            onClick={() => handleOpenEdit(a)}
                          >
                            {a.title}
                          </h3>
                       </div>
                       <p className="text-body text-slate-500 line-clamp-2 pr-12">{a.content}</p>
                       <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-[11px] font-medium text-muted">
                          <span className="flex items-center gap-1.5"><Clock size={14} /> {formatDate(a.publishAt)}</span>
                          <span className="flex items-center gap-1.5"><Building2 size={14} /> {a.buildingIds.join(', ')}</span>
                          <span className="flex items-center gap-1.5"><Users size={14} /> {a.targetGroups.join(', ')}</span>
                       </div>
                   </div>

                   <div className="flex md:flex-col items-center justify-between md:justify-start gap-4 shrink-0 px-2 border-l border-dashed border-border/50 pl-6">
                      <div className="text-center">
                         <p className="text-[10px] text-muted font-black uppercase">Lượt xem</p>
                         <p className="text-body font-black text-primary">1,200</p>
                      </div>
                      <div className="flex items-center gap-1 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                         <button className="p-2 hover:bg-bg rounded-xl text-muted hover:text-primary"><Eye size={18} /></button>
                         <button 
                           onClick={() => handleOpenEdit(a)}
                           className="p-2 hover:bg-bg rounded-xl text-muted hover:text-secondary"
                         >
                            <Edit size={18} />
                         </button>
                         <button 
                           onClick={() => handleDelete(a.id)}
                           className="p-2 hover:bg-bg rounded-xl text-muted hover:text-danger"
                         >
                            <Trash2 size={18} />
                         </button>
                      </div>
                   </div>
                </div>
                
                {/* Visual Accent */}
                <div className={cn(
                  "absolute bottom-0 right-0 w-16 h-16 opacity-[0.03] rotate-[25deg] transition-all group-hover:opacity-[0.1] group-hover:rotate-0",
                  a.type === 'Urgent' ? "text-danger" : "text-primary"
                )}>
                   {getTypeIcon(a.type)}
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Floating help section */}
      <div className="card-container p-6 bg-primary/5 border border-primary/20 rounded-3xl flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/20 text-primary rounded-full flex items-center justify-center">
               <ShieldCheck size={20} />
            </div>
            <div>
               <p className="text-small font-black text-primary uppercase">Cần hỗ trợ?</p>
               <p className="text-[11px] text-primary/70 font-medium">Tìm hiểu cách tối ưu hóa Reach cho thông báo tới hàng nghìn cư dân.</p>
            </div>
         </div>
         <button className="flex items-center gap-2 text-[11px] font-black text-primary uppercase hover:gap-3 transition-all duration-300">
            Xem tài liệu <ArrowRight size={16} />
         </button>
      </div>

      {/* Announcement Creation/Edit Modal */}
      <AnnouncementModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialData={editingAnnouncement}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default AnnouncementPage;
