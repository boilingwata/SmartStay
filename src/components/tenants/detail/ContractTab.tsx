import React from 'react';
import { Calendar, FileText, History, Home, UserCheck, Wallet } from 'lucide-react';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { Contract } from '@/models/Contract';
import { formatDate, formatVND } from '@/utils';

interface ContractTabProps {
  contract?: Contract | null;
}

export const ContractTab: React.FC<ContractTabProps> = ({ contract }) => {
  if (!contract) {
    return (
      <div className="card-container space-y-4 border-2 border-dashed bg-white/40 p-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-bg text-muted">
          <History size={40} />
        </div>
        <h3 className="text-h3 font-black uppercase tracking-widest text-primary">Chua co hop dong</h3>
        <p className="mx-auto max-w-xs text-small italic text-muted">
          Tenant nay hien chua tham gia hop dong thue nao trong he thong.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="card-container relative overflow-hidden border-none bg-white/40 p-10 shadow-2xl shadow-primary/5">
        <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-[32px] border border-primary/10 bg-primary/5 text-primary shadow-inner">
              <FileText size={36} />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-3">
                <h2 className="text-h2 font-black uppercase tracking-tighter text-primary">{contract.contractCode}</h2>
                <StatusBadge status={contract.status} size="sm" />
              </div>
              <p className="flex items-center gap-2 text-small font-bold italic text-muted">
                <Home size={14} className="text-accent" />
                {contract.roomCode} - {contract.buildingName}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="card-container border-none bg-white/60 p-8 shadow-xl shadow-primary/5">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg text-muted">
              <Calendar size={20} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[2px] text-muted">Thoi han thue</p>
          </div>
          <p className="mb-1 text-body font-black uppercase tracking-tighter text-primary">
            {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
          </p>
          <p className="text-[10px] font-medium italic text-muted">Hop dong dang duoc hien thi theo du lieu that</p>
        </div>

        <div className="card-container border-none bg-white/60 p-8 shadow-xl shadow-primary/5">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg text-muted">
              <Wallet size={20} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[2px] text-muted">Gia thue snapshot</p>
          </div>
          <p className="mb-1 text-body font-black uppercase tracking-tighter text-success">
            {formatVND(contract.rentPriceSnapshot)}
          </p>
          <p className="text-[10px] font-medium italic text-muted">Chu ky thanh toan: {contract.paymentCycle} thang</p>
        </div>

        <div className="card-container border-none bg-white/60 p-8 shadow-xl shadow-primary/5">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg text-muted">
              <UserCheck size={20} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[2px] text-muted">Vai tro tren hop dong</p>
          </div>
          <p className="mb-1 text-body font-black uppercase tracking-tighter text-primary">
            {contract.isRepresentative ? 'Nguoi dai dien' : 'Dong cu dan'}
          </p>
          <p className="text-[10px] font-medium italic text-muted">Mapping tu `contract_tenants.is_primary`</p>
        </div>
      </div>
    </div>
  );
};
