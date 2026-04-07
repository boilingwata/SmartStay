import React from 'react';
import { useForm } from 'react-hook-form';
import { 
  X, Megaphone, Bell, AlertTriangle, 
  Layers, Globe, CheckCircle2, 
  Clock, Users, Building2, 
  Pin, FileText, Send, Calendar,
  ShieldCheck, Info, Search
} from 'lucide-react';
import { cn } from '@/utils';
import { Announcement, AnnouncementType, AnnouncementStatus } from '@/types/announcement';
import { buildingService } from '@/services/buildingService';
import { useQuery } from '@tanstack/react-query';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Announcement | null;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}

const ANNOUNCEMENT_TYPES: { value: AnnouncementType; label: string; icon: any; color: string }[] = [
  { value: 'General', label: 'Thông thường', icon: Bell, color: 'text-primary' },
  { value: 'Urgent', label: 'Khẩn cấp', icon: AlertTriangle, color: 'text-danger' },
  { value: 'Maintenance', label: 'Bảo trì', icon: Layers, color: 'text-warning' },
  { value: 'Event', label: 'Sự kiện', icon: Megaphone, color: 'text-secondary' },
  { value: 'Holiday', label: 'Ngày lễ', icon: Globe, color: 'text-success' },
  { value: 'Security', label: 'An ninh', icon: ShieldCheck, color: 'text-slate-700' },
];

const TARGET_GROUPS = [
  { value: 'Resident', label: 'Cư dân' },
  { value: 'Owner', label: 'Chủ nhà' },
  { value: 'Staff', label: 'Nhân viên' },
];

