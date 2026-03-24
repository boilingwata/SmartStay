import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Send, Camera, Paperclip, ChevronRight, MessageSquare, 
  AlertCircle, X, Check, Clock, Home, Zap, Wrench, FileQuestion
} from 'lucide-react';
import { cn } from '@/utils';
import { toast } from 'sonner';

const CreateTicket: React.FC = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [preferredTimes, setPreferredTimes] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { id: 'Sửa chữa', icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { id: 'Sự cố', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { id: 'Dịch vụ', icon: Home, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { id: 'Hỏi đáp', icon: FileQuestion, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { id: 'Khẩn cấp', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
  ];

  const timeslots = [
    { id: 'morning', label: 'Sáng', time: '08:00 - 12:00' },
    { id: 'afternoon', label: 'Chiều', time: '12:00 - 17:00' },
    { id: 'evening', label: 'Tối', time: '17:00 - 21:00' }
  ];

  const handleTimeToggle = (id: string) => {
    setPreferredTimes(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(f => {
        if (f.size > 20 * 1024 * 1024) {
          toast.error(`File ${f.name} vượt quá giới hạn 20MB`);
          return false;
        }
        return true;
      });
      
      setFiles(prev => {
        const combined = [...prev, ...validFiles];
        if (combined.length > 3) {
          toast.error('Chỉ được tải lên tối đa 3 file');
          return combined.slice(0, 3);
        }
        return combined;
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!category) {
      toast.error('Vui lòng chọn loại yêu cầu');
      return;
    }
    if (title.length < 5) {
      toast.error('Tiêu đề phải có ít nhất 5 ký tự');
      return;
    }

    const priority = category === 'Khẩn cấp' ? 'Critical' : 'Medium';
    toast.success(`Đã gửi yêu cầu ${category === 'Khẩn cấp' ? 'khẩn cấp ' : ''}thành công!`);
    navigate('/portal/tickets');
  };

  const isEmergency = category === 'Khẩn cấp';

  return (
    <div className="flex flex-col min-h-screen bg-[#F1F5F9] pb-32 animate-in fade-in duration-1000 no-scrollbar relative overflow-x-hidden">
      
      {/* 1. Lush Premium Header */}
      <div className="relative h-[280px] w-full overflow-hidden bg-gradient-to-br from-[#1B3A6B] via-[#0D8A8A] to-[#2E5D9F] px-8 pt-12">
        {/* Animated Mesh Overlays */}
        <div className="absolute inset-0 opacity-40 mix-blend-overlay">
          <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[120%] bg-white/20 blur-[120px] rounded-full animate-float"></div>
          <div className="absolute bottom-[-30%] right-[-10%] w-[60%] h-[100%] bg-emerald-400/20 blur-[100px] rounded-full"></div>
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[22px] flex items-center justify-center text-white active:scale-95 transition-all shadow-xl hover:bg-white/20"
            >
              <ArrowLeft size={24} strokeWidth={2.5} />
            </button>
            <div className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[22px] flex items-center justify-center text-white shadow-xl">
               <MessageSquare size={24} strokeWidth={2.5} />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[12px] font-black text-white/60 uppercase tracking-[5px] italic">Technical Center</p>
            <h1 className="text-[36px] font-black text-white tracking-tighter leading-tight italic">
              Tạo <span className="text-emerald-400">Yêu Cầu</span>
            </h1>
          </div>
        </div>
      </div>

      {/* 2. Overlapping Form Card */}
      <div className="px-5 -mt-16 relative z-20 w-full mx-auto space-y-8">
        <div className="bg-white/90 backdrop-blur-2xl rounded-[40px] p-8 shadow-premium border border-white/60 space-y-10 relative">
          
          {/* Category Section */}
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[3px] italic">Bản chất yêu cầu <span className="text-rose-500">*</span></h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phân loại giúp xử lý nhanh hơn</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {categories.map((cat, idx) => {
                const isSelected = category === cat.id;
                const Icon = cat.icon;
                const isCatEmergency = cat.id === 'Khẩn cấp';

                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "relative p-5 rounded-[28px] border-2 flex flex-col items-start gap-4 transition-all duration-500 active:scale-95 overflow-hidden text-left shadow-sm",
                      isSelected 
                        ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.03] z-10" 
                        : "bg-slate-50 border-transparent hover:border-[#0D8A8A]/30",
                      idx === categories.length - 1 ? "col-span-2 flex-row items-center" : ""
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-[20px] flex items-center justify-center shrink-0 transition-all",
                      isSelected ? "bg-[#0D8A8A] text-white shadow-glow" : cat.bg + " " + cat.color
                    )}>
                      <Icon size={22} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                       <span className={cn(
                         "text-[13px] font-black uppercase tracking-tight italic",
                         isSelected ? "text-white" : "text-slate-800"
                       )}>{cat.id}</span>
                       {idx === categories.length - 1 && isSelected && (
                         <div className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mt-1 animate-pulse"> Priority High </div>
                       )}
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#0D8A8A] shadow-glow" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Issue Details */}
          <div className="space-y-6">
            <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[3px] italic">Thông tin sự cố</h3>
            
            {/* Title Input */}
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tiêu đề ngắn gọn</label>
               <input
                 type="text"
                 placeholder="Cần hỗ trợ về..."
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 className="w-full h-16 px-6 bg-slate-50 border-2 border-transparent rounded-[24px] focus:bg-white focus:border-[#0D8A8A]/30 transition-all outline-none font-black text-slate-800 placeholder:text-slate-300 shadow-inner"
               />
            </div>

            {/* Description Input */}
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Mô tả chi tiết</label>
               <textarea
                 placeholder="Vui lòng mô tả chi tiết tình trạng hiện tại..."
                 rows={4}
                 value={desc}
                 onChange={(e) => setDesc(e.target.value)}
                 className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[24px] focus:bg-white focus:border-[#0D8A8A]/30 transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300 shadow-inner resize-none leading-relaxed"
               />
            </div>
          </div>

          {/* Media Upload */}
          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
               <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[3px] italic">Hình ảnh & Video</h3>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{files.length}/3</span>
             </div>
             <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {files.length < 3 && (
                   <div className="flex gap-3">
                      <button onClick={() => cameraInputRef.current?.click()} className="w-24 h-24 rounded-[28px] bg-slate-100 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-[#0D8A8A] hover:bg-teal-50 hover:border-[#0D8A8A]/30 transition-all active:scale-90">
                         <Camera size={24} />
                         <span className="text-[8px] font-black uppercase tracking-widest">Camera</span>
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-[28px] bg-slate-100 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 hover:border-indigo-200 transition-all active:scale-90">
                         <Paperclip size={24} />
                         <span className="text-[8px] font-black uppercase tracking-widest">Gallery</span>
                      </button>
                   </div>
                )}
                
                <input type="file" accept="image/*,video/mp4" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileChange} />

                {files.map((file, idx) => (
                   <div key={idx} className="relative w-24 h-24 rounded-[28px] overflow-hidden shadow-premium group shrink-0">
                      <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeFile(idx)} className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-rose-500 shadow-lg active:scale-75 transition-all opacity-0 group-hover:opacity-100">
                         <X size={14} strokeWidth={3} />
                      </button>
                   </div>
                ))}
             </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Timeslots */}
          <div className="space-y-6">
             <div className="flex flex-col gap-1">
               <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[3px] italic">Lịch hẹn mong muốn</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thời gian kỹ thuật có thể đến</p>
             </div>
             <div className="grid grid-cols-1 gap-3">
                {timeslots.map(slot => {
                  const isSelected = preferredTimes.includes(slot.id);
                  return (
                    <div key={slot.id} onClick={() => handleTimeToggle(slot.id)} className={cn(
                      "flex items-center justify-between p-5 rounded-[24px] border-2 cursor-pointer transition-all duration-300",
                      isSelected ? "bg-[#0D8A8A] border-[#0D8A8A] text-white shadow-premium scale-[1.02]" : "bg-slate-50 border-transparent hover:border-[#0D8A8A]/30"
                    )}>
                       <div className="flex items-center gap-4">
                          <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all", isSelected ? "bg-white border-white text-[#0D8A8A]" : "border-slate-300 text-transparent")}>
                             {isSelected && <Check size={12} strokeWidth={4} />}
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[13px] font-black uppercase tracking-tight italic">{slot.label}</span>
                             <span className={cn("text-[10px] font-bold tabular-nums tracking-widest", isSelected ? "text-white/60" : "text-slate-400")}>{slot.time}</span>
                          </div>
                       </div>
                       <Clock size={16} className={isSelected ? "text-white/40" : "text-slate-200"} />
                    </div>
                  );
                })}
             </div>
          </div>

        </div>

        {/* Action Bar */}
        <div className="pt-4 space-y-4">
           {isEmergency && (
             <div className="flex items-center gap-3 justify-center text-rose-500 animate-pulse">
                <AlertCircle size={16} />
                <span className="text-[11px] font-black uppercase tracking-[2px]">Báo động khẩn cấp được kích hoạt</span>
             </div>
           )}
           <button 
             onClick={handleSubmit} 
             disabled={!category || !title} 
             className={cn(
               "w-full h-20 rounded-[30px] flex items-center justify-center gap-4 text-[15px] font-black uppercase tracking-[4px] italic shadow-2xl active:scale-95 transition-all group overflow-hidden border border-white/20 disabled:grayscale disabled:opacity-50",
               isEmergency ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white" : "bg-slate-900 text-white"
             )}
           >
              <span className="relative z-10">{isEmergency ? 'Gửi Yêu Cầu Gấp' : 'Xác nhận gửi'}</span>
              <Send size={22} className="relative z-10 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
           </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTicket;

