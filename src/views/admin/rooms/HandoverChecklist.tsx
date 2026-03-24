import React, { useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Home, Building2, ClipboardList, 
  Save, Printer, Trash2, CheckCircle2, XCircle,
  Camera, Info, PenTool, User, ShieldCheck
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { roomService } from '@/services/roomService';
import { useQuery } from '@tanstack/react-query';
import { cn, formatVND } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { toast } from 'sonner';

const HandoverChecklist = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const type = (location.state?.type as 'CheckIn' | 'CheckOut') || 'CheckIn';
  
  const witnessSigRef = useRef<any>(null);
  const tenantSigRef = useRef<any>(null);

  const { data: room, isLoading } = useQuery({
    queryKey: ['room', id],
    queryFn: () => roomService.getRoomDetail(id!)
  });

  const [checklist, setChecklist] = useState<any[]>([
    { section: 'Hệ thống điện', items: [
      { id: 'E1', name: 'Đèn chiếu sáng (Bình thường)', status: 'OK', note: '' },
      { id: 'E2', name: 'Ổ cắm/Công tắc', status: 'OK', note: '' },
      { id: 'E3', name: 'Tầng tủ điện/Atomat (An toàn)', status: 'OK', note: '' },
    ]},
    { section: 'Hệ thống nước', items: [
      { id: 'W1', name: 'Vòi sen/Vòi rửa', status: 'OK', note: '' },
      { id: 'W2', name: 'Xả WC/Thoát sàn', status: 'OK', note: '' },
      { id: 'W3', name: 'Bình nóng lạnh (Hoạt động)', status: 'OK', note: '' },
    ]},
    { section: 'Tiện ích & Nội thất', items: [
      { id: 'F1', name: 'Giường/Đệm/Tủ', status: 'OK', note: '' },
      { id: 'F2', name: 'Sơn tường/Sàn nhà', status: 'OK', note: '' },
      { id: 'F3', name: 'Cửa ra vào/Cửa sổ/Khóa', status: 'OK', note: '' },
    ]}
  ]);

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;
  if (!room) return <div>Không tìm thấy phòng.</div>;

  const handleStatusChange = (sectionIdx: number, itemIdx: number, status: 'OK' | 'NotOK') => {
    const newChecklist = [...checklist];
    newChecklist[sectionIdx].items[itemIdx].status = status;
    setChecklist(newChecklist);
  };

  const handleSave = () => {
    // 1.6 Checklist Item #6: Signature data collection
    const witnessSig = witnessSigRef.current?.toDataURL('image/png');
    const tenantSig = tenantSigRef.current?.toDataURL('image/png');
    
    if (!witnessSig || witnessSigRef.current?.isEmpty()) {
       toast.error('Vui lòng đại diện quản lý ký xác nhận');
       return;
    }
    
    toast.success('Đã lưu biên bản bàn giao thành công!');
    navigate(`/admin/rooms/${id}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      {/* 1.4 Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b-2 border-primary/10">
        <div className="flex items-center gap-5">
           <button onClick={() => navigate(-1)} className="p-3 hover:bg-bg rounded-2xl shadow-sm border">
             <ArrowLeft size={22} />
           </button>
           <div>
              <div className="flex items-center gap-3">
                 <h1 className="text-display text-primary leading-none">Biên bản bàn giao</h1>
                 <span className={cn(
                   "px-4 py-1.5 rounded-full text-small font-black uppercase tracking-widest",
                   type === 'CheckIn' ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                 )}>
                    {type === 'CheckIn' ? 'Bàn giao nhận phòng (Check-in)' : 'Bàn giao trả phòng (Check-out)'}
                 </span>
              </div>
              <p className="text-body text-muted flex items-center gap-2 mt-2">
                 <Home size={16} /> Phòng {room.roomCode} / <Building2 size={16} /> {room.buildingName}
              </p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <button className="btn-outline flex items-center gap-2"><Printer size={20} /> Preview</button>
           <button onClick={handleSave} className="btn-primary flex items-center gap-2 px-8 shadow-xl shadow-primary/20">
              <Save size={20} /> Hoàn tất lưu
           </button>
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         <div className="lg:col-span-8 space-y-8">
            {checklist.map((section, sIdx) => (
              <div key={sIdx} className="card-container p-0 overflow-hidden border-primary/10 bg-white/40 backdrop-blur-md">
                 <div className="bg-primary p-5 text-white">
                    <h3 className="text-body font-black uppercase tracking-widest flex items-center gap-2">
                       <ClipboardList size={18} /> {section.section}
                    </h3>
                 </div>
                 <div className="p-6 divide-y divide-border/20">
                    {section.items.map((item: any, iIdx: number) => (
                      <div key={item.id} className="py-5 first:pt-0 last:pb-0">
                         <div className="flex items-center justify-between mb-3">
                            <span className="text-body font-black text-primary">{item.name}</span>
                            <div className="flex items-center bg-bg/50 p-1 rounded-xl border border-border/40">
                               <button 
                                 onClick={() => handleStatusChange(sIdx, iIdx, 'OK')}
                                 className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", item.status === 'OK' ? "bg-success text-white shadow-lg" : "text-muted hover:text-text")}
                               >
                                  OK
                               </button>
                               <button 
                                 onClick={() => handleStatusChange(sIdx, iIdx, 'NotOK')}
                                 className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", item.status === 'NotOK' ? "bg-danger text-white shadow-lg" : "text-muted hover:text-text")}
                               >
                                  Failed
                               </button>
                            </div>
                         </div>
                         <div className="flex gap-4">
                            <div className="flex-1">
                               <input 
                                 type="text" 
                                 placeholder="Ghi chú chi tiết tình trạng..." 
                                 className="input-base w-full text-small py-2.5 bg-white/50" 
                                 value={item.note}
                                 onChange={(e) => {
                                   const newChecklist = [...checklist];
                                   newChecklist[sIdx].items[iIdx].note = e.target.value;
                                   setChecklist(newChecklist);
                                 }}
                               />
                            </div>
                            <button className="p-3 bg-white border border-border/50 text-muted hover:text-primary rounded-xl transition-all shadow-sm">
                               <Camera size={18} />
                            </button>
                         </div>
                         {item.status === 'NotOK' && (
                            <div className="mt-3 p-3 bg-danger/5 rounded-xl border border-danger/10 text-[10px] text-danger font-bold italic flex items-center gap-2">
                               <Info size={12} /> Cảnh báo: Mục này sẽ trigger yêu cầu bảo trì sau khi lưu biên bản.
                            </div>
                         )}
                      </div>
                    ))}
                 </div>
              </div>
            ))}

            {/* Assets Table */}
            <div className="card-container p-8 space-y-6">
               <h3 className="text-h3 text-primary font-black uppercase tracking-[2px] flex items-center gap-2">
                  <ShieldCheck size={24} className="text-accent" /> Tình trạng Tài sản
               </h3>
               <div className="overflow-hidden rounded-2xl border border-border/40">
                  <table className="w-full text-left">
                     <thead className="bg-bg/50 uppercase text-[9px] font-black tracking-widest text-muted">
                        <tr>
                           <th className="px-6 py-4">Tài sản (Asset)</th>
                           <th className="px-6 py-4 text-center">Trạng thái trước</th>
                           <th className="px-6 py-4 text-center">Xác nhận hiện tại</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-border/20">
                        {room.assets.map((asset: any) => (
                           <tr key={asset.id}>
                              <td className="px-6 py-4">
                                 <p className="text-small font-black text-primary uppercase">{asset.assetName}</p>
                                 <p className="text-[10px] font-mono font-bold text-muted">{asset.assetCode}</p>
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <span className="px-2 py-1 bg-bg text-muted rounded text-[10px] font-black uppercase tracking-tighter">{asset.condition}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <select defaultValue="Good" className="input-base text-[10px] font-black h-8 py-0 min-w-[120px]">
                                    <option value="New">New</option>
                                    <option value="Good">Good</option>
                                    <option value="Fair">Fair</option>
                                    <option value="Poor">Poor</option>
                                 </select>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         {/* 1.4 Signature Section */}
         <div className="lg:col-span-4 space-y-8">
            <div className="p-8 bg-white/60 rounded-[40px] border border-primary/5 sticky top-10 shadow-2xl shadow-primary/5">
                <h3 className="text-body font-black uppercase tracking-widest text-primary border-b pb-4 mb-8">Ký tên xác nhận</h3>
                
                <div className="space-y-10">
                   {/* Witness Signature */}
                   <div className="space-y-3">
                      <p className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2"><User size={14} className="text-accent" /> Đại diện Quản lý (Bên A)</p>
                      <div className="bg-white border-2 border-dashed border-border rounded-2xl overflow-hidden relative group">
                         <SignatureCanvas 
                           ref={witnessSigRef}
                           penColor="#1B3A6B"
                           canvasProps={{ className: "w-full h-40" }}
                         />
                         <button 
                           onClick={() => witnessSigRef.current?.clear()}
                           className="absolute top-2 right-2 p-1.5 bg-bg text-muted hover:text-danger rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                         >
                            <Trash2 size={14} />
                         </button>
                      </div>
                   </div>

                   {/* Tenant Signature */}
                   <div className="space-y-3">
                      <p className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2"><PenTool size={14} className="text-accent" /> Cư dân xác nhận (Bên B)</p>
                      <div className="bg-white border-2 border-dashed border-border rounded-2xl overflow-hidden relative group">
                         <SignatureCanvas 
                           ref={tenantSigRef}
                           penColor="#1B3A6B"
                           canvasProps={{ className: "w-full h-40" }}
                         />
                         <button 
                           onClick={() => tenantSigRef.current?.clear()}
                           className="absolute top-2 right-2 p-1.5 bg-bg text-muted hover:text-danger rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                         >
                            <Trash2 size={14} />
                         </button>
                      </div>
                   </div>
                </div>

                <div className="mt-10 p-4 bg-primary/5 rounded-2xl text-[10px] font-bold text-primary italic leading-relaxed">
                   * Việc các bên ký tên xác nhận có đầy đủ giá trị pháp lý trong việc bàn giao hiện trạng phòng và tài sản đi kèm theo hợp đồng.
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default HandoverChecklist;
