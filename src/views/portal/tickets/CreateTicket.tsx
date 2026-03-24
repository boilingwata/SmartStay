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
    <div className="flex flex-col min-h-[100dvh] bg-slate-50/50 pb-32 animate-in fade-in duration-700 font-sans relative">
      
      {/* 1. Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-gray-100 px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-11 h-11 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition-all hover:bg-slate-50"
          >
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Tạo yêu cầu</h2>
        </div>
      </div>

      {/* 2. Form Content */}
      <div className="px-5 pt-6 space-y-8 pb-10">
        
        {/* E.10.1 Ticket Type Selector — Horizontal Scroll Chips */}
        <div className="space-y-3">
           <h3 className="text-sm font-bold text-gray-900 ml-1">Loại yêu cầu <span className="text-red-500">*</span></h3>
           <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
              {categories.map((cat) => {
                const isSelected = category === cat.id;
                const isEmergency = cat.id === 'Khẩn cấp';
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "px-4 py-2 text-sm whitespace-nowrap rounded-full font-semibold transition-all duration-300",
                      isSelected 
                        ? (isEmergency ? "bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse" : "bg-teal-600 text-white shadow-lg shadow-teal-200")
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {cat.id}
                  </button>
                );
              })}
           </div>
        </div>

        {/* E.10.2 Form Fields */}
        <div className="space-y-6">
           {/* Tiêu đề */}
           <div className="space-y-2">
              <h3 className="text-sm font-bold text-gray-900 ml-1">Tiêu đề <span className="text-red-500">*</span></h3>
              <input
                type="text"
                placeholder="Nhập tiêu đề yêu cầu..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-12 px-5 bg-white border border-gray-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none text-sm font-medium"
              />
              <p className="text-[10px] text-gray-400 font-medium ml-1">Tiêu đề dài từ 5 - 200 ký tự</p>
           </div>

           {/* Mô tả chi tiết */}
           <div className="space-y-2">
              <h3 className="text-sm font-bold text-gray-900 ml-1">Mô tả chi tiết</h3>
              <textarea
                placeholder="Mô tả cụ thể vấn đề bạn đang gặp phải..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full min-h-[120px] p-5 bg-white border border-gray-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none text-sm font-medium resize-none leading-relaxed"
                maxLength={2000}
              />
           </div>

           {/* Ảnh/video đính kèm */}
           <div className="space-y-3">
              <div className="flex items-center justify-between ml-1">
                 <h3 className="text-sm font-bold text-gray-900">Ảnh/video đính kèm</h3>
                 <span className="text-xs text-gray-400 font-medium">{files.length}/3 files</span>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                 {/* Thumbnail previews */}
                 {files.map((file, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 shadow-sm group">
                       <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                       <button 
                         onClick={() => removeFile(idx)}
                         className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                          <X size={14} />
                       </button>
                    </div>
                 ))}

                 {/* Upload slots */}
                 {files.length < 3 && (
                    <div className="aspect-square flex flex-col gap-2">
                       <label 
                         htmlFor="file-input" 
                         className="flex-1 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-teal-500 hover:text-teal-600 transition-all cursor-pointer bg-white"
                       >
                          <Paperclip size={20} />
                          <span className="text-[10px] font-bold uppercase mt-1">Gallery</span>
                       </label>
                       
                       <label 
                         htmlFor="camera-input" 
                         className="flex-1 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-teal-500 hover:text-teal-600 transition-all cursor-pointer bg-white"
                       >
                          <Camera size={20} />
                          <span className="text-[10px] font-bold uppercase mt-1">Camera</span>
                       </label>
                    </div>
                 )}
              </div>

              <input 
                id="file-input"
                type="file" 
                accept="image/*,video/*" 
                multiple 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
              />
              <input 
                id="camera-input" 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                ref={cameraInputRef} 
                onChange={handleFileChange} 
              />
              <p className="text-[10px] text-gray-400 font-medium italic">* Tối đa 3 file, 20MB/file</p>
           </div>

           {/* Thời gian thuận tiện */}
           <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 ml-1">Thời gian thuận tiện</h3>
              <div className="flex gap-2">
                 {timeslots.map(slot => {
                    const isSelected = preferredTimes.includes(slot.id);
                    return (
                      <button 
                        key={slot.id}
                        onClick={() => handleTimeToggle(slot.id)}
                        className={cn(
                          "px-5 py-2.5 rounded-full text-sm font-semibold transition-all border",
                          isSelected 
                            ? "bg-teal-50 border-teal-200 text-teal-700 shadow-sm" 
                            : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                        )}
                      >
                         {slot.label}
                      </button>
                    );
                 })}
              </div>
           </div>
        </div>

        {/* Submit Button */}
        <button 
          onClick={handleSubmit}
          disabled={!category || title.length < 5}
          className={cn(
            "w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-base font-bold transition-all shadow-xl shadow-teal-100 active:scale-95 disabled:grayscale disabled:opacity-50",
            category === 'Khẩn cấp' ? "bg-red-500 text-white" : "bg-teal-600 text-white hover:bg-teal-700"
          )}
        >
           <span>{category === 'Khẩn cấp' ? 'Gửi yêu cầu khẩn cấp' : 'Gửi yêu cầu'}</span>
           <Send size={20} />
        </button>

      </div>
    </div>
  );
};

export default CreateTicket;