export const AnnouncementModal = ({ isOpen, onClose, initialData, onSubmit, isSubmitting }: AnnouncementModalProps) => {
  const { data: buildings } = useQuery({
    queryKey: ['buildings-simple'],
    queryFn: () => buildingService.getBuildings()
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: initialData || {
      type: 'General',
      status: 'Published',
      publishAt: new Date().toISOString().slice(0, 16),
      isPinned: false,
      targetGroups: ['Resident'],
      buildingIds: ['All'],
    }
  });

  const selectedType = watch('type');
  const selectedBuildings = watch('buildingIds') || [];
  const selectedGroups = watch('targetGroups') || [];

  if (!isOpen) return null;

  const toggleBuilding = (id: string) => {
    if (id === 'All') {
      setValue('buildingIds', ['All']);
      return;
    }
    
    let newSelection = selectedBuildings.filter((b: string) => b !== 'All');
    if (newSelection.includes(id)) {
      newSelection = newSelection.filter((b: string) => b !== id);
    } else {
      newSelection.push(id);
    }
    
    if (newSelection.length === 0) newSelection = ['All'];
    setValue('buildingIds', newSelection);
  };

  const toggleGroup = (group: string) => {
    let newGroups = [...selectedGroups];
    if (newGroups.includes(group)) {
      newGroups = newGroups.filter(g => g !== group);
    } else {
      newGroups.push(group);
    }
    setValue('targetGroups', newGroups);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl bg-white rounded-[48px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh] scale-in-95 duration-500">
        {/* Decorative Sidebar */}
        <div className="md:w-[320px] bg-primary p-10 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
           <div className="relative z-10 space-y-8">
              <div className="w-16 h-16 bg-white/10 rounded-[28px] flex items-center justify-center border border-white/20 backdrop-blur-xl">
                 <Megaphone size={32} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-[32px] font-black leading-tight tracking-tighter mb-4">
                  {initialData ? 'Cập nhật' : 'Tạo mới'} <br/>
                  <span className="text-secondary italic">Thông báo</span>
                </h2>
                <p className="text-[13px] text-white/50 font-medium leading-relaxed">
                  Gửi thông tin quan trọng tới đúng đối tượng tại các tòa nhà cụ thể qua Ứng dụng & Email.
                </p>
              </div>
           </div>
           
           <div className="relative z-10 space-y-4">
              <div className="p-6 bg-white/5 rounded-[32px] border border-white/10 backdrop-blur-lg">
                 <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={14} className="text-secondary" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Kênh xác thực</p>
                 </div>
                 <p className="text-[11px] italic text-white/70 leading-relaxed font-medium">
                    Thông báo này sẽ được gắn nhãn "Official" để tăng uy tín và tỉ lệ đọc.
                 </p>
              </div>

              <div className="flex items-center gap-3 px-4">
                 <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-primary bg-slate-200" />
                    ))}
                 </div>
                 <p className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">
                    +1.2k cư dân sẽ nhận được
                 </p>
              </div>
           </div>

           <Megaphone size={400} className="absolute -bottom-20 -left-40 text-white/5 rotate-12 pointer-events-none" />
        </div>

        {/* Content Form Area */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar bg-slate-50/50">
           <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
              {/* Header Title Field */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Tiêu đề thông báo <span className="text-danger">*</span></label>
                    <div className="flex items-center gap-2">
                       <input 
                         type="checkbox" 
                         id="isPinned" 
                         {...register('isPinned')} 
                         className="hidden" 
                       />
                       <label 
                         htmlFor="isPinned"
                         className={cn(
                           "flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter cursor-pointer transition-all",
                           watch('isPinned') ? "bg-orange-100 text-orange-600 border border-orange-200" : "bg-slate-100 text-muted border border-transparent hover:bg-slate-200"
                         )}
                       >
                          <Pin size={12} fill={watch('isPinned') ? "currentColor" : "none"} /> 
                          Ghim đầu bản tin
                       </label>
                    </div>
                 </div>
                 <input 
                    {...register('title', { required: 'Tiêu đề không được để trống' })}
                    className={cn(
                      "w-full bg-transparent border-none text-[32px] font-black tracking-tighter placeholder:text-slate-200 focus:ring-0 p-0 text-primary",
                      errors.title && "placeholder:text-danger/20"
                    )}
                    placeholder="VD: Thông báo bảo trì hệ thống điện..."
                 />
                 {errors.title && <p className="text-[10px] text-danger font-bold uppercase">{(errors.title as any).message}</p>}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                 {/* Left Column: Config */}
                 <div className="lg:col-span-1 space-y-8">
                    {/* Announcement Type */}
                    <div className="space-y-4">
                       <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1 flex items-center gap-2">
                          <Layers size={14} /> Phân loại
                       </label>
                       <div className="grid grid-cols-2 gap-2">
                          {ANNOUNCEMENT_TYPES.map(t => (
                            <button
                               type="button"
                               key={t.value}
                               onClick={() => setValue('type', t.value)}
                               className={cn(
                                 "flex items-center gap-3 p-3 rounded-2xl border transition-all text-left",
                                 selectedType === t.value 
                                  ? "bg-white border-primary shadow-md" 
                                  : "bg-white/50 border-slate-200 text-muted hover:border-slate-300"
                               )}
                            >
                               <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center bg-slate-50", selectedType === t.value && "bg-primary/10")}>
                                  <t.icon size={16} className={selectedType === t.value ? t.color : "text-slate-400"} />
                               </div>
                               <span className={cn("text-[11px] font-bold uppercase", selectedType === t.value && "text-primary")}>{t.label}</span>
                            </button>
                          ))}
                       </div>
                    </div>

                    {/* Scheduling */}
                    <div className="space-y-4">
                       <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1 flex items-center gap-2">
                          <Calendar size={14} /> Lịch phát sóng
                       </label>
                       <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
                          <div className="space-y-2">
                             <p className="text-[10px] font-black text-muted uppercase tracking-tighter">Trạng thái</p>
                             <select 
                                {...register('status')}
                                className="w-full bg-slate-50 border-none rounded-xl h-10 text-[12px] font-bold focus:ring-primary/20"
                             >
                                <option value="Published">Phát ngay (Published)</option>
                                <option value="Scheduled">Hẹn giờ (Scheduled)</option>
                                <option value="Draft">Bản nháp</option>
                             </select>
                          </div>
                          
                          {watch('status') === 'Scheduled' && (
                            <div className="space-y-2 animate-in slide-in-from-top-2">
                               <p className="text-[10px] font-black text-muted uppercase tracking-tighter">Thời gian</p>
                               <div className="relative">
                                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                                  <input 
                                    type="datetime-local" 
                                    {...register('publishAt')}
                                    className="w-full pl-10 pr-4 bg-slate-50 border-none rounded-xl h-10 text-[12px] font-bold focus:ring-primary/20"
                                  />
                               </div>
                            </div>
                          )}
                       </div>
                    </div>

                    {/* Target Groups */}
                    <div className="space-y-4">
                       <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1 flex items-center gap-2">
                          <Users size={14} /> Đối tượng nhận tin
                       </label>
                       <div className="flex flex-wrap gap-2">
                          {TARGET_GROUPS.map(g => (
                            <button
                               type="button"
                               key={g.value}
                               onClick={() => toggleGroup(g.value)}
                               className={cn(
                                 "px-4 py-2 rounded-xl border text-[11px] font-black uppercase tracking-tighter transition-all",
                                 selectedGroups.includes(g.value)
                                  ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/20"
                                  : "bg-white border-slate-200 text-muted hover:border-slate-300"
                               )}
                            >
                               {g.label}
                            </button>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Right Column: Content & Building Filter */}
                 <div className="lg:col-span-2 space-y-8">
                    {/* Content Editor */}
                    <div className="space-y-4">
                       <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1 flex items-center gap-2">
                          <FileText size={14} /> Nội dung thông báo
                       </label>
                       <div className="relative group">
                          <textarea 
                             {...register('content', { required: 'Nội dung không được để trống' })}
                             className={cn(
                               "w-full bg-white border border-slate-200 rounded-[32px] p-8 min-h-[280px] text-body leading-relaxed focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm",
                               errors.content && "border-danger focus:ring-danger/5"
                             )}
                             placeholder="Nhập nội dung thông báo tại đây. Bạn có thể sử dụng icon và định dạng cơ bản..."
                          />
                          <div className="absolute bottom-6 right-8 flex items-center gap-3">
                             <span className="text-[10px] font-medium text-slate-400">Tự động lưu bản nháp</span>
                             <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                          </div>
                       </div>
                       {errors.content && <p className="text-[10px] text-danger font-bold uppercase ml-8">{(errors.content as any).message}</p>}
                    </div>

                    {/* Target Buildings */}
                    <div className="space-y-4">
                       <div className="flex items-center justify-between ml-1">
                          <label className="text-[11px] text-muted font-black uppercase tracking-[2px] flex items-center gap-2">
                             <Building2 size={14} /> Phạm vi áp dụng (Tòa nhà)
                          </label>
                          <span className="text-[10px] font-black text-primary uppercase bg-primary/5 px-2 py-0.5 rounded">
                             {selectedBuildings.includes('All') ? 'Tất cả hệ thống' : `${selectedBuildings.length} Tòa nhà đã chọn`}
                          </span>
                       </div>
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <button
                             type="button"
                             onClick={() => toggleBuilding('All')}
                             className={cn(
                               "flex items-center gap-3 p-4 rounded-[20px] border transition-all text-left",
                               selectedBuildings.includes('All')
                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                : "bg-white border-slate-200 text-muted hover:border-slate-300"
                             )}
                          >
                             <Globe size={18} />
                             <span className="text-[11px] font-bold uppercase">Tất cả hệ thống</span>
                          </button>
                          
                          {buildings?.map(b => (
                            <button
                               type="button"
                               key={b.id}
                               onClick={() => toggleBuilding(b.id)}
                               className={cn(
                                 "flex items-center gap-3 p-4 rounded-[20px] border transition-all text-left",
                                 selectedBuildings.includes(b.id)
                                  ? "bg-white border-primary shadow-md text-primary ring-2 ring-primary/10"
                                  : "bg-white border-slate-200 text-muted hover:border-slate-300"
                               )}
                            >
                               <Building2 size={16} />
                               <div className="overflow-hidden">
                                  <p className="text-[11px] font-bold uppercase truncate">{b.buildingName}</p>
                                  <p className="text-[9px] opacity-60 font-medium truncate">{b.address}</p>
                               </div>
                            </button>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-10 flex items-center justify-between border-t border-slate-200/60">
                 <div className="flex items-center gap-3 text-muted">
                    <Info size={16} />
                    <p className="text-[11px] font-medium italic">Hệ thống sẽ gửi thông báo đẩy tới Mobile App ngay sau khi phát.</p>
                 </div>
                 <div className="flex gap-4">
                    <button 
                       type="button" 
                       onClick={onClose} 
                       className="px-10 h-14 rounded-2xl font-black uppercase tracking-[2px] text-[11px] text-muted hover:bg-white transition-all border border-transparent hover:border-slate-200"
                    >
                       Hủy bỏ
                    </button>
                    <button 
                       type="submit" 
                       className="group px-14 h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-[3px] text-[11px] shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-3"
                       disabled={isSubmitting}
                    >
                       {isSubmitting ? 'Đang xử lý...' : (
                          <>
                             {initialData ? 'Cập nhật bản tin' : 'Phát sóng ngay'}
                             <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          </>
                       )}
                    </button>
                 </div>
              </div>
           </form>
        </div>

        {/* Close Button */}
        <button 
           onClick={onClose} 
           className="absolute top-8 right-8 p-3 bg-white/50 backdrop-blur-md hover:bg-white rounded-2xl text-muted hover:shadow-lg transition-all z-[110] active:scale-90 shadow-sm border border-black/5"
        >
           <X size={24} />
        </button>
      </div>
    </div>
  );
};
