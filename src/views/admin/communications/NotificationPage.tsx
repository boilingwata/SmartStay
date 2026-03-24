import React, { useState } from 'react';
import { 
  Bell, Search, Filter, 
  Trash2, Mail, CheckCircle2, 
  Clock, AlertCircle, Info,
  Smartphone, Eye, Inbox,
  MoreVertical, Settings, Send,
  Layers, Megaphone, ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { cn, formatDate } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { toast } from 'sonner';

/**
 * 6.2.1 Notification log & template management
 * Design focus: High-frequency interaction monitoring and clear notification status
 */
const NotificationPage = () => {
  const [activeTab, setActiveTab] = useState<'All' | 'SMS' | 'Push' | 'Email'>('All');
  const [isLoading, setIsLoading] = useState(false);

  // Mock Notification Logs
  const notifications = [
    { id: 1, title: 'Nhắc nợ tiền nước', type: 'SMS', content: 'Kính gửi cư dân A-101, vui lòng thanh toán tiền nước tháng 03...', status: 'Sent', sentAt: new Date(Date.now() - 3600000).toISOString(), recipient: 'Nguyễn Văn A' },
    { id: 2, title: 'Báo cháy định kỳ', type: 'Push', content: 'Hệ thống báo cháy tòa nhà B sẽ được kiểm tra vào 10:00 sáng mai.', status: 'Delivered', sentAt: new Date(Date.now() - 7200000).toISOString(), recipient: 'Tất cả tòa B' },
    { id: 3, title: 'Cảnh báo mất điện', type: 'Email', content: 'Do sự cố nguồn, cụm tòa C sẽ mất điện tạm thời trong 30 phút.', status: 'Failed', sentAt: new Date(Date.now() - 10800000).toISOString(), recipient: 'Cư dân cụm C', error: 'SMTP Timeout' },
    { id: 4, title: 'Xác nhận cọc phòng', type: 'Push', content: 'Yêu cầu đặt cọc phòng B-205 đã được hệ thống ghi nhận.', status: 'Sent', sentAt: new Date(Date.now() - 14400000).toISOString(), recipient: 'Trần Thị B' },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SMS': return <Smartphone className="text-primary" size={16} />;
      case 'Push': return <Bell className="text-secondary" size={16} />;
      case 'Email': return <Mail className="text-warning" size={16} />;
      default: return <Info className="text-muted" size={16} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Sent': return <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black uppercase rounded">Sent</span>;
      case 'Delivered': return <span className="px-2 py-0.5 bg-success/10 text-success text-[9px] font-black uppercase rounded">Delivered</span>;
      case 'Failed': return <span className="px-2 py-0.5 bg-danger/10 text-danger text-[9px] font-black uppercase rounded">Failed</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center shadow-sm">
              <Bell size={28} />
           </div>
           <div>
              <h1 className="text-display text-secondary uppercase tracking-tighter">Nhật ký Thông báo</h1>
              <p className="text-body text-muted flex items-center gap-2">
                 Theo dõi tình trạng gửi tin đa kênh (Mobile Push, SMS, Email). 
                 <span className="flex items-center gap-1 text-[10px] font-black bg-slate-100 text-muted px-1.5 py-0.5 rounded uppercase border border-border/50">
                    <ShieldCheck size={10} /> Delivery guaranteed
                 </span>
              </p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <button className="btn-outline flex items-center gap-2">
              <Settings size={18} /> Cấu hình kênh
           </button>
           <button className="btn-primary flex items-center gap-2 shadow-lg shadow-secondary/20 bg-secondary border-none px-8">
              <Send size={18} /> Gửi tin thủ công
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Sidebar - Quick Filters & Health */}
         <div className="lg:col-span-3 space-y-6">
            <div className="card-container p-6 space-y-6 bg-white/60 backdrop-blur-md">
               <h3 className="text-label text-muted border-b pb-2 flex items-center justify-between">
                 Lọc tin nhắn <Filter size={14} />
               </h3>
               <div className="space-y-1">
                  {['All', 'SMS', 'Push', 'Email'].map((tab) => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl text-small font-bold transition-all flex items-center justify-between group",
                        activeTab === tab ? "bg-secondary text-white shadow-xl shadow-secondary/20" : "text-muted hover:bg-bg"
                      )}
                    >
                      <span className="flex items-center gap-3">
                         {tab === 'All' ? <Inbox size={18} /> : getTypeIcon(tab)}
                         {tab === 'All' ? 'Tất cả' : tab}
                      </span>
                      <span className={cn(
                        "text-[10px] font-black px-1.5 rounded-lg opacity-50",
                        activeTab === tab ? "bg-white text-secondary opacity-100" : "bg-slate-100"
                      )}>
                         {tab === 'All' ? 120 : tab === 'SMS' ? 45 : tab === 'Push' ? 70 : 5}
                      </span>
                    </button>
                  ))}
               </div>
            </div>

            <div className="card-container p-6 space-y-4 bg-slate-900 text-white border-none shadow-xl shadow-slate-900/10 overflow-hidden relative">
               <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Megaphone size={120} />
               </div>
               <div className="relative z-10 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Sức khỏe kết nối</p>
                  <div className="space-y-4 pt-2">
                     <div className="flex items-center justify-between">
                        <span className="text-small font-medium text-white/80 flex items-center gap-2 italic underline underline-offset-4 decoration-success decoration-2">SMS Gateway</span>
                        <span className="text-[10px] font-black text-success">Active</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-small font-medium text-white/80 flex items-center gap-2 italic underline underline-offset-4 decoration-success decoration-2">Firebase Cloud</span>
                        <span className="text-[10px] font-black text-success">Active</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-small font-medium text-white/80 flex items-center gap-2 italic underline underline-offset-4 decoration-danger decoration-2">Zalo Official</span>
                        <span className="text-[10px] font-black text-danger">Check API</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Main Content - Feed */}
         <div className="lg:col-span-9 space-y-6">
            <div className="card-container p-4 bg-white shadow-xl shadow-primary/5 flex items-center gap-4">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                  <input type="text" placeholder="Tìm kiếm nội dung, người nhận..." className="input-base w-full pl-12 h-11 border-none shadow-none focus:ring-0 text-body" />
               </div>
               <button className="btn-outline px-4 h-11 flex items-center gap-2 text-small">
                  <Layers size={16} /> Nhãn <ChevronDown size={14} />
               </button>
            </div>

            <div className="card-container overflow-hidden bg-white shadow-xl shadow-primary/5">
                <table className="w-full text-left">
                   <thead className="bg-bg/40 border-b">
                      <tr>
                         <th className="px-6 py-4 text-label text-muted">Kênh</th>
                         <th className="px-6 py-4 text-label text-muted">Tiêu đề / Nội dung</th>
                         <th className="px-6 py-4 text-label text-muted">Người nhận</th>
                         <th className="px-6 py-4 text-label text-muted text-center">Trạng thái</th>
                         <th className="px-6 py-4 text-label text-muted text-right">Gửi lúc</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-border/20">
                      {notifications.map((n) => (
                        <tr key={n.id} className="group hover:bg-bg/10 transition-colors cursor-pointer">
                           <td className="px-6 py-4">
                              <div className="w-10 h-10 rounded-2xl bg-slate-50 border flex items-center justify-center text-muted group-hover:bg-primary/5 group-hover:text-primary transition-all duration-300">
                                 {getTypeIcon(n.type)}
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="space-y-1">
                                 <p className="text-body font-bold text-text group-hover:text-primary transition-colors">{n.title}</p>
                                 <p className="text-small text-muted line-clamp-1 italic max-w-sm">"{n.content}"</p>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <p className="text-small font-medium text-text">{n.recipient}</p>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                 {getStatusBadge(n.status)}
                                 {n.error && <p className="text-[9px] text-danger font-bold uppercase">{n.error}</p>}
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <p className="text-small text-muted font-bold">{formatDate(n.sentAt)}</p>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
                <div className="p-6 bg-bg/20 border-t flex items-center justify-center">
                   <button className="text-[11px] font-black text-secondary uppercase tracking-widest hover:underline flex items-center gap-2">
                      Xem nhật ký lịch sử đầy đủ <Eye size={14} />
                   </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-container p-6 space-y-4 bg-orange-50/50 border border-orange-200/50 flex flex-col items-center text-center">
                   <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center">
                      <AlertCircle size={28} />
                   </div>
                   <div className="space-y-1">
                      <h4 className="text-h3 text-orange-800">4 Giao dịch thất bại</h4>
                      <p className="text-[11px] text-orange-700/70 font-medium">Hệ thống SMS đã tự động thử lại 2 lần. Cần kiểm tra số dư Brandname.</p>
                   </div>
                   <button className="btn-primary bg-orange-500 hover:bg-orange-600 border-none px-6 py-2 h-auto text-[11px] mt-2">Thử lại ngay</button>
                </div>

                <div className="card-container p-6 space-y-4 bg-primary/5 border border-primary/20 flex flex-col items-center text-center">
                   <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                      <CheckCircle2 size={28} />
                   </div>
                   <div className="space-y-1">
                      <h4 className="text-h3 text-primary">Templates tối ưu</h4>
                      <p className="text-[11px] text-primary/70 font-medium">12 mẫu tin nhắn đã được chuẩn hóa để tăng tỉ lệ mở thông báo.</p>
                   </div>
                   <button className="btn-outline border-primary/20 text-primary px-6 py-2 h-auto text-[11px] mt-2">Quản lý mẫu</button>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default NotificationPage;
