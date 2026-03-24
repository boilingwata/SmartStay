import React, { useState, useMemo } from "react";
import { Info } from "lucide-react";
import { previewTierCalculation } from "../../services/policyService";
import { formatVND } from "../../utils";
import { ElectricityTier, WaterTier } from "../../types/policy";

interface PolicyPreviewProps {
  tiers: Array<ElectricityTier | WaterTier>;
  vatRate: number;
  unit?: "kWh" | "m3";
}

export const PolicyPreview: React.FC<PolicyPreviewProps> = ({
  tiers,
  vatRate,
  unit = "kWh",
}) => {
  const [usage, setUsage] = useState<number>(0);

  const result = useMemo(() => {
    if (usage <= 0) return null;
    return previewTierCalculation(usage, tiers as any, vatRate);
  }, [usage, tiers, vatRate]);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-6">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-700">
          Nhập số {unit} để tính thử
        </label>
        <div className="relative">
          <input
            type="number"
            min={0}
            max={9999}
            value={usage === 0 ? "" : usage}
            onChange={(e) => setUsage(Number(e.target.value))}
            placeholder={`Nhập số ${unit}...`}
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-lg"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
            {unit}
          </span>
        </div>
      </div>

      {result && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Info size={14} />
              Chi tiết tính toán
            </h4>
            
            <div className="space-y-2.5">
              {result.tierBreakdowns.map((item) => (
                <div key={item.tier} className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">
                    Bậc {item.tier}:{" "}
                    <span className="font-semibold text-slate-900">
                      {new Intl.NumberFormat("vi-VN").format(item.usage)} {unit}
                    </span>{" "}
                    × {new Intl.NumberFormat("vi-VN").format(item.unitPrice)} VND
                  </span>
                  <span className="font-medium text-slate-900">
                    {formatVND(item.amount)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Tạm tính:</span>
                <span className="font-semibold text-slate-700">
                  {formatVND(result.subtotal)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium whitespace-nowrap">
                  Thuế VAT ({vatRate}%):
                </span>
                <span className="font-semibold text-slate-700">
                  {formatVND(result.vat)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t-2 border-slate-300 border-double flex justify-between items-center">
              <span className="text-slate-900 font-bold">Tổng cộng:</span>
              <span className="text-xl font-black text-blue-600">
                {formatVND(result.total)}
              </span>
            </div>
          </div>
        </div>
      )}

      {!result && (
        <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
          <p className="text-slate-400 text-sm italic">
            Vui lòng nhập sản lượng để xem bảng tính thử
          </p>
        </div>
      )}
    </div>
  );
};

export default PolicyPreview;
