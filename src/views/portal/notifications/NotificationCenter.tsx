import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  CheckCircle2,
  Info,
  AlertTriangle,
  CreditCard,
  Ticket,
  History,
  Trash2,
  ChevronRight,
  Clock,
  Sparkles,
  ArrowLeft,
  Calendar,
  Wrench,
  Megaphone,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';

import notificationService from '@/services/notificationService';
import useAuthStore from '@/stores/authStore';
import { cn } from '@/utils';
import { getNotificationStyle, normalizeNotificationType } from '@/utils/notificationUtils';

const SwipeableNotificationItem = ({ item, onRead, onDelete }: { item: any; onRead: () => void; onDelete: () => void }) => {
  const [offset, setOffset] = useState(0);
  const [startX, setStartX] = useState(0);

  const style = getNotificationStyle(item.type);
  const Icon = style?.icon || Bell;


  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    if (diff < 0) setOffset(diff);
  };

  const handleTouchEnd = () => {
    if (offset < -80) {
      setOffset(-1000);
      setTimeout(onDelete, 300);
    } else {
      setOffset(0);
    }
  };

  return (
    <div className="relative mb-4 overflow-hidden group">
      {/* Background Delete Action */}
      <div className="absolute inset-0 bg-rose-500 rounded-3xl flex items-center justify-end px-8 text-white">
        <div className="flex flex-col items-center gap-1">
          <Trash2 size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Xóa</span>
        </div>
      </div>
      
      {/* Foreground Item */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={onRead}
        style={{ transform: `translateX(${offset}px)` }}
        className={cn(
          "bg-white rounded-3xl p-5 shadow-sm border transition-all relative z-10 active:scale-[0.99] cursor-pointer",
          item.isRead ? "border-slate-50 opacity-60" : "border-[#0D8A8A]/10 shadow-md shadow-[#0D8A8A]/5",
          offset === 0 && "duration-300 ease-out"
        )}
      >
        <div className="flex gap-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner transition-transform group-hover:scale-105",
            style?.color || 'bg-slate-50 text-slate-500 border-slate-100'
          )}>
            <Icon size={20} />

          </div>
          
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {format(new Date(item.createdAt), 'HH:mm • dd MMM')}
              </span>
              {!item.isRead && (
                 <div className="w-2 h-2 bg-[#0D8A8A] rounded-full shadow-lg shadow-[#0D8A8A]/20 animate-pulse" />
              )}
            </div>
            
            <h4 className={cn(
              "text-[14px] leading-snug tracking-tight line-clamp-2",
              !item.isRead ? "font-bold text-slate-900" : "font-semibold text-slate-600"
            )}>
               {item.title}
            </h4>
            
            <p className="text-[12px] font-medium text-slate-500 leading-relaxed line-clamp-2">
               {item.message}
            </p>
          </div>
        </div>

        {/* Bottom Metadata */}
        {!item.isRead && (
          <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
             <div className="flex items-center gap-1.5 opacity-60">
                <Sparkles size={12} className="text-[#0D8A8A]" />
                <span className="text-[10px] font-bold text-[#0D8A8A] uppercase tracking-wider">SmartStay AI</span>
             </div>
             <ChevronRight size={14} className="text-slate-300" />
          </div>
        )}
      </div>
    </div>
  );
};

const NotificationCenter = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const profileId = user?.id ?? '';
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('unread');

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['portal-notifications', profileId],
    queryFn: () => notificationService.getNotifications(profileId),
    enabled: !!profileId,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-notifications'] });
      toast.success('Đã đánh dấu tất cả đã đọc');
    }
  });



  const handleNotificationClick = (item: any) => {
    if (!item.isRead) markAsReadMutation.mutate(item.id);
    const t = normalizeNotificationType(item.type);
    if (t === 'invoice_new' || t === 'invoice_due' || t === 'payment_confirmed') navigate('/portal/invoices');
    else if (t === 'ticket') navigate('/portal/tickets');
    else if (t === 'announcement') navigate('/portal/announcements');
    else if (t === 'contract_renew') navigate('/portal/profile');
  };

  const filteredNotifications = notifications?.filter((n: any) => 
    activeTab === 'all' ? true : !n.isRead
  ) || [];

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  return (
    <div className="min-h-full bg-transparent pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="p-4 sm:p-5 space-y-6 w-full mx-auto pt-4">
        {/* Header Section */}
        <div className="flex items-center justify-between px-1">
          <div className="space-y-0.5">
            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Thông báo</h2>
            <p className="text-[12px] font-medium text-slate-400">Bạn có {unreadCount} mục chưa đọc</p>
          </div>
          <button 
            onClick={() => markAllReadMutation.mutate()}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-[#0D8A8A] shadow-sm shadow-slate-200/50 active:scale-90 transition-all"
            title="Đánh dấu đã đọc tất cả"
          >
             <CheckCircle2 size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-100">
           <button 
             onClick={() => setActiveTab('unread')}
             className={cn(
               "flex-1 h-10 rounded-xl text-[12px] font-bold transition-all",
               activeTab === 'unread' ? "bg-white text-[#0D8A8A] shadow-sm" : "text-slate-500 hover:text-slate-700"
             )}
           >
              Chưa đọc {unreadCount > 0 && `(${unreadCount})`}
           </button>
           <button 
             onClick={() => setActiveTab('all')}
             className={cn(
               "flex-1 h-10 rounded-xl text-[12px] font-bold transition-all",
               activeTab === 'all' ? "bg-white text-[#0D8A8A] shadow-sm" : "text-slate-500 hover:text-slate-700"
             )}
           >
              Tất cả
           </button>
        </div>

        {/* Notification List */}
        <div className="space-y-2 pt-2">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-28 bg-white/50 rounded-3xl border border-slate-50 animate-pulse"></div>
            ))
          ) : filteredNotifications.length === 0 ? (
            <div className="py-24 text-center space-y-4">
               <div className="w-20 h-20 bg-emerald-50 rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
                 <Sparkles size={32} className="text-emerald-500 opacity-50" />
               </div>
               <div className="space-y-1">
                 <p className="text-[15px] font-bold text-slate-900">Tuyệt vời!</p>
                 <p className="text-[13px] font-medium text-slate-400">Bạn đã xem hết tất cả thông báo.</p>
               </div>
            </div>
          ) : (
            filteredNotifications.map((item: any) => (
              <SwipeableNotificationItem 
                key={item.id} 
                item={item} 
                onRead={() => handleNotificationClick(item)}
                onDelete={() => markAsReadMutation.mutate(item.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
