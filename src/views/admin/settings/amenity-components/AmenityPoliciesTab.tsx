import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, Search, FilterX, Box } from 'lucide-react';
import { toast } from 'sonner';
import amenityAdminService, { type AmenityPolicyStatus, type AmenityPolicyRecord } from '@/services/amenityAdminService';
import { Select } from '@/components/ui/Select';
import { formatVND } from '@/utils';
import { statusClass, statusLabel } from './utils';
import AmenityPolicyCreateSheet from './AmenityPolicyCreateSheet';
import AmenityPolicyEditSheet from './AmenityPolicyEditSheet';

interface Props {
  selectedPolicyId: number | null;
  setSelectedPolicyId: (id: number | null) => void;
  setSelectedPolicy: (policy: AmenityPolicyRecord | null) => void;
}

export default function AmenityPoliciesTab({ selectedPolicyId, setSelectedPolicyId, setSelectedPolicy }: Props) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ search: '', status: 'all' as AmenityPolicyStatus | 'all', serviceId: null as number | null, page: 1, limit: 12 });
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<AmenityPolicyRecord | null>(null);

  const optionsQuery = useQuery({ queryKey: ['amenity-options'], queryFn: () => amenityAdminService.getFormOptions() });
  const policiesQuery = useQuery({ queryKey: ['amenity-policies', filters], queryFn: () => amenityAdminService.listPolicies(filters) });

  useEffect(() => {
    if (!selectedPolicyId && policiesQuery.data?.data?.[0]) {
      const first = policiesQuery.data.data[0];
      setSelectedPolicyId(first.id);
      setSelectedPolicy(first);
    }
  }, [policiesQuery.data, selectedPolicyId, setSelectedPolicyId, setSelectedPolicy]);

  const archivePolicyMutation = useMutation({
    mutationFn: (id: number) => amenityAdminService.archivePolicy(id),
    onSuccess: () => {
      toast.success('Đã lưu trữ chính sách tiện ích.');
      queryClient.invalidateQueries({ queryKey: ['amenity-policies'] });
      queryClient.invalidateQueries({ queryKey: ['amenity-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['amenity-policy-versions'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể lưu trữ chính sách.'),
  });

  const startEdit = (policy: AmenityPolicyRecord) => {
    setEditingPolicy(policy);
    setSelectedPolicyId(policy.id);
    setSelectedPolicy(policy);
    setIsEditOpen(true);
  };

  const policyPageCount = Math.max(1, Math.ceil((policiesQuery.data?.total ?? 0) / filters.limit));

  return (
    <section className="min-w-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-card border border-border p-4 shadow-sm">
          <div className="flex flex-1 items-center gap-3 flex-wrap">
            <div className="relative max-w-sm flex-1 min-w-[200px]">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                <Search size={16} />
              </div>
              <input 
                className="input-base w-full pl-10" 
                placeholder="Tìm mã hoặc tên..." 
                value={filters.search} 
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))} 
              />
            </div>
            
            <Select 
              value={filters.status}
              onChange={(val) => setFilters((current) => ({ ...current, status: val as AmenityPolicyStatus | 'all', page: 1 }))}
              options={[
                { label: 'Tất cả trạng thái', value: 'all' },
                { label: 'Nháp', value: 'draft' },
                { label: 'Chờ duyệt', value: 'pending_approval' },
                { label: 'Đã duyệt', value: 'approved' },
                { label: 'Lưu trữ', value: 'archived' }
              ]}
              className="w-[180px]"
            />

            <Select 
              value={filters.serviceId ? String(filters.serviceId) : ''}
              onChange={(val) => setFilters((current) => ({ ...current, serviceId: val ? Number(val) : null, page: 1 }))}
              options={[
                { label: 'Tất cả tiện ích', value: '' },
                ...(optionsQuery.data?.amenities.map(item => ({ label: item.label, value: String(item.value) })) ?? [])
              ]}
              className="w-[180px]"
            />
          </div>

          <button 
            onClick={() => setIsCreateOpen(true)} 
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:bg-primary/90 active:scale-[0.98]"
          >
            <Plus size={16} /> Tạo chính sách
          </button>
        </div>

        {/* List Content */}
        <div className="space-y-6">
          {policiesQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[200px] rounded-2xl border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : null}
          
          {policiesQuery.isError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center text-sm font-semibold text-destructive">
              Không tải được danh sách chính sách. Vui lòng thử lại.
            </div>
          ) : null}
          
          {!policiesQuery.isLoading && !policiesQuery.isError && policiesQuery.data?.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-16 text-center">
              <div className="rounded-full bg-muted p-4 text-muted-foreground mb-4">
                <Box size={32} />
              </div>
              <p className="text-lg font-bold text-foreground">Chưa có chính sách tiện ích</p>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                Bạn chưa có chính sách tiện ích nào hoặc không có kết quả phù hợp với bộ lọc hiện tại.
              </p>
              <button onClick={() => setFilters(current => ({ ...current, search: '', status: 'all', serviceId: null, page: 1 }))} className="mt-6 text-sm font-bold text-primary flex items-center gap-2 hover:underline">
                <FilterX size={16} /> Xóa bộ lọc
              </button>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {policiesQuery.data?.data.map((policy) => (
              <article 
                key={policy.id} 
                className={`group relative flex flex-col justify-between cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedPolicyId === policy.id ? 'border-primary/50 bg-primary/[0.02] shadow-sm' : 'border-border bg-card'}`} 
                onClick={() => { setSelectedPolicyId(policy.id); setSelectedPolicy(policy); }}
              >
                <div className="p-5 flex-1 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] ${statusClass(policy.status)}`}>
                      {statusLabel(policy.status)}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{policy.code}</span>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold leading-tight tracking-tight text-foreground line-clamp-2" title={policy.name}>{policy.name}</h3>
                    <p className="mt-1 text-xs font-medium text-muted-foreground line-clamp-1">{policy.amenityName}{policy.buildingName ? ` · ${policy.buildingName}` : ' · Toàn hệ thống'}</p>
                  </div>

                  <div className="space-y-2 rounded-xl bg-muted/50 p-3 text-xs font-medium text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Thời lượng</span>
                      <span className="text-foreground font-bold">{policy.slotGranularityMinutes} phút</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sức chứa</span>
                      <span className="text-foreground font-bold">{policy.maxCapacityPerSlot} lượt/khung</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hạn huỷ</span>
                      <span className="text-foreground font-bold">Trước {policy.cancellationCutoffHours}h</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {policy.requiresCheckin && <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-500/20">Check-in</span>}
                    {policy.requiresStaffApproval && <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-600 border border-purple-500/20">Duyệt tay</span>}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${policy.chargeMode === 'free' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                      {policy.chargeMode === 'free' ? 'Miễn phí' : policy.priceOverrideAmount ? formatVND(policy.priceOverrideAmount) : 'Thu phí'}
                    </span>
                  </div>
                </div>

                <div className="flex border-t border-border bg-muted/20">
                  <button 
                    onClick={(e) => { e.stopPropagation(); startEdit(policy); }} 
                    className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-foreground transition-colors hover:bg-muted hover:text-primary"
                  >
                    <Pencil size={14} /> Sửa
                  </button>
                  <div className="w-[1px] bg-border" />
                  <button 
                    onClick={(e) => { e.stopPropagation(); archivePolicyMutation.mutate(policy.id); }} 
                    className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 size={14} /> Lưu trữ
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {policyPageCount > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-6 text-sm font-bold text-muted-foreground">
              <span>Trang {filters.page} / {policyPageCount}</span>
              <div className="flex gap-2">
                <button disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))} className="rounded-xl border border-border px-4 py-2 hover:bg-muted disabled:opacity-40 transition-colors">Trước</button>
                <button disabled={filters.page >= policyPageCount} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))} className="rounded-xl border border-border px-4 py-2 hover:bg-muted disabled:opacity-40 transition-colors">Sau</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sheets */}
      <AmenityPolicyCreateSheet 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        optionsQuery={optionsQuery} 
      />
      
      <AmenityPolicyEditSheet 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        policy={editingPolicy} 
        optionsQuery={optionsQuery} 
      />
    </section>
  );
}
