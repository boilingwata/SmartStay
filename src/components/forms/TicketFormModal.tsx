import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { 
  X, Building, Home, User, 
  Type, Flag, Calendar, Clipboard, Send,
  Upload, Clock, ShieldCheck
} from 'lucide-react';
import { cn } from '@/utils';
import { TicketType, TicketPriority, TicketStatus } from '@/models/Ticket';
import { SelectAsync } from '@/components/ui/SelectAsync';
import { buildingService } from '@/services/buildingService';
import { roomService } from '@/services/roomService';
import { tenantService } from '@/services/tenantService';
import { ticketService } from '@/services/ticketService';
import { toast } from 'sonner';

// Safe Font Stack for Vietnamese
const SAFE_FONT = { fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' };

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
  status?: TicketStatus;
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
      priority: 'Medium',
      status: 'Open'
    }
  });

  const { data: staffList } = useQuery({
    queryKey: ['staff-list'],
    queryFn: () => ticketService.getStaff(),
    enabled: isOpen
  });

  const selectedType = watch('type');
  const selectedBuilding = watch('buildingId');

  useEffect(() => {
    if (selectedType === 'Emergency') {
      setValue('priority', 'Critical');
    }
  }, [selectedType, setValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300" style={SAFE_FONT}>
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Container (Simplified) */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
           <div className="flex items-center gap-3 text-primary">
              <div className="p-2 bg-primary/10 rounded-lg">
                 <Clipboard size={20} />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Tạo yêu cầu mới</h2>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400">
              <X size={20} />
           </button>
        </div>

        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
           <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Location Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Tòa nhà *</label>
                    <Controller 
                      name="buildingId"
                      control={control}
                      rules={{ required: 'Bắt buộc chọn tòa nhà' }}
                      render={({ field }) => (
                         <SelectAsync 
                           placeholder="Chọn tòa nhà..."
                           icon={Building}
                           className={errors.buildingId ? "border-red-500" : ""}
                           value={field.value}
                           onChange={field.onChange}
                            loadOptions={async (search) => {
                              const buildings = await buildingService.getBuildings({ search });
                              return buildings.map(b => ({ label: b.buildingName, value: String(b.id) }));
                            }}
                         />
                      )}
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Phòng (Tùy chọn)</label>
                    <Controller 
                      name="roomId"
                      control={control}
                      render={({ field }) => (
                         <SelectAsync 
                           placeholder={selectedBuilding ? "Chọn phòng..." : "Hãy chọn tòa nhà trước"}
                           icon={Home}
                           value={field.value}
                           onChange={field.onChange}
                            loadOptions={async (search) => {
                               if (!selectedBuilding) return [];
                               const rooms = await roomService.getRooms({
                                 buildingId: selectedBuilding,
                                 search: search || undefined
                               });
                               return rooms.map(r => ({ label: `Phòng ${r.roomCode}`, value: String(r.id) }));
                            }}
                         />
                      )}
                    />
                 </div>
              </div>

              {/* Classification Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Loại yêu cầu *</label>
                    <div className="relative">
                       <Type size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                       <select 
                         {...register('type')}
                         className="w-full h-12 pl-12 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary transition-all font-bold text-sm"
                       >
                          <option value="Maintenance">Sửa chữa / Bảo trì</option>
                          <option value="Complaint">Khiếu nại / Phản ánh</option>
                          <option value="ServiceRequest">Yêu cầu dịch vụ</option>
                          <option value="Inquiry">Yêu cầu thông tin</option>
                          <option value="Emergency">Khẩn cấp !!!</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Độ ưu tiên *</label>
                    <div className="relative">
                       <Flag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                       <select 
                         {...register('priority')}
                         className={cn(
                           "w-full h-12 pl-12 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all font-bold text-sm",
                           selectedType === 'Emergency' && "bg-red-50 border-red-200 text-red-600 pointer-events-none"
                         )}
                         disabled={selectedType === 'Emergency'}
                       >
                          <option value="Low">Thấp (Low)</option>
                          <option value="Medium">Trung bình (Medium)</option>
                          <option value="High">Cao (High)</option>
                          <option value="Critical">Khẩn cấp (Critical)</option>
                       </select>
                    </div>
                 </div>
              </div>

              {/* Assignment & Reporter Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Cư dân yêu cầu</label>
                    <Controller 
                      name="tenantId"
                      control={control}
                      render={({ field }) => (
                         <SelectAsync 
                           placeholder="Chọn cư dân..."
                           icon={User}
                           value={field.value}
                           onChange={field.onChange}
                            loadOptions={async (search) => {
                               const tenants = await tenantService.getTenants({ search });
                               return tenants.map(t => ({ 
                                 label: `${t.fullName} (${t.currentRoomCode || 'N/A'})`, 
                                 value: String(t.id) 
                               }));
                            }}
                         />
                      )}
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Nhân viên xử lý</label>
                    <Controller 
                      name="assignedToId"
                      control={control}
                      render={({ field }) => (
                         <SelectAsync 
                           placeholder="Chọn nhân viên..."
                           icon={ShieldCheck}
                           value={field.value}
                           onChange={field.onChange}
                           loadOptions={async (search) => {
                              const list = staffList || await ticketService.getStaff();
                              const filtered = search 
                                ? list.filter(s => s.fullName.toLowerCase().includes(search.toLowerCase()))
                                : list;
                              return filtered.map(s => ({ label: `${s.fullName} (${s.role})`, value: s.id }));
                           }}
                         />
                      )}
                    />
                 </div>
              </div>

              {/* Content Group */}
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Tiêu đề *</label>
                 <input 
                   {...register('title', { required: 'Vui lòng nhập tiêu đề' })}
                   className="w-full h-12 px-6 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary transition-all font-bold text-sm"
                   placeholder="Nhập tiêu đề ngắn gọn..."
                 />
                 {errors.title && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-1">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Mô tả chi tiết</label>
                 <textarea 
                    {...register('description')}
                    className="w-full p-6 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary transition-all min-h-[100px] text-sm font-medium"
                    placeholder="Mô tả cụ thể vấn đề hoặc yêu cầu..."
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Hạn xử lý (SLA)</label>
                    <div className="relative">
                       <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                       <input 
                         type="datetime-local" 
                         {...register('slaDeadline')}
                         className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Ảnh đính kèm</label>
                    <div className="h-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex items-center gap-3 px-4 cursor-pointer hover:border-primary/40 group transition-all">
                       <Upload size={16} className="text-slate-400 group-hover:text-primary" />
                       <span className="text-[11px] font-bold text-slate-400 group-hover:text-primary italic">Chọn file/ảnh...</span>
                    </div>
                 </div>
              </div>
           </form>
        </div>

        {/* Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
           <button 
             type="button" 
             onClick={onClose} 
             className="px-6 h-12 text-sm font-bold text-slate-600 hover:text-slate-900 transition-all"
           >
              Hủy
           </button>
           <button 
             onClick={handleSubmit(onSubmit)}
             className="px-10 h-12 bg-primary text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/10 hover:bg-primary-hover active:scale-95 transition-all"
           >
              <span>Lưu Vé Hỗ Trợ</span>
              <Send size={18} />
           </button>
        </div>
      </div>
    </div>
  );
};
