// RULE-09: IMMUTABLE - Tuyệt đối không Edit/Delete lịch sử chính sách
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Zap, 
  History, 
  Plus, 
  Calendar, 
  FileText, 
  Info,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { 
  getCurrentElectricityPolicy, 
  getElectricityPolicyHistory 
} from "@/services/policyService";
import { 
  StatusBadge, 
  TierTableInput, 
  ConfirmDialog 
} from "@/components/shared";
import CreatePolicyModal from "@/components/policy/CreatePolicyModal";
import PolicyHistoryTable from "@/components/policy/PolicyHistoryTable";
import { ErrorBanner, EmptyState } from "@/components/ui/StatusStates";
import { cn, formatDate } from "@/utils";

/**
 * RULE-09: ElectricityPolicies IMMUTABLE
 * - Không cho phép Edit hoặc Delete bất kỳ bản ghi lịch sử nào.
 * - Để cập nhật giá: POST /api/electricity-policies.
 * - Backend sẽ tự động UPDATE EffectiveTo của bản ghi hiện tại và INSERT bản ghi mới.
 */

export const ElectricityPolicyPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  // 1. Fetch Current Policy
  const { 
    data: currentPolicy, 
    isLoading: isLoadingCurrent, 
    isError: isErrorCurrent,
    refetch: refetchCurrent
  } = useQuery({
    queryKey: ['electricity-policy', 'current'],
    queryFn: getCurrentElectricityPolicy,
  });

  // 2. Fetch Policy History
  const { 
    data: history, 
    isLoading: isLoadingHistory,
    isError: isErrorHistory,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['electricity-policy', 'history'],
    queryFn: getElectricityPolicyHistory,
  });

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['electricity-policy'] });
    setShowCreateModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 space-y-12 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-[3px] text-xs">
            <Zap size={14} fill="currentColor" />
            Cấu hình hệ thống
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Chính sách giá Điện</h1>
          <p className="text-slate-500 font-medium italic">Quản lý biểu giá điện bậc thang và lịch sử áp dụng</p>
        </div>
      </div>

      {/* Section 1: Current Policy */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
           <h2 className="text-lg font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
             <ShieldCheck size={20} className="text-blue-500" />
             Chính sách Điện Hiện tại
           </h2>
           {currentPolicy && <StatusBadge status="Active" label="ĐANG HIỆU LỰC" />}
        </div>

        {isLoadingCurrent ? (
           <div className="w-full h-[400px] bg-slate-50 animate-pulse rounded-[32px] border border-slate-100" />
        ) : isErrorCurrent ? (
           <ErrorBanner message="Không tải được chính sách hiện tại" onRetry={refetchCurrent} />
        ) : currentPolicy ? (
           <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden group">
              <div className="p-8 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-1.5">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tên chính sách</p>
                       <p className="text-lg font-bold text-slate-900">{currentPolicy.policyName}</p>
                    </div>
                    <div className="space-y-1.5">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ngày hiệu lực</p>
                       <div className="flex items-center gap-2 text-slate-700 font-bold">
                          <Calendar size={16} className="text-blue-500" />
                          {formatDate(currentPolicy.effectiveFrom)}
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Căn cứ pháp lý</p>
                       <div className="flex items-center gap-2 text-slate-700 font-bold truncate">
                          <FileText size={16} className="text-emerald-500" />
                          {currentPolicy.legalReference || "—"}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-black uppercase tracking-[2px] text-slate-400">Biểu giá bậc thang (áp dụng)</h3>
                        <div className="bg-slate-50 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 border border-slate-100">
                          Thuế VAT: {currentPolicy.vatRate}%
                        </div>
                    </div>
                    <TierTableInput
                       value={currentPolicy.tiers}
                       onChange={() => {}}
                       vatRate={currentPolicy.vatRate}
                       unit="kWh"
                       disabled={true}
                    />
                 </div>
              </div>
              
              <div className="bg-blue-50/50 px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-blue-100">
                 <div className="flex items-center gap-3 text-blue-600">
                    <Info size={16} />
                    <p className="text-xs font-bold leading-none italic">
                        Biểu thị danh sách các bậc giá đang dùng để tính tiền điện hàng tháng.
                    </p>
                 </div>
                 <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-6 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black transition-all shadow-lg active:scale-95 uppercase tracking-wider text-[10px]"
                 >
                    <Plus size={16} />
                    Cập nhật chính sách mới
                 </button>
              </div>
           </div>
        ) : (
          <EmptyState 
            title="Chưa có chính sách nào được thiết lập"
            message="Vui lòng tạo chính sách biểu giá điện đầu tiên để hệ thống bắt đầu tính toán hóa đơn."
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
            type="electricity" 
          />
        )}
      </section>

      {/* Create Modal */}
      <CreatePolicyModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
        type="electricity"
        currentPolicy={currentPolicy || null}
      />
      
      {/* Global Confirmation for actions */}
      <ConfirmDialog />
    </div>
  );
};

export default ElectricityPolicyPage;
