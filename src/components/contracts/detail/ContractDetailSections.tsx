import React from 'react';
import { ShieldCheck, Users } from 'lucide-react';
import type { ContractOccupant } from '@/models/Contract';
import { cn, formatDate } from '@/utils';

export function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = 'slate',
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
  tone?: 'slate' | 'sky' | 'emerald' | 'amber';
}) {
  const toneClasses = {
    slate: 'bg-slate-100 text-slate-900',
    sky: 'bg-sky-50 text-sky-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={cn('rounded-2xl p-3', toneClasses[tone])}>{Icon ? <Icon size={18} /> : null}</div>
      </div>
    </div>
  );
}

export function InfoItem({
  label,
  value,
  className,
  icon: Icon,
}: {
  label: string;
  value: string;
  className?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className={cn('rounded-[20px] border border-slate-200 bg-slate-50 p-4', className)}>
      <div className="flex items-center gap-2">
        {Icon ? <Icon size={14} className="text-slate-400" /> : null}
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      </div>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{value}</p>
    </div>
  );
}

export function OccupantCard({
  occupant,
  emphasis,
  onRemove,
  isRemoving,
}: {
  occupant: ContractOccupant;
  emphasis?: 'primary';
  onRemove?: () => void;
  isRemoving?: boolean;
}) {
  const title = occupant.isPrimaryTenant ? 'Người đứng tên hợp đồng' : 'Người ở cùng';

  return (
    <div
      className={cn(
        'flex flex-col gap-5 rounded-[24px] border p-5 shadow-sm transition sm:flex-row sm:items-center sm:justify-between',
        emphasis === 'primary' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white'
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
            emphasis === 'primary' ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'
          )}
        >
          <Users size={18} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn('truncate text-base font-bold', emphasis === 'primary' ? 'text-white' : 'text-slate-950')}>{occupant.fullName}</p>
            {occupant.isPrimaryTenant ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                  emphasis === 'primary' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-700'
                )}
              >
                <ShieldCheck size={12} />
                {title}
              </span>
            ) : null}
          </div>
          <p className={cn('mt-1 text-sm', emphasis === 'primary' ? 'text-slate-200' : 'text-slate-500')}>
            {occupant.phone || 'Chưa cập nhật số điện thoại'}
          </p>
          {occupant.relationshipToPrimary ? (
            <p className={cn('mt-1 text-xs', emphasis === 'primary' ? 'text-slate-300' : 'text-slate-500')}>
              Quan hệ: {occupant.relationshipToPrimary}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:items-end">
        <div className={cn('text-sm font-medium', emphasis === 'primary' ? 'text-slate-200' : 'text-slate-500')}>
          {formatDate(occupant.moveInAt)}
          {occupant.moveOutAt ? ` → ${formatDate(occupant.moveOutAt)}` : ' → Hiện tại'}
        </div>

        {occupant.status === 'active' ? (
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold',
                emphasis === 'primary' ? 'bg-white text-slate-900' : 'bg-emerald-50 text-emerald-700'
              )}
            >
              Đang cư trú
            </span>
            {onRemove ? (
              <button
                type="button"
                onClick={onRemove}
                disabled={isRemoving}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRemoving ? 'Đang cập nhật...' : 'Ghi nhận rời đi'}
              </button>
            ) : null}
          </div>
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Đã rời đi</span>
        )}
      </div>
    </div>
  );
}
