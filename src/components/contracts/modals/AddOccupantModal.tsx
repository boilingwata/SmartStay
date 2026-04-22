import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import type { ContractDetail } from '@/models/Contract';
import type { TenantSummary } from '@/models/Tenant';
import { contractService } from '@/services/contractService';
import { tenantService } from '@/services/tenantService';

interface AddOccupantModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractDetail;
}

export function AddOccupantModal({ isOpen, onClose, contract }: AddOccupantModalProps) {
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
    const query = search.trim().toLowerCase();

    return tenants.filter((tenant) => {
      if (existingIds.has(tenant.id)) return false;
      if (!query) return true;

      return (
        tenant.fullName.toLowerCase().includes(query) ||
        tenant.phone.includes(query) ||
        tenant.cccd.toLowerCase().includes(query)
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
      toast.success('Đã thêm người ở cùng vào hợp đồng.');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể thêm người ở cùng.');
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
              Thêm người ở cùng
            </h2>
            <p className="mt-1 text-sm text-slate-500">{contract.contractCode}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="input-base w-full"
            placeholder="Tìm theo tên, số điện thoại hoặc CCCD"
          />

          <div className="max-h-60 space-y-2 overflow-auto">
            {filteredTenants.map((tenant) => (
              <button
                key={tenant.id}
                type="button"
                onClick={() => setTenantId(tenant.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left ${tenantId === tenant.id ? 'border-primary bg-primary/5' : 'border-slate-100'}`}
              >
                <p className="font-black text-slate-900">{tenant.fullName}</p>
                <p className="text-sm text-slate-500">
                  {tenant.phone || 'Chưa có số điện thoại'} • {tenant.cccd || 'Chưa có CCCD'}
                </p>
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Ngày bắt đầu ở</label>
              <input type="date" value={moveInDate} onChange={(event) => setMoveInDate(event.target.value)} className="input-base w-full" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Quan hệ với người đứng tên</label>
              <input
                value={relationship}
                onChange={(event) => setRelationship(event.target.value)}
                className="input-base w-full"
                placeholder="Ví dụ: người thân, bạn cùng phòng"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Ghi chú nội bộ</label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="input-base min-h-[90px] w-full"
              placeholder="Thông tin thêm nếu cần"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-5">
          <button type="button" onClick={onClose} className="btn-outline">
            Hủy
          </button>
          <button type="button" onClick={() => addMutation.mutate()} className="btn-primary" disabled={addMutation.isPending || !tenantId}>
            {addMutation.isPending ? 'Đang lưu...' : 'Thêm vào hợp đồng'}
          </button>
        </div>
      </div>
    </div>
  );
}
