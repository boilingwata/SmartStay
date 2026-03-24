import React from "react";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { CurrencyInput } from "./CurrencyInput";
import { cn } from "@/utils";

// RULE-09: ElectricityPolicies and WaterPolicies are IMMUTABLE.
// This component displays tiered pricing but strictly follows read-only rules when disabled.

export interface TierRow {
  fromKwh?: number;
  toKwh?: number | null;
  fromM3?: number;
  toM3?: number | null;
  unitPrice: number;
  unitPriceWithVat: number;
  note?: string;
}

interface TierTableInputProps {
  value: TierRow[];
  onChange: (tiers: TierRow[]) => void;
  vatRate: number; // 0-100
  unit?: "kWh" | "m3";
  error?: string;
  disabled?: boolean;
}

export const TierTableInput: React.FC<TierTableInputProps> = ({
  value,
  onChange,
  vatRate,
  unit = "kWh",
  error,
  disabled = false,
}) => {
  // Recalculate VAT when vatRate changes
  React.useEffect(() => {
    const updated = value.map(tier => ({
        ...tier,
        unitPriceWithVat: tier.unitPrice * (1 + vatRate / 100)
    }));
    // Only trigger onChange if values actually changed to prevent infinite loops
    const hasChanged = updated.some((t, i) => t.unitPriceWithVat !== value[i].unitPriceWithVat);
    if (hasChanged) {
        onChange(updated);
    }
  }, [vatRate]);
  const handleAddTier = () => {
    const newTiers = [...value];
    const lastTier = newTiers[newTiers.length - 1];

    if (lastTier) {
        const fromVal = unit === "kWh" ? (lastTier.fromKwh || 0) : (lastTier.fromM3 || 0);
        const prevToValue = fromVal + 50; 
        
        if (unit === "kWh") {
            lastTier.toKwh = prevToValue;
            newTiers.push({
                fromKwh: prevToValue + 1,
                toKwh: null,
                unitPrice: 0,
                unitPriceWithVat: 0,
                note: "",
            });
        } else {
            lastTier.toM3 = prevToValue;
            newTiers.push({
                fromM3: prevToValue + 1,
                toM3: null,
                unitPrice: 0,
                unitPriceWithVat: 0,
                note: "",
            });
        }
    } else {
        // First tier
        if (unit === "kWh") {
            newTiers.push({
                fromKwh: 0,
                toKwh: null,
                unitPrice: 0,
                unitPriceWithVat: 0,
                note: "",
            });
        } else {
            newTiers.push({
                fromM3: 0,
                toM3: null,
                unitPrice: 0,
                unitPriceWithVat: 0,
                note: "",
            });
        }
    }
    onChange(newTiers);
  };

  const handleRemoveTier = (index: number) => {
    if (index !== value.length - 1) return; // Only allow removing last tier
    const newTiers = [...value].slice(0, -1);
    if (newTiers.length > 0) {
      if (unit === "kWh") {
        newTiers[newTiers.length - 1].toKwh = null;
      } else {
        newTiers[newTiers.length - 1].toM3 = null;
      }
    }
    onChange(newTiers);
  };

  const handleUpdateTier = (index: number, updates: Partial<TierRow>) => {
    const newTiers = value.map((tier, i) => {
      if (i === index) {
        const updated = { ...tier, ...updates };
        if (updates.unitPrice !== undefined) {
          updated.unitPriceWithVat = updated.unitPrice * (1 + vatRate / 100);
        }
        return updated;
      }
      return tier;
    });

    // If to value changed and it is not the last tier, update the next tier's from value
    if (index < newTiers.length - 1) {
       if (unit === "kWh" && updates.toKwh !== undefined) {
          newTiers[index + 1].fromKwh = (updates.toKwh ?? 0) + 1;
       } else if (unit === "m3" && updates.toM3 !== undefined) {
          newTiers[index + 1].fromM3 = (updates.toM3 ?? 0) + 1;
       }
    }

    onChange(newTiers);
  };

  // Validation check for continuity
  const getContinuityError = (index: number) => {
    if (index === 0) return null;
    const prevTier = value[index - 1];
    const currTier = value[index];
    
    if (unit === "kWh") {
        if (prevTier.toKwh === null || prevTier.toKwh === undefined || prevTier.toKwh + 1 !== currTier.fromKwh) {
            return `Bậc ${index + 1}: Khoảng không liên tục với bậc trước`;
        }
    } else {
        if (prevTier.toM3 === null || prevTier.toM3 === undefined || prevTier.toM3 + 1 !== currTier.fromM3) {
            return `Bậc ${index + 1}: Khoảng không liên tục với bậc trước`;
        }
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-medium uppercase text-xs">
            <tr>
              <th className="px-4 py-3 w-16">Bậc</th>
              <th className="px-4 py-3">Từ ({unit})</th>
              <th className="px-4 py-3">Đến ({unit})</th>
              <th className="px-4 py-3">Đơn giá (VND)</th>
              <th className="px-4 py-3">Có VAT</th>
              <th className="px-4 py-3">Ghi chú</th>
              <th className="px-4 py-3 w-12 text-center">Xóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {value.map((tier, index) => {
              const continuityError = getContinuityError(index);
              const isLast = index === value.length - 1;

              return (
                <tr key={index} className={cn("hover:bg-slate-50/50 transition-colors", continuityError && "bg-red-50")}>
                  <td className="px-4 py-3 font-medium text-slate-500">{index + 1}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={unit === "kWh" ? tier.fromKwh : tier.fromM3}
                      readOnly
                      disabled={disabled}
                      className="w-full bg-slate-100 border-none rounded px-2 py-1 text-slate-500 cursor-not-allowed outline-none"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={unit === "kWh" ? (tier.toKwh === null ? "" : tier.toKwh) : (tier.toM3 === null ? "" : tier.toM3)}
                      onChange={(e) => {
                        const val = e.target.value === "" ? null : Number(e.target.value);
                        handleUpdateTier(index, unit === "kWh" ? { toKwh: val } : { toM3: val });
                      }}
                      placeholder={isLast ? "∞" : "Nhập..."}
                      disabled={disabled || isLast} 
                      className={cn(
                        "w-full bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                        isLast && "bg-slate-50 text-slate-400 cursor-not-allowed border-dashed"
                      )}
                    />
                  </td>
                  <td className="px-4 py-3 min-w-[140px]">
                    <CurrencyInput
                      value={tier.unitPrice}
                      onValueChange={(val: number) => handleUpdateTier(index, { unitPrice: val })}
                      disabled={disabled}
                      className="border-slate-200"
                    />
                  </td>
                  <td className="px-4 py-3 min-w-[140px]">
                    <input
                      type="text"
                      value={new Intl.NumberFormat("vi-VN").format(tier.unitPriceWithVat)}
                      readOnly
                      disabled={disabled}
                      className="w-full bg-slate-100 border-none rounded px-2 py-1 text-slate-500 cursor-not-allowed outline-none font-medium"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={tier.note || ""}
                      onChange={(e) => handleUpdateTier(index, { note: e.target.value })}
                      placeholder="Ghi chú..."
                      disabled={disabled}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(index)}
                      disabled={disabled || !isLast || value.length === 1}
                      className={cn(
                        "p-2 rounded-full transition-colors",
                        isLast && value.length > 1
                          ? "text-red-500 hover:bg-red-50 active:bg-red-100"
                          : "text-slate-300 cursor-not-allowed"
                      )}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleAddTier}
          disabled={disabled}
          className="flex items-center justify-center gap-2 w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all font-medium group"
        >
          <Plus size={18} className="group-hover:scale-110 transition-transform" />
          Thêm bậc giá mới
        </button>

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm mt-1 animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {value.map((_, i) => {
            const err = getContinuityError(i);
            if (!err) return null;
            return (
                <div key={i} className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle size={14} />
                    <span>{err}</span>
                </div>
            )
        })}
      </div>
    </div>
  );
};

export default TierTableInput;
