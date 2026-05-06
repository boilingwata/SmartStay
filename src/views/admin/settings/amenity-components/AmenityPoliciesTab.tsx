import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FilterX, Box } from 'lucide-react';
import { toast } from 'sonner';
import amenityAdminService, { type AmenityPolicyStatus, type AmenityPolicyRecord } from '@/services/amenityAdminService';
import AmenityPolicyCreateSheet from './AmenityPolicyCreateSheet';
import AmenityPolicyEditSheet from './AmenityPolicyEditSheet';
import AmenityToolbar from './AmenityToolbar';
import AmenityPolicyCard from './AmenityPolicyCard';

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

  const optionsQuery = useQuery({ 
    queryKey: ['amenity-options'], 
    queryFn: () => amenityAdminService.getFormOptions() 
  });
  
  const policiesQuery = useQuery({ 
    queryKey: ['amenity-policies', filters], 
    queryFn: () => amenityAdminService.listPolicies(filters) 
  });

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
    <section className="space-y-8 min-w-0">
      <AmenityToolbar 
        filters={filters}
        setFilters={setFilters}
        options={optionsQuery.data?.amenities.map(item => ({ label: item.label, value: String(item.value) }))}
        onCreateOpen={() => setIsCreateOpen(true)}
      />

      <div className="space-y-8">
        {policiesQuery.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 rounded-[2rem] bg-card border border-border/50 animate-pulse" />
            ))}
          </div>
        ) : null}
        
        {policiesQuery.isError ? (
          <div className="rounded-[2rem] border border-destructive/20 bg-destructive/5 p-12 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-destructive">System Error</p>
            <p className="mt-2 text-muted-foreground font-bold">Không tải được danh sách chính sách. Vui lòng thử lại.</p>
          </div>
        ) : null}
        
        {!policiesQuery.isLoading && !policiesQuery.isError && policiesQuery.data?.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-border bg-muted/10 py-24 text-center">
            <div className="rounded-full bg-muted p-6 text-muted-foreground mb-6 shadow-inner">
              <Box size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-foreground">Không tìm thấy chính sách</h3>
            <p className="mt-2 text-sm font-medium text-muted-foreground max-w-sm mx-auto px-6">
              Bạn chưa có chính sách tiện ích nào hoặc không có kết quả phù hợp với bộ lọc hiện tại.
            </p>
            <button 
              onClick={() => setFilters(current => ({ ...current, search: '', status: 'all', serviceId: null, page: 1 }))} 
              className="mt-8 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary hover:underline underline-offset-8"
            >
              <FilterX size={14} /> Xóa bộ lọc
            </button>
          </div>
        ) : null}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {policiesQuery.data?.data.map((policy, index) => (
            <AmenityPolicyCard 
              key={policy.id}
              policy={policy}
              index={index}
              isSelected={selectedPolicyId === policy.id}
              onSelect={() => { setSelectedPolicyId(policy.id); setSelectedPolicy(policy); }}
              onEdit={startEdit}
              onArchive={(id) => archivePolicyMutation.mutate(id)}
            />
          ))}
        </div>

        {/* Pagination: Refined Industrial Style */}
        {policyPageCount > 1 && (
          <div className="flex items-center justify-between border-t border-border/60 pt-8">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">
              Page <span className="text-foreground">{filters.page}</span> of {policyPageCount}
            </div>
            <div className="flex gap-3">
              <button 
                disabled={filters.page <= 1} 
                onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))} 
                className="h-10 rounded-xl border border-border/60 bg-card px-6 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-muted disabled:opacity-30 disabled:pointer-events-none active:scale-95 shadow-sm"
              >
                Trước
              </button>
              <button 
                disabled={filters.page >= policyPageCount} 
                onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))} 
                className="h-10 rounded-xl border border-border/60 bg-card px-6 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-muted disabled:opacity-30 disabled:pointer-events-none active:scale-95 shadow-sm"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sheets: Unchanged logic, but will benefit from visual isolation */}
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

