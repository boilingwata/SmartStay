import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { contractService } from '@/services/contractService';
import { tenantService } from '@/services/tenantService';
import type { ContractDetail } from '@/models/Contract';
import type { TenantSummary } from '@/models/Tenant';

interface AddOccupantModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractDetail;
}

export const AddOccupantModal = ({ isOpen, onClose, contract }: AddOccupantModalProps) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().split('T')[0]);
  const [relationship, setRelationship] = useState('');
  const [note, setNote] = useState('');

  const { data: tenants = [] } = useQuery<TenantSummary[]>({
    queryKey: ['tenants-all'],
    queryFn: () => tenantService.getTenants(),
    enabled: isOpen,
  });

  const filteredTenants = useMemo(() => {
    const existingIds = new Set(contract.occupants.map((item) => item.tenantId));
    const q = search.trim().toLowerCase();
    return tenants.filter((tenant) => {
      if (existingIds.has(tenant.id)) return false;
      if (!q) return true;
      return (
        tenant.fullName.toLowerCase().includes(q) ||
        tenant.phone.includes(q) ||
        tenant.cccd.toLowerCase().includes(q)
      );
    });
  }, [contract.occupants, search, tenants]);

  const addMutation = useMutation({
    mutationFn: () =>
      contractService.addOccupant({
        contractId: contract.id,
        tenantId,
        moveInDate,
        relationshipToPrimary: relationship || undefined,
        note: note || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contract', contract.id] });
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Đã thêm occupant vào hợp đồng');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể thêm occupant');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
              <UserPlus size={20} className="text-primary" />
              Thêm occupant
            </h2>
            <p className="mt-1 text-sm text-slate-500">{contract.contractCode}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-base w-full" placeholder="Tìm tenant theo tên, SĐT, CCCD" />
          <div className="max-h-60 space-y-2 overflow-auto">
            {filteredTenants.map((tenant) => (
              <button
                key={tenant.id}
                type="button"
                onClick={() => setTenantId(tenant.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left ${tenantId === tenant.id ? 'border-primary bg-primary/5' : 'border-slate-100'}`}
              >
                <p className="font-black text-slate-900">{tenant.fullName}</p>
                <p className="text-sm text-slate-500">{tenant.phone} • {tenant.cccd}</p>
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Ngày vào ở</label>
              <input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} className="input-base w-full" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Quan hệ với tenant chính</label>
              <input value={relationship} onChange={(e) => setRelationship(e.target.value)} className="input-base w-full" placeholder="Bạn cùng phòng, người thân..." />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Ghi chú</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} className="input-base min-h-[90px] w-full" placeholder="Ghi chú vận hành nếu có" />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-5">
          <button onClick={onClose} className="btn-outline">Hủy</button>
          <button onClick={() => addMutation.mutate()} className="btn-primary" disabled={addMutation.isPending || !tenantId}>
            {addMutation.isPending ? 'Đang thêm...' : 'Thêm occupant'}
          </button>
        </div>
      </div>
    </div>
  );
};
