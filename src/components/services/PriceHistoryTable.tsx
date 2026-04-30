// RULE-08: lịch sử giá chỉ được thêm bản ghi mới, không sửa hoặc xóa trực tiếp.

import React, { useState } from "react";
import { Eye, Plus, Shield, User, Calendar, MessageSquare } from "lucide-react";
import { Modal, StatusBadge } from "@/components/shared";
import { ServicePriceHistory } from "@/types/service";
import { formatDate, cn } from "@/utils";
import { formatVND } from "@/utils/serviceHelpers";

// Thành phần này chỉ cung cấp chức năng xem cho các giá đã hết hạn.

interface PriceHistoryTableProps {
  priceHistory: ServicePriceHistory[];
  isLoading: boolean;
  onUpdatePrice: () => void;
}

const PriceHistoryTable: React.FC<PriceHistoryTableProps> = ({
  priceHistory,
  isLoading,
  onUpdatePrice,
}) => {
  const [selectedHistory, setSelectedHistory] = useState<ServicePriceHistory | null>(null);

  // Skeleton Loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
            <div className="h-6 w-32 bg-slate-100 animate-pulse rounded-full" />
            <div className="h-10 w-44 bg-slate-100 animate-pulse rounded-xl" />
        </div>
        <div className="overflow-hidden rounded-[24px] border border-slate-100 bg-white">
           {[1, 2, 3].map((i) => (
             <div key={i} className="px-6 py-8 border-b border-slate-50 flex justify-between animate-pulse">
                <div className="h-4 w-24 bg-slate-50 rounded" />
                <div className="h-4 w-32 bg-slate-50 rounded" />
                <div className="h-4 w-32 bg-slate-50 rounded" />
                <div className="h-4 w-20 bg-slate-50 rounded" />
                <div className="h-4 w-12 bg-slate-50 rounded" />
             </div>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Action Header */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-[11px] font-black uppercase tracking-[2px] text-slate-800 flex items-center gap-2">
            Lịch sử giá
            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[9px] font-bold">
                {priceHistory.length} bản ghi
            </span>
        </h3>
        <button
          onClick={onUpdatePrice}
          className="flex items-center gap-2 px-6 h-11 bg-primary text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-primary/90 hover:translate-y-[-2px] active:translate-y-[0] transition-all shadow-xl shadow-primary/20"
        >
          <Plus size={16} />
          Cập nhật giá mới
        </button>
      </div>

      <div className="overflow-x-auto rounded-[32px] border border-slate-100 bg-white shadow-2xl shadow-slate-200/40 custom-scrollbar">
        <table className="w-full min-w-[1040px] border-collapse text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[2px] text-slate-400">Giá (VND)</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[2px] text-slate-400">Hiệu lực từ</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[2px] text-slate-400">Hiệu lực đến</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[2px] text-slate-400">Thiết lập bởi</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[2px] text-slate-400">Lý do</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[2px] text-slate-400">Trạng thái</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[2px] text-slate-400 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {priceHistory.map((history) => (
              <tr 
                key={history.priceHistoryId} 
                className={cn(
                    "group transition-all hover:bg-slate-50/50",
                    history.isActive && "bg-blue-50/10"
                )}
              >
                <td className="px-8 py-6">
                  <span className={cn(
                    "text-sm tracking-tight",
                    history.isActive ? "font-black text-blue-600" : "font-bold text-slate-600"
                  )}>
                    {formatVND(history.price)}
                  </span>
                </td>
                <td className="px-8 py-6 text-sm font-semibold text-slate-700">
                    {formatDate(history.effectiveFrom)}
                </td>
                <td className="px-8 py-6 text-sm font-medium text-slate-500">
                    {history.effectiveTo ? formatDate(history.effectiveTo) : "—"}
                </td>
                <td className="px-8 py-6 text-sm font-medium text-slate-600">
                    {history.setByName}
                </td>
                <td className="px-8 py-6">
                  <div 
                    className="text-xs text-slate-500 font-medium truncate max-w-[150px] cursor-help"
                    title={history.reason}
                  >
                    {history.reason}
                  </div>
                </td>
                <td className="px-8 py-6">
                  {history.isActive ? (
                    <StatusBadge status="Active" label="HIỆU LỰC" />
                  ) : (
                    <StatusBadge status="Cancelled" label="Đã hết hạn" />
                  )}
                </td>
                <td className="px-8 py-6">
                  <div className="flex justify-center">
                    {/* RULE-08: Chỉ xem bản ghi cũ, bản ghi đang hiệu lực không có thao tác. */}
                    {!history.isActive && (
                      <button
                        onClick={() => setSelectedHistory(history)}
                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 hover:bg-primary hover:text-white hover:rotate-12 active:scale-95 transition-all flex items-center justify-center shadow-sm"
                        title="Xem chi tiết"
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

        {priceHistory.length === 0 && (
          <div className="py-20 text-center">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="text-slate-200" size={40} />
             </div>
             <p className="text-slate-400 font-black tracking-widest uppercase text-[10px] italic">Chưa có lịch sử giá</p>
          </div>
        )}
      </div>

      {/* View Price Modal (Read-only) */}
      <Modal
        isOpen={!!selectedHistory}
        onClose={() => setSelectedHistory(null)}
        title={`Chi tiết giá (chỉ xem) — ${selectedHistory ? formatDate(selectedHistory.effectiveFrom) : ""} đến ${selectedHistory?.effectiveTo ? formatDate(selectedHistory.effectiveTo) : "nay"}`}
        className="max-w-md"
      >
        <div className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 flex flex-col items-center gap-1 shadow-inner">
                <span className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">Đơn giá áp dụng</span>
                <span className="text-4xl font-black text-primary tracking-tighter">
                    {selectedHistory ? formatVND(selectedHistory.price) : ""}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-300" /> Từ ngày
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                        {selectedHistory ? formatDate(selectedHistory.effectiveFrom) : ""}
                    </p>
                </div>
                <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-300" /> Đến ngày
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                        {selectedHistory?.effectiveTo ? formatDate(selectedHistory.effectiveTo) : "—"}
                    </p>
                </div>
                <div className="col-span-2 space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <User size={12} className="text-slate-300" /> Thiết lập bởi
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                        {selectedHistory?.setByName}
                    </p>
                </div>
                <div className="col-span-2 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <MessageSquare size={12} className="text-slate-300" /> Lý do thay đổi
                    </p>
                    <div className="text-[13px] font-medium text-slate-600 leading-relaxed bg-slate-50/50 p-5 rounded-2xl border border-dashed border-slate-200">
                        {selectedHistory?.reason}
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                  onClick={() => setSelectedHistory(null)}
                  className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[3px] hover:bg-slate-800 active:scale-95 transition-all shadow-xl shadow-slate-200"
                >
                  Đóng cửa sổ
                </button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default PriceHistoryTable;
