// RULE-09: IMMUTABLE - Tuyệt đối không Edit/Delete lịch sử chính sách
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Droplets, 
  History, 
  Plus, 
  Calendar, 
  FileText, 
  Info,
  MapPin,
  Leaf,
  Wrench,
  ShieldCheck
} from "lucide-react";
import { 
  getCurrentWaterPolicy, 
  getWaterPolicyHistory 
} from "@/services/policyService";
import { 
  StatusBadge, 
  TierTableInput, 
  ConfirmDialog 
} from "@/components/shared";
import CreatePolicyModal from "@/components/policy/CreatePolicyModal";
import PolicyHistoryTable from "@/components/policy/PolicyHistoryTable";
import { ErrorBanner, EmptyState } from "@/components/ui/StatusStates";
import { cn, formatDate, formatVND } from "@/utils";

/**
 * RULE-09: WaterPolicies IMMUTABLE
 * - Không cho phép Edit hoặc Delete bất kỳ bản ghi lịch sử nào.
 * - Để cập nhật giá: POST /api/water-policies.
 * - Backend sẽ tự động UPDATE EffectiveTo của bản ghi hiện tại và INSERT bản ghi mới.
 */

export const WaterPolicyPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  // 1. Fetch Current Water Policy
  const { 
    data: currentPolicy, 
    isLoading: isLoadingCurrent, 
    isError: isErrorCurrent,
    refetch: refetchCurrent
  } = useQuery({
    queryKey: ['water-policy', 'current'],
    queryFn: getCurrentWaterPolicy,
  });

  // 2. Fetch Water Policy History
  const { 
    data: history, 
    isLoading: isLoadingHistory,
    isError: isErrorHistory,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['water-policy', 'history'],
    queryFn: getWaterPolicyHistory,
  });

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['water-policy'] });
    setShowCreateModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 space-y-12 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-600 font-black uppercase tracking-[3px] text-xs">
            <Droplets size={14} fill="currentColor" />
            Cấu hình hệ thống
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Chính sách giá Nước</h1>
          <p className="text-slate-500 font-medium italic">Quản lý biểu giá nước bậc thang, phí môi trường và lịch sử áp dụng</p>
        </div>
      </div>

      {/* Section 1: Current Policy */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
           <h2 className="text-lg font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
             <ShieldCheck size={20} className="text-cyan-500" />
             Chính sách Nước Hiện tại
           </h2>
           {currentPolicy && <StatusBadge status="Active" label="ĐANG HIỆU LỰC" />}
        </div>

        {isLoadingCurrent ? (
           <div className="w-full h-[450px] bg-slate-50 animate-pulse rounded-[32px] border border-slate-100" />
        ) : isErrorCurrent ? (
           <ErrorBanner message="Không tải được chính sách hiện tại" onRetry={refetchCurrent} />
        ) : currentPolicy ? (
           <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden group">
              <div className="p-8 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-8">
                    <div className="space-y-1.5 md:col-span-1">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tên chính sách</p>
                       <p className="text-lg font-bold text-slate-900">{currentPolicy.policyName}</p>
                    </div>
                    <div className="space-y-1.5">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ngày hiệu lực</p>
                       <div className="flex items-center gap-2 text-slate-700 font-bold">
                          <Calendar size={16} className="text-cyan-500" />
                          {formatDate(currentPolicy.effectiveFrom)}
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vùng/Khu vực</p>
                       <div className="flex items-center gap-2 text-slate-700 font-bold">
                          <MapPin size={16} className="text-orange-500" />
                          {currentPolicy.zoneName}
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phí môi trường</p>
                       <div className="flex items-center gap-2 text-slate-700 font-bold">
                          <Leaf size={16} className="text-emerald-500" />
                          {formatVND(currentPolicy.environmentFee)}/m3
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phí bảo trì</p>
                       <div className="flex items-center gap-2 text-slate-700 font-bold">
                          <Wrench size={16} className="text-slate-500" />
                          {formatVND(currentPolicy.maintenanceFee)}/m3
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Thuế VAT</p>
                       <div className="flex items-center gap-2 text-slate-700 font-bold">
                          {currentPolicy.vatRate}%
                       </div>
                    </div>

                    <div className="space-y-1.5 md:col-span-3">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Căn cứ pháp lý</p>
                       <div className="flex items-center gap-2 text-slate-700 font-bold truncate">
                          <FileText size={16} className="text-blue-500" />
                          {currentPolicy.legalReference || "—"}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-black uppercase tracking-[2px] text-slate-400">Biểu giá bậc thang (áp dụng)</h3>
                    </div>
                    <TierTableInput
                       value={currentPolicy.tiers}
                       onChange={() => {}}
                       vatRate={currentPolicy.vatRate}
                       unit="m3"
                       disabled={true}
                    />
                 </div>
              </div>
              
              <div className="bg-cyan-50/50 px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-cyan-100">
                 <div className="flex items-center gap-3 text-cyan-700">
                    <Info size={16} />
                    <p className="text-xs font-bold leading-none italic">
                        Biểu thị danh sách các bậc giá nước đang dùng để tính tiền nước hàng tháng.
                    </p>
                 </div>
                 <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-6 h-11 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-black transition-all shadow-lg active:scale-95 uppercase tracking-wider text-[10px]"
                 >
                    <Plus size={16} />
                    Cập nhật chính sách mới
                 </button>
              </div>
           </div>
        ) : (
          <EmptyState 
            title="Chưa có chính sách nào được thiết lập"
            message="Vui lòng tạo chính sách biểu giá nước đầu tiên để hệ thống bắt đầu tính toán hóa đơn."
            actionLabel="Tạo chính sách đầu tiên"
            onAction={() => setShowCreateModal(true)}
          />
        )}
      </section>

      {/* Section 2: Policy History */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
           <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
              <History size={20} />
           </div>
           <h2 className="text-lg font-black uppercase tracking-wider text-slate-800">
             Lịch sử chính sách
           </h2>
        </div>

        {isLoadingHistory ? (
          <div className="space-y-4">
             {[1, 2, 3].map(i => (
                <div key={i} className="h-16 w-full bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />
             ))}
          </div>
        ) : isErrorHistory ? (
           <ErrorBanner message="Không tải được lịch sử chính sách" onRetry={refetchHistory} />
        ) : (
          <PolicyHistoryTable 
            policies={history || []} 
            type="water" 
          />
        )}
      </section>

      {/* Create Modal */}
      <CreatePolicyModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
        type="water"
        currentPolicy={currentPolicy || null}
      />
      
      {/* Global Confirmation for actions */}
      <ConfirmDialog />
    </div>
  );
};

export default WaterPolicyPage;
