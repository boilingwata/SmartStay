import React, { memo } from 'react';
import { Pencil, Trash2, Clock, Users, Ban, Sparkles } from 'lucide-react';
import { type AmenityPolicyRecord } from '@/services/amenityAdminService';
import { formatVND } from '@/utils';
import { statusClass, statusLabel } from './utils';

interface Props {
  policy: AmenityPolicyRecord;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (policy: AmenityPolicyRecord) => void;
  onArchive: (id: number) => void;
  index: number;
}

const AmenityPolicyCard = memo(({ policy, isSelected, onSelect, onEdit, onArchive, index }: Props) => {
  return (
    <article 
      className={`group relative flex flex-col justify-between cursor-pointer overflow-hidden rounded-[2rem] border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl animate-in fade-in slide-in-from-bottom-8 fill-mode-both ${
        isSelected 
          ? 'border-primary/50 bg-primary/[0.03] shadow-lg shadow-primary/5' 
          : 'border-border/60 bg-card hover:border-primary/30'
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={onSelect}
    >
      <div className="p-6 flex-1 space-y-6">
        {/* Header: Status & Code */}
        <div className="flex items-center justify-between gap-4">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${statusClass(policy.status)}`}>
            <div className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            {statusLabel(policy.status)}
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">{policy.code}</span>
        </div>
        
        {/* Body: Title & Meta */}
        <div className="space-y-2">
          <h3 className="text-xl font-black leading-[1.2] tracking-tight text-foreground line-clamp-2 transition-colors group-hover:text-primary">
            {policy.name}
          </h3>
          <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/80">
            <Sparkles size={12} className="text-primary/60" />
            <span>{policy.amenityName}</span>
            <span className="opacity-30">|</span>
            <span>{policy.buildingName ?? 'Toàn hệ thống'}</span>
          </div>
        </div>

        {/* Specs: Utilitarian Grid */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] p-4 border border-border/40">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <Clock size={14} className="text-muted-foreground" />
            <span className="text-[11px] font-black leading-none">{policy.slotGranularityMinutes}m</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center border-x border-border/50">
            <Users size={14} className="text-muted-foreground" />
            <span className="text-[11px] font-black leading-none">{policy.maxCapacityPerSlot}</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <Ban size={14} className="text-muted-foreground" />
            <span className="text-[11px] font-black leading-none">{policy.cancellationCutoffHours}h</span>
          </div>
        </div>

        {/* Feature Tags */}
        <div className="flex flex-wrap gap-1.5">
          {policy.requiresCheckin && (
            <span className="rounded-lg bg-blue-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-blue-600 border border-blue-500/20">
              Check-in
            </span>
          )}
          {policy.requiresStaffApproval && (
            <span className="rounded-lg bg-purple-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-purple-600 border border-purple-500/20">
              Approval
            </span>
          )}
          <span className={`ml-auto rounded-lg px-2 py-1 text-[10px] font-black border ${
            policy.chargeMode === 'free' 
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-sm'
          }`}>
            {policy.chargeMode === 'free' ? 'MIỄN PHÍ' : policy.priceOverrideAmount ? formatVND(policy.priceOverrideAmount) : 'THU PHÍ'}
          </span>
        </div>
      </div>

      {/* Footer Actions: Industrial Console Style */}
      <div className="flex border-t border-border/60 bg-muted/20 opacity-60 transition-all duration-300 group-hover:bg-muted/40 group-hover:opacity-100">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(policy); }} 
          className="flex flex-1 items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground transition-all hover:bg-card hover:text-primary active:scale-95"
        >
          <Pencil size={14} strokeWidth={2.5} /> Sửa
        </button>
        <div className="w-[1px] bg-border/60" />
        <button 
          onClick={(e) => { e.stopPropagation(); onArchive(policy.id); }} 
          className="flex flex-1 items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive active:scale-95"
        >
          <Trash2 size={14} strokeWidth={2.5} /> Lưu trữ
        </button>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-0 right-0 h-16 w-16 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 h-full w-full translate-x-1/2 -translate-y-1/2 rotate-45 bg-primary shadow-lg" />
        </div>
      )}
    </article>
  );
});

AmenityPolicyCard.displayName = 'AmenityPolicyCard';

export default AmenityPolicyCard;
