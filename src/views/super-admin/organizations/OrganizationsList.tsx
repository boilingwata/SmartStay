import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { OrganizationStatus } from '@/services/superAdmin/organizationsService';
import {
  archiveOrganization,
  changeOrganizationPlan,
  listOrganizations,
  reactivateOrganization,
  suspendOrganization,
} from '@/services/superAdmin/organizationsService';
import { listPlans } from '@/services/superAdmin/subscriptionPlansService';
import { formatVND } from '@/utils';

import { OrganizationCreateSheet } from './OrganizationCreateSheet';

const statusLabel: Record<string, string> = {
  active: 'Đang hoạt động',
  suspended: 'Tạm ngưng',
  archived: 'Đã lưu trữ',
};

function StatusBadge({ status }: { status: string }) {
  const tones: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    suspended: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
    archived: 'bg-muted text-muted-foreground',
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${tones[status] ?? tones.archived}`}
    >
      {statusLabel[status] ?? status}
    </span>
  );
}

export const OrganizationsList: React.FC = () => {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrganizationStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [planOrgId, setPlanOrgId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['super-admin', 'organizations', statusFilter, search],
    queryFn: () =>
      listOrganizations({
        status: statusFilter,
        search: search.trim() || undefined,
        includeArchived: statusFilter === 'archived' || search.trim().length > 0,
      }),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['super-admin', 'subscription-plans'],
    queryFn: () => listPlans(true),
  });

  const suspendMu = useMutation({
    mutationFn: suspendOrganization,
    onSuccess: () => {
      toast.success('Đã tạm ngưng tổ chức');
      qc.invalidateQueries({ queryKey: ['super-admin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reactivateMu = useMutation({
    mutationFn: reactivateOrganization,
    onSuccess: () => {
      toast.success('Đã kích hoạt lại');
      qc.invalidateQueries({ queryKey: ['super-admin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveMu = useMutation({
    mutationFn: archiveOrganization,
    onSuccess: () => {
      toast.success('Đã lưu trữ tổ chức');
      qc.invalidateQueries({ queryKey: ['super-admin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changePlanMu = useMutation({
    mutationFn: async ({ id, planId }: { id: string; planId: string }) => {
      await changeOrganizationPlan(id, planId);
    },
    onSuccess: () => {
      toast.success('Đã cập nhật gói dịch vụ');
      setPlanOrgId(null);
      qc.invalidateQueries({ queryKey: ['super-admin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = orgs.filter((o) => {
    if (!search.trim()) return true;
    const t = search.trim().toLowerCase();
    return (
      o.name.toLowerCase().includes(t) ||
      o.slug.toLowerCase().includes(t) ||
      (o.primary_owner as { full_name?: string } | null)?.full_name?.toLowerCase().includes(t)
    );
  });

  const activeOrgForPlan = planOrgId ? orgs.find((o) => o.id === planOrgId) : null;

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-border/70 bg-card p-6 shadow-[0_24px_72px_-48px_rgba(15,23,42,0.45)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-secondary">Quản trị</p>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Tổ chức</h1>
            <p className="max-w-xl text-sm leading-7 text-muted">
              Tạo không gian làm việc, gán gói dịch vụ và theo dõi trạng thái vận hành.
            </p>
          </div>
          <Button
            leftIcon={<Plus size={16} />}
            className="shrink-0"
            onClick={() => setCreateOpen(true)}
          >
            Tạo tổ chức
          </Button>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              className="pl-11"
              placeholder="Tìm theo tên, slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrganizationStatus | 'all')}
            className="h-12 rounded-2xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="suspended">Tạm ngưng</option>
            <option value="archived">Đã lưu trữ</option>
          </select>
        </div>
      </section>

      <div className="overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-[0_20px_60px_-42px_rgba(15,23,42,0.34)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border/70 bg-background/70">
              <tr>
                <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-muted">
                  Tổ chức
                </th>
                <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-muted">
                  Chủ sở hữu
                </th>
                <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-muted">
                  Gói
                </th>
                <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-muted">
                  Thành viên
                </th>
                <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-muted">
                  Trạng thái
                </th>
                <th className="px-5 py-4 text-right text-[11px] font-black uppercase tracking-[0.18em] text-muted">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted">
                    Đang tải...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted">
                    Không có tổ chức phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => {
                  const plan = o.plan as { name?: string; monthly_price?: number } | null | undefined;
                  const owner = o.primary_owner as { full_name?: string } | null | undefined;
                  return (
                    <tr key={o.id} className="border-b border-border/50 transition hover:bg-background/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Building2 size={18} />
                          </div>
                          <div>
                            <p className="font-black text-foreground">{o.name}</p>
                            <p className="text-xs text-muted">{o.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-foreground">{owner?.full_name ?? '—'}</td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-foreground">{plan?.name ?? '—'}</span>
                        <p className="text-xs text-muted">
                          {plan?.monthly_price != null ? `${formatVND(Number(plan.monthly_price))}/tháng` : ''}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-semibold tabular-nums text-foreground">
                        {o.member_count ?? 0}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link
                            to={`/super-admin/organizations/${o.id}`}
                            className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10"
                          >
                            Chi tiết
                            <ArrowRight size={14} />
                          </Link>
                          {o.status === 'active' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => suspendMu.mutate(o.id)}
                              disabled={suspendMu.isPending}
                            >
                              Tạm ngưng
                            </Button>
                          ) : null}
                          {o.status === 'suspended' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => reactivateMu.mutate(o.id)}
                              disabled={reactivateMu.isPending}
                            >
                              Kích hoạt
                            </Button>
                          ) : null}
                          {o.status !== 'archived' && !o.deleted_at ? (
                            <Button
                              variant="danger"
                              size="sm"
                              type="button"
                              onClick={() => {
                                if (
                                  confirm(
                                    'Xóa / Lưu trữ tổ chức? Hành động soft-delete (archived). Có thể ảnh hưởng báo cáo.',
                                  )
                                ) {
                                  archiveMu.mutate(o.id);
                                }
                              }}
                              disabled={archiveMu.isPending}
                            >
                              Xóa / Lưu trữ
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => {
                              setPlanOrgId(o.id);
                              setSelectedPlanId(o.plan_id ?? '');
                            }}
                          >
                            Đổi gói
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {planOrgId ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-border/70 bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-black text-foreground">Đổi gói dịch vụ</h3>
            <p className="mt-1 text-sm text-muted">{activeOrgForPlan?.name}</p>
            <select
              className="mt-4 h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm"
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
            >
              <option value="">— Chọn gói —</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatVND(Number(p.monthly_price))}/tháng)
                </option>
              ))}
            </select>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" type="button" onClick={() => setPlanOrgId(null)}>
                Hủy
              </Button>
              <Button
                className="flex-1"
                type="button"
                disabled={!selectedPlanId || changePlanMu.isPending}
                onClick={() => {
                  if (planOrgId && selectedPlanId) {
                    changePlanMu.mutate({ id: planOrgId, planId: selectedPlanId });
                  }
                }}
              >
                Lưu
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <OrganizationCreateSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => qc.invalidateQueries({ queryKey: ['super-admin'] })}
      />
    </div>
  );
};

export default OrganizationsList;
