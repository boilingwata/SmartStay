import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { 
  X, AlertCircle, Building, Home, User, 
  Type, Flag, Calendar, Clipboard, Send,
  Upload, Paperclip, Clock
} from 'lucide-react';
import { cn } from '@/utils';
import { TicketType, TicketPriority } from '@/models/Ticket';
import { SelectAsync } from '@/components/ui/SelectAsync';
import { toast } from 'sonner';

type TicketFormData = {
  buildingId: string;
  roomId?: string;
  tenantId?: string;
  type: TicketType;
  priority: TicketPriority;
  title: string;
  description: string;
  assignedToId?: string;
  slaDeadline?: string;
};

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TicketFormData) => void;
}

export const TicketFormModal = ({ isOpen, onClose, onSubmit }: TicketModalProps) => {
  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<TicketFormData>({
    defaultValues: {
      type: 'Maintenance',
      priority: 'Medium'
    }
  });

  const selectedType = watch('type');
  const selectedBuilding = watch('buildingId');
  const selectedRoom = watch('roomId');

  // 4.3 Emergency auto-priority (Vibecoding Checklist #3)
  useEffect(() => {
    if (selectedType === 'Emergency') {
      setValue('priority', 'Critical');
    }
  }, [selectedType, setValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-white rounded-[44px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[95vh] animate-in zoom-in-95 duration-500">
        {/* Decorative Sidebar */}
        <div className="md:w-[35%] bg-primary p-12 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
           <div className="relative z-10 space-y-8">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                 <AlertCircle size={32} />
              </div>
              <div>
                 <h2 className="text-[40px] font-black leading-tight tracking-tighter mb-4">Mở Ticket Mới</h2>
                 <p className="text-small text-white/60 font-medium leading-relaxed">Ghi nhận sự cố hoặc yêu cầu dịch vụ từ cư dân. Đảm bảo phân loại đúng để kích hoạt SLA tự động.</p>
              </div>
           </div>
           
           <div className="relative z-10 p-6 bg-white/10 rounded-3xl border border-white/20 backdrop-blur-md transition-all hover:bg-white/15">
              <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-300 mb-2">Vibecoding Hint</p>
              <p className="text-[11px] italic text-white/80 font-medium">"Hệ thống sẽ tự động đặt độ ưu tiên cao nhất cho các yêu cầu KHẨN CẤP."</p>
           </div>

           <AlertCircle size={350} className="absolute -bottom-20 -left-20 text-white/5 rotate-12" />
        </div>

        {/* Form Area */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar bg-bg/5">
           <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
              {/* Building & Room Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="text-[11px] text-muted font-black uppercase tracking-[2px]">Tòa nhà *</label>
                    <Controller 
                      name="buildingId"
                      control={control}
                      rules={{ required: 'Bắt buộc chọn tòa nhà' }}
                      render={({ field }) => (
                         <SelectAsync 
                           placeholder="Chọn tòa nhà..."
                           icon={Building}
                           className={errors.buildingId ? "border-danger" : ""}
                           value={field.value}
                           onChange={field.onChange}
                           loadOptions={async () => [
                             { label: 'The Manor Central Park', value: 'B1' },
                             { label: 'Vinhomes Central Park', value: 'B2' }
                           ]}
                         />
                      )}
                    />
                 </div>

                 <div className="space-y-3">
                    <label className="text-[11px] text-muted font-black uppercase tracking-[2px]">Phòng (Tùy chọn)</label>
                    <Controller 
                      name="roomId"
                      control={control}
                      render={({ field }) => (
                         <SelectAsync 
                           placeholder={selectedBuilding ? "Chọn phòng..." : "Hãy chọn tòa nhà trước"}
                           icon={Home}
                           value={field.value}
                           onChange={field.onChange}
                           loadOptions={async () => {
                              if (!selectedBuilding) return [];
                              return [{ label: 'Phòng A-101', value: 'R101' }, { label: 'Phòng B-205', value: 'R205' }];
                           }}
                         />
                      )}
                    />
                 </div>
              </div>

              {/* Type & Priority Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="text-[11px] text-muted font-black uppercase tracking-[2px]">Loại yêu cầu *</label>
                    <div className="relative group">
                       <Type size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-primary" />
                       <select 
                         {...register('type')}
                         className="input-base pl-12 h-14 bg-white"
                       >
                          <option value="Maintenance">Sửa chữa / Bảo trì</option>
                          <option value="Complaint">Khiêu nại / Phản ánh</option>
                          <option value="ServiceRequest">Yêu cầu dịch vụ</option>
                          <option value="Inquiry">Yêu cầu thông tin</option>
                          <option value="Emergency">Trường hợp KHẨN CẤP</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[11px] text-muted font-black uppercase tracking-[2px]">Mức độ ưu tiên *</label>
                    <div className="relative group">
                       <Flag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-primary" />
                       <select 
                         {...register('priority')}
                         className={cn(
                           "input-base pl-12 h-14 font-black uppercase tracking-widest text-[11px] bg-white",
                           selectedType === 'Emergency' && "bg-danger/5 border-danger text-danger pointer-events-none"
                         )}
                         disabled={selectedType === 'Emergency'}
                       >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                       </select>
                    </div>
                 </div>
              </div>

              {/* Title & Reporter Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="text-[11px] text-muted font-black uppercase tracking-[2px]">Báo cáo bởi cư dân</label>
                    <Controller 
                      name="tenantId"
                      control={control}
                      render={({ field }) => (
                         <SelectAsync 
                           placeholder="Tìm tên cư dân..."
                           icon={User}
                           value={field.value}
                           onChange={field.onChange}
                           loadOptions={async () => [
                              { label: 'Nguyễn Văn A (P.101)', value: 'T1' },
                              { label: 'Trần Thị B (P.205)', value: 'T2' }
                           ]}
                         />
                      )}
                    />
                 </div>

                 <div className="space-y-3">
                    <label className="text-[11px] text-muted font-black uppercase tracking-[2px]">Nhân viên phụ trách</label>
                    <Controller 
                      name="assignedToId"
                      control={control}
                      render={({ field }) => (
                         <SelectAsync 
                           placeholder="Chọn nhân viên..."
                           icon={ShieldCheck}
                           value={field.value}
                           onChange={field.onChange}
                           loadOptions={async () => [
                              { label: 'Lê Kỹ Thuật (Phòng KT)', value: 'S1' },
                              { label: 'Phạm Quản Lý (Admin)', value: 'S2' }
                           ]}
                         />
                      )}
                    />
                 </div>
              </div>

              {/* Title Input */}
              <div className="space-y-3">
                 <label className="text-[11px] text-muted font-black uppercase tracking-[2px]">Tiêu đề ngắn gọn *</label>
                 <div className="relative group">
                    <Clipboard size={18} className="absolute left-4 top-4 text-muted group-focus-within:text-primary" />
                    <input 
                      {...register('title', { 
                        required: 'Vui lòng nhập tiêu đề',
                        minLength: { value: 5, message: 'Tiêu đề quá ngắn' }
                      })}
                      className={cn("input-base pl-12 h-14 bg-white", errors.title && "border-danger bg-danger/5")}
                      placeholder="Ví dụ: Thang máy block A kêu to, Hỏng vòi nước P.101..."
                    />
                 </div>
                 {errors.title && <p className="text-[10px] text-danger font-black uppercase tracking-widest">{errors.title.message}</p>}
              </div>

              {/* Description Input */}
              <div className="space-y-3">
                 <label className="text-[11px] text-muted font-black uppercase tracking-[2px]">Mô tả chi tiết</label>
                 <textarea 
                    {...register('description')}
                    className="input-base p-6 bg-white min-h-[120px] leading-relaxed font-medium"
                    placeholder="Mô tả sự cố, thời gian phát hiện, vị trí chính xác..."
                 />
              </div>

              {/* Files Upload Placeholder */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="text-[11px] text-muted font-black uppercase tracking-[2px]">SLA Deadline (Bỏ trống để tự động)</label>
                    <div className="relative group">
                       <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                       <input 
                         type="datetime-local" 
                         {...register('slaDeadline')}
                         className="input-base pl-12 h-14 bg-white"
                       />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[11px] text-muted font-black uppercase tracking-[2px]">Hình ảnh / File đính kèm</label>
                    <div className="p-4 border-2 border-dashed border-border/30 rounded-3xl bg-white/40 flex items-center gap-4 cursor-pointer hover:border-primary/40 transition-all group">
                       <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <Upload size={18} />
                       </div>
                       <div>
                          <p className="text-[11px] font-black uppercase text-primary">Tải lên tài liệu</p>
                          <p className="text-[9px] text-muted font-bold">Tối đa 5 files (JPG, PNG, PDF)</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Form Actions */}
              <div className="pt-8 flex justify-end gap-4 border-t border-border/10">
                 <button 
                   type="button" 
                   onClick={onClose} 
                   className="px-8 h-12 text-[11px] font-black uppercase tracking-[2px] text-muted hover:text-primary transition-all"
                 >
                    Hủy bỏ
                 </button>
                 <button 
                   type="submit" 
                   className="btn-primary pl-10 pr-10 h-14 rounded-[32px] flex items-center gap-3 shadow-2xl shadow-primary/20 active:scale-95 transition-all"
                 >
                    <span className="text-[13px] font-black uppercase tracking-[3px]">Tạo Ticket</span>
                    <Send size={20} />
                 </button>
              </div>
           </form>
        </div>

        <button onClick={onClose} className="absolute top-8 right-8 p-3 hover:bg-bg rounded-2xl text-muted transition-all"><X size={24} /></button>
      </div>
    </div>
  );
};

// Mock ShieldCheck since it might not be in lucide version
const ShieldCheck = ({ size, className }: any) => <Clipboard size={size} className={className} />;
