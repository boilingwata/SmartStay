import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Send, Camera, Paperclip, AlertCircle, X, Home, Zap, Wrench, FileQuestion, MessageSquare
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketService } from '@/services/ticketService';
import { cn } from '@/utils';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui';

const CreateTicket: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  
  // 1. Fetch current tenant ID
  const { data: tenantId } = useQuery({
    queryKey: ['current-tenant-id'],
    queryFn: async () => {
      const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser());
      if (!user) return null;
      const { data: tenants } = await import('@/lib/supabase').then(m => m.supabase
        .from('tenants')
        .select('id')
        .eq('profile_id', user.id)
        .eq('is_deleted', false)
        .limit(1));
      return tenants?.[0]?.id;
    }
  });

  // 2. Ticket creation mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => ticketService.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-tickets'] });
      toast.success('Gửi yêu cầu thành công!');
      navigate('/portal/tickets');
    },
    onError: (error: any) => {
      toast.error(`Lỗi khi gửi yêu cầu: ${error.message}`);
    }
  });

  const categories = [
    { id: 'Maintenance', label: 'Sửa chữa', icon: Wrench },
    { id: 'Complaint', label: 'Sự cố', icon: Zap },
    { id: 'Service', label: 'Dịch vụ', icon: Home },
    { id: 'Feedback', label: 'Hỏi đáp', icon: FileQuestion },
    { id: 'Security', label: 'Khẩn cấp', icon: AlertCircle }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 3 - files.length);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!category || title.length < 5 || !tenantId) return;

    createMutation.mutate({
      tenantId: String(tenantId),
      title,
      description: desc,
      type: category,
      priority: category === 'Security' ? 'Critical' : 'Medium',
      status: 'Open'
    });
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white pb-32 animate-in fade-in slide-in-from-right-8 duration-700 font-sans relative">
      
      {/* Header Sticky */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100 px-6 pt-8 pb-4">
        <div className="flex items-center justify-between">
           <button onClick={() => navigate(-1)} className="w-10 h-10 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 active:scale-95 transition-all">
              <ArrowLeft size={18} />
           </button>
           <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none">Tạo yêu cầu mới</h2>
           <div className="w-10 h-10" />
        </div>
      </div>

      <div className="p-6 space-y-8 max-w-[800px] mx-auto w-full">
        <div className="space-y-4">
           <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] leading-none">Phân loại <span className="text-rose-500">*</span></h3>
           </div>
           <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-1 px-1">
              {categories.map((cat) => {
                const isSelected = category === cat.id;
                const isEmergency = cat.id === 'Security';
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "px-6 py-3 min-w-fit rounded-[20px] text-xs font-black uppercase tracking-widest transition-all shadow-sm border",
                      isSelected 
                        ? (isEmergency ? "bg-rose-500 text-white border-rose-400 shadow-rose-500/20" : "bg-teal-600 text-white border-teal-500 shadow-teal-500/20") 
                        : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                    )}
                  >
                    {cat.label}
                  </button>
                );
              })}
           </div>
        </div>

        <div className="space-y-8">
           <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] ml-1">Tiêu đề yêu cầu <span className="text-rose-500">*</span></label>
              <input
                type="text"
                placeholder="VD: Vòi nước bồn rửa mặt bị rò rỉ..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-[24px] font-black text-sm text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-teal-500 transition-all outline-none"
              />
           </div>

           <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] ml-1">Mô tả chi tiết</label>
              <textarea
                placeholder="Cung cấp thêm thông tin chi tiết về sự cố hoặc yêu cầu của bạn..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full min-h-[160px] p-6 bg-slate-50 border border-slate-100 rounded-[32px] font-medium text-[15px] text-slate-700 placeholder:text-slate-300 focus:bg-white focus:border-teal-500 transition-all outline-none resize-none leading-relaxed italic"
              />
           </div>

           <div className="space-y-4">
              <div className="flex items-center justify-between ml-1">
                 <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[3px]">Ảnh minh họa</h3>
                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{files.length}/3</span>
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                 {files.map((file, idx) => (
                    <div key={idx} className="relative aspect-square rounded-[20px] overflow-hidden border border-slate-100 shadow-lg group">
                       <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                       <button onClick={() => removeFile(idx)} className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all">
                          <X size={16} />
                       </button>
                    </div>
                 ))}

                 {files.length < 3 && (
                    <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[20px] flex flex-col items-center justify-center text-slate-300 hover:border-teal-500 hover:text-teal-600 transition-all cursor-pointer group">
                       <Camera size={24} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                       <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                    </label>
                 )}
              </div>
           </div>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={!category || title.length < 5 || createMutation.isPending}
          className={cn(
            "w-full h-16 rounded-[28px] font-black uppercase tracking-[4px] text-xs transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50",
            category === 'Security' ? "bg-rose-600 text-white shadow-rose-500/20" : "bg-slate-900 text-white shadow-slate-900/20"
          )}
        >
           {createMutation.isPending ? <Spinner size="sm" /> : (
             <>
               {category === 'Security' ? 'Gửi yêu cầu khẩn cấp' : 'Gửi yêu cầu ngay'}
               <Send size={18} strokeWidth={3} />
             </>
           )}
        </button>
      </div>
    </div>
  );
};

export default CreateTicket;
