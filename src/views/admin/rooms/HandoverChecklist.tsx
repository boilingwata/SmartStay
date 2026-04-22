import React, { useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Home, Building2, ClipboardList, Save, Printer, Trash2, Camera, Info, PenTool, User, ShieldCheck } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { roomService } from '@/services/roomService';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { toast } from 'sonner';
import useAuthStore from '@/stores/authStore';
import { CreateHandoverData, HandoverSection, RoomAsset } from '@/models/Room';
import { useMutation } from '@tanstack/react-query';
import { fileService } from '@/services/fileService';
import { ticketService } from '@/services/ticketService';

const HandoverChecklist = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const type = (location.state?.type as 'CheckIn' | 'CheckOut') || 'CheckIn';
  
  const witnessSigRef = useRef<SignatureCanvas>(null);
  const tenantSigRef = useRef<SignatureCanvas>(null);

  const { data: room, isLoading } = useQuery({
    queryKey: ['room', id],
    queryFn: () => roomService.getRoomDetail(id!)
  });

  const [checklist, setChecklist] = useState<HandoverSection[]>([
    { 
      id: 'default',
      title: 'Tình trạng phòng', 
      items: [
        { id: '1', name: 'Trần, Tường, Sàn', status: 'OK', note: '' },
        { id: '2', name: 'Hệ thống Cửa & Khóa', status: 'OK', note: '' },
        { id: '3', name: 'Ổ cắm & Công tắc', status: 'OK', note: '' },
        { id: '4', name: 'Hệ thống Chiếu sáng', status: 'OK', note: '' },
        { id: '5', name: 'Vòi nước & Thoát sàn', status: 'OK', note: '' },
        { id: '6', name: 'Thiết bị Vệ sinh (WC)', status: 'OK', note: '' },
        { id: '7', name: 'Độ sạch tổng thể', status: 'OK', note: '' },
        { id: '8', name: 'Remote Máy lạnh/TV', status: 'OK', note: '' },
        { id: '9', name: 'Đồng hồ Điện/Nước (Chốt số)', status: 'OK', note: '' },
      ]
    }
  ]);
  
  const [assetHandover, setAssetHandover] = useState<Record<string, string>>({});
  const [assetNotes, setAssetNotes] = useState<Record<string, string>>({});
  const [notes] = useState('');

  const { user } = useAuthStore();
  
  React.useEffect(() => {
    if (room?.assets) {
      const initial: Record<string, string> = {};
      room.assets.forEach(a => {
        initial[a.id] = a.condition;
      });
      setAssetHandover(initial);
    }
  }, [room?.assets]);

  const activeContract = room?.contracts?.find((c) => c.status === 'Active');


  const handleStatusChange = (sectionIdx: number, itemIdx: number, status: 'OK' | 'NotOK') => {
    const newChecklist = [...checklist];
    newChecklist[sectionIdx].items[itemIdx].status = status;
    setChecklist(newChecklist);
  };
  
  const handlePhotoUpload = async (sectionIdx: number, itemIdx: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    return new Promise<void>((resolve) => {
      input.onchange = async (event: Event) => {
        const target = event.target as HTMLInputElement | null;
        const file = target?.files?.[0];
        if (file) {
          try {
            toast.loading('Đang tải ảnh lên...', { id: 'photo-upload' });
            const url = await fileService.uploadFile(file, `handover_${id}_${Date.now()}.png`);
            
            const newChecklist = [...checklist];
            newChecklist[sectionIdx].items[itemIdx].imageUrl = url;
            setChecklist(newChecklist);
            
            toast.success('Đã tải ảnh lên thành công', { id: 'photo-upload' });
          } catch (error: unknown) {
            const err = error as Error;
            toast.error(`Lỗi tải ảnh: ${err.message}`, { id: 'photo-upload' });
          }
        }
        resolve();
      };
      input.click();
    });
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateHandoverData) => roomService.createHandoverChecklist(data),
    onSuccess: async (checklistId) => {
      const allItems = checklist.flatMap((section) =>
        section.items.map((item) => ({ ...item, category: section.title })),
      );
      const notOkItems = allItems.filter((item) => item.status === 'NotOK');
      
      if (notOkItems.length > 0) {
        toast.info(`Đang tạo ${notOkItems.length} yêu cầu bảo trì...`);
        for (const item of notOkItems) {
          try {
            await ticketService.createTicket({
              roomId: Number(id),
              title: `[Bàn giao ${type === 'CheckIn' ? 'Nhận' : 'Trả'}] ${item.name} không đạt`,
              description: `Hạng mục: ${item.name}\nDanh mục: ${item.category}\nGhi chú bàn giao: ${item.note || 'Không có'}\nMã biên bản: #${checklistId}`,
              type: 'Maintenance',
              priority: 'Medium',
              status: 'Open',
              tenantId: activeContract?.tenantId ? Number(activeContract.tenantId) : null,
              assignedToId: null
            });
          } catch {
            toast.error(`Khong the tao yeu cau bao tri cho ${item.name}`);
          }
        }
      }
      toast.success('Đã lưu biên bản bàn giao thành công!');
      navigate(`/owner/rooms/${id}`);
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });
  if (isLoading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;
  if (!room) return <div>Khong tim thay phong.</div>;

  const handleSave = async () => {
    const witnessSigData = witnessSigRef.current?.toDataURL('image/png');
    const tenantSigData = tenantSigRef.current?.toDataURL('image/png');
    
    if (!witnessSigData || witnessSigRef.current?.isEmpty()) {
       toast.error('Vui lòng đại diện quản lý ký xác nhận');
       return;
    }

    if (!user?.id) {
      toast.error('Lỗi phiên đăng nhập');
      return;
    }

    try {
      toast.loading('Đang xử lý biên bản...', { id: 'handover-save' });

      // Convert signatures to Blobs and upload
      const witnessBlob = await (await fetch(witnessSigData)).blob();
      const witnessUrl = await fileService.uploadFile(witnessBlob, `sig_manager_${id}_${Date.now()}.png`, {
        pathPrefix: 'signatures'
      });

      let tenantUrl = null;
      if (tenantSigData && !tenantSigRef.current?.isEmpty()) {
        const tenantBlob = await (await fetch(tenantSigData)).blob();
        tenantUrl = await fileService.uploadFile(tenantBlob, `sig_tenant_${id}_${Date.now()}.png`, {
          pathPrefix: 'signatures'
        });
      }


      const payload: CreateHandoverData = {
        roomId: id!,
        contractId: activeContract?.id,
        tenantId: activeContract?.tenantId,
        handoverType: type,
        performedBy: user.id,
        notes: notes,
        sections: checklist.map((s, idx) => ({
          id: String(idx),
          title: s.title,
          items: s.items.map((it) => ({
            id: it.id,
            name: it.name,
            status: it.status,
            note: it.note,
            imageUrl: it.imageUrl
          }))
        })),
        assets: room.assets.map((a) => ({
          id: a.id,
          assetName: a.assetName,
          assetCode: a.assetCode,
          conditionBefore: a.condition,
          conditionAfter: assetHandover[a.id] || a.condition,
          note: assetNotes[a.id] || ''
        })),
        managerSignatureUrl: witnessUrl,
        tenantSignatureUrl: tenantUrl ?? undefined
      };

      createMutation.mutate(payload);
      toast.dismiss('handover-save');
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(`Lỗi lưu biên bản: ${err.message}`, { id: 'handover-save' });
    }
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
           <button onClick={() => window.print()} className="btn-outline flex items-center gap-2"><Printer size={20} /> In biên bản</button>
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
                       <ClipboardList size={18} /> {section.title}
                    </h3>
                 </div>
                 <div className="p-6 divide-y divide-border/20">
                    {section.items.map((item, iIdx: number) => (
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
                            <button 
                              onClick={() => handlePhotoUpload(sIdx, iIdx)}
                              className={cn(
                                "p-3 border border-border/50 rounded-xl transition-all shadow-sm",
                                item.imageUrl ? "bg-success/10 text-success border-success/30" : "bg-white text-muted hover:text-primary"
                              )}
                            >
                               <Camera size={18} />
                            </button>
                         </div>
                         {item.imageUrl && (
                           <div className="mt-4 relative w-24 h-24 rounded-xl overflow-hidden border-2 border-primary/10 group">
                              <img src={item.imageUrl} alt="Item" className="w-full h-full object-cover" />
                              <button 
                                onClick={() => {
                                  const newChecklist = [...checklist];
                                  newChecklist[sIdx].items[iIdx].imageUrl = undefined;
                                  setChecklist(newChecklist);
                                }}
                                className="absolute top-1 right-1 p-1 bg-danger text-white rounded-md opacity-0 group-hover:opacity-100 transition-all"
                              >
                                 <Trash2 size={10} />
                              </button>
                           </div>
                         )}
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
                           <th className="px-6 py-4">Ghi chú</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-border/20">
                        {room.assets.map((asset: RoomAsset) => (
                           <tr key={asset.id}>
                              <td className="px-6 py-4">
                                 <p className="text-small font-black text-primary uppercase">{asset.assetName}</p>
                                 <p className="text-[10px] font-mono font-bold text-muted">{asset.assetCode}</p>
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <span className="px-2 py-1 bg-bg text-muted rounded text-[10px] font-black uppercase tracking-tighter">{asset.condition}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <select 
                                   value={assetHandover[asset.id] || asset.condition} 
                                   onChange={(e) => setAssetHandover(prev => ({ ...prev, [asset.id]: e.target.value }))}
                                   className="input-base text-[10px] font-black h-8 py-0 min-w-[120px]"
                                 >
                                    <option value="New">New</option>
                                    <option value="Good">Good</option>
                                    <option value="Fair">Fair</option>
                                    <option value="Poor">Poor</option>
                                 </select>
                              </td>
                              <td className="px-6 py-4">
                                 <input 
                                   type="text" 
                                   placeholder="Ghi chú..." 
                                   className="input-base text-[10px] py-1 bg-white/50 w-full"
                                   value={assetNotes[asset.id] || ''}
                                   onChange={(e) => setAssetNotes(prev => ({ ...prev, [asset.id]: e.target.value }))}
                                 />
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
                {activeContract && (
                  <div className="mb-8 p-5 bg-primary rounded-3xl text-white shadow-lg shadow-primary/20">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-3">Đối tượng bàn giao</p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-black text-lg border border-white/20">
                        {activeContract.tenantName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-base">{activeContract.tenantName}</p>
                        <p className="text-[11px] font-bold opacity-80 uppercase tracking-wider">{activeContract.contractCode}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-4">
                      <div className="flex-1">
                         <p className="text-[9px] font-black uppercase opacity-50">Ngày bắt đầu</p>
                         <p className="text-xs font-bold">{activeContract.startDate}</p>
                      </div>
                      <div className="flex-1">
                         <p className="text-[9px] font-black uppercase opacity-50">Ngày kết thúc</p>
                         <p className="text-xs font-bold">{activeContract.endDate}</p>
                      </div>
                    </div>
                  </div>
                )}
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
