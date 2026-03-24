// RULE-09: IMMUTABLE - Tuyệt đối không Edit/Delete lịch sử chính sách
import React, { useState } from "react";
import { Eye, Clock, ShieldCheck, ExternalLink } from "lucide-react";
import { Modal, StatusBadge, TierTableInput } from "@/components/shared";
import { ElectricityPolicy, WaterPolicy } from "@/types/policy";
import { formatDate, cn } from "@/utils";

interface PolicyHistoryTableProps {
  policies: ElectricityPolicy[] | WaterPolicy[];
  type: "electricity" | "water";
}

export const PolicyHistoryTable: React.FC<PolicyHistoryTableProps> = ({
  policies,
  type,
}) => {
  const [selectedPolicy, setSelectedPolicy] = useState<ElectricityPolicy | WaterPolicy | null>(null);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-[24px] border border-slate-100 bg-white shadow-xl shadow-slate-200/40">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[2px] text-slate-400">Tên chính sách</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[2px] text-slate-400">Hiệu lực từ</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[2px] text-slate-400">Hiệu lực đến</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[2px] text-slate-400">Số văn bản</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[2px] text-slate-400">Trạng thái</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[2px] text-slate-400 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {policies.map((policy) => (
              <tr 
                 key={policy.policyId} 
                 className={cn(
                    "group transition-all hover:bg-blue-50/30",
                    policy.isActive && "bg-blue-50/10"
                 )}
              >
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {policy.policyName}
                    </span>
                    {policy.isActive && (
                        <span className="text-[10px] font-bold text-blue-500 uppercase mt-0.5 flex items-center gap-1">
                            <Clock size={10} /> Đang áp dụng
                        </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-sm font-semibold text-slate-700">
                    {formatDate(policy.effectiveFrom)}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span className="text-sm text-slate-500 font-medium">
                    {policy.effectiveTo ? formatDate(policy.effectiveTo) : "—"}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span className="text-sm font-medium text-slate-600 truncate max-w-[200px] block" title={policy.legalReference}>
                    {policy.legalReference || "—"}
                  </span>
                </td>
                <td className="px-6 py-5">
                  {policy.isActive ? (
                    <StatusBadge status="Active" label="HIỆU LỰC" />
                  ) : (
                    <StatusBadge status="Cancelled" label="Đã kết thúc" />
                  )}
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-center">
                    {/* RULE-09: Immutable - No Edit/Delete allowed. ONLY View is permitted. Hiding for active row as it is displayed in Current Policy Card. */}
                    {!policy.isActive && (
                      <button
                        onClick={() => setSelectedPolicy(policy)}
                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-600 hover:text-white hover:rotate-12 active:scale-95 transition-all flex items-center justify-center shadow-sm"
                        title="Xem chi tiết bậc giá"
                      >
                        <Eye size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {policies.length === 0 && (
          <div className="py-12 text-center">
             <p className="text-slate-400 font-medium italic">Chưa có lịch sử chính sách</p>
          </div>
        )}
      </div>

      {/* View Tier Modal (Read-only) */}
      <Modal
        isOpen={!!selectedPolicy}
        onClose={() => setSelectedPolicy(null)}
        title={`${selectedPolicy?.policyName} — BẬC GIÁ (CHỈ XEM)`}
        className="max-w-4xl"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-200/50">
             <ShieldCheck className="text-amber-600 shrink-0 mt-1" size={20} />
             <div className="space-y-1">
                <p className="text-sm font-black text-amber-900 uppercase tracking-wider">Chế độ xem lịch sử (Immutable)</p>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    Theo RULE-09, dữ liệu chính sách này là bất biến và không thể chỉnh sửa. 
                    Mọi thay đổi về giá phải được thực hiện thông qua việc tạo chính sách mới.
                </p>
             </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[13px] font-black uppercase text-slate-800 flex items-center gap-2">
                <ExternalLink size={14} className="text-blue-500" />
                Chi tiết các bậc thang giá
            </h4>
            
            <TierTableInput
                value={selectedPolicy?.tiers || []}
                onChange={() => {}} // No-op as it's disabled
                vatRate={selectedPolicy?.vatRate || 0}
                unit={type === "electricity" ? "kWh" : "m3"}
                disabled={true}
            />
          </div>

          <div className="flex justify-end pt-6">
            <button
              onClick={() => setSelectedPolicy(null)}
              className="px-8 h-12 bg-slate-900 rounded-xl font-black text-white hover:bg-slate-800 active:scale-95 transition-all shadow-lg uppercase tracking-widest text-[11px]"
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PolicyHistoryTable;
