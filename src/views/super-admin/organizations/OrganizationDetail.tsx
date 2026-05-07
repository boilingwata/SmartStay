import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  getOrganization,
  listOrganizationMembers,
  updateOrganization,
} from '@/services/superAdmin/organizationsService';
import { listRecentLogsForOrgUserIds } from '@/services/superAdmin/activityLogService';
import { formatVND } from '@/utils';

const overviewSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
});

type OverviewForm = z.infer<typeof overviewSchema>;

type Tab = 'overview' | 'members' | 'plan' | 'activity';

function prefsEmail(preferences: unknown): string {
  if (!preferences || typeof preferences !== 'object') return '—';
  const e = (preferences as Record<string, unknown>).email;
  return typeof e === 'string' ? e : '—';
}

export const OrganizationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');

  const orgQuery = useQuery({
    queryKey: ['super-admin', 'organization', id],
    queryFn: () => getOrganization(id!),
    enabled: !!id,
  });

  const membersQuery = useQuery({
    queryKey: ['super-admin', 'organization-members', id],
    queryFn: () => listOrganizationMembers(id!),
    enabled: !!id && tab === 'members',
  });

  const activityQuery = useQuery({
    queryKey: ['super-admin', 'organization-activity', id],
    queryFn: async () => {
      const members = await listOrganizationMembers(id!);
      const userIds = members.map((m) => m.user_id);
      return listRecentLogsForOrgUserIds(userIds, 40);
    },
    enabled: !!id && tab === 'activity',
  });

  const org = orgQuery.data;

  const form = useForm<OverviewForm>({
    resolver: zodResolver(overviewSchema),
    defaultValues: { name: '', slug: '', description: '' },
  });

  useEffect(() => {
    if (org) {
      form.reset({
        name: org.name,
        slug: org.slug,
        description: org.description ?? '',
      });
    }
  }, [org, form]);

  const saveMu = useMutation({
    mutationFn: async (v: OverviewForm) => {
      await updateOrganization(id!, {
        name: v.name.trim(),
        slug: v.slug.trim(),
        description: v.description?.trim() || null,
      });
    },
    onSuccess: () => {
      toast.success('Đã lưu');
      qc.invalidateQueries({ queryKey: ['super-admin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!id) return null;

  if (orgQuery.isLoading) {
    return (
      <div className="rounded-[28px] border border-border/70 bg-card p-12 text-center text-muted">
        Đang tải...
      </div>
    );
  }

  if (orgQuery.isError || !org) {
    return (
      <div className="rounded-[28px] border border-border/70 bg-card p-12 text-center text-muted">
        Không tìm thấy tổ chức.
      </div>
    );
  }

  const plan = org.plan;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-4">
        <Link
          to="/super-admin/organizations"
          className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-bold text-foreground hover:border-primary/25"
        >
          <ArrowLeft size={16} />
          Danh sách
        </Link>
      </div>

      <section className="rounded-[32px] border border-border/70 bg-card p-6 shadow-[0_24px_72px_-48px_rgba(15,23,42,0.45)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 size={26} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-secondary">Chi tiết tổ chức</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground">{org.name}</h1>
              <p className="mt-2 text-sm text-muted">
                Slug: <span className="font-mono text-foreground">{org.slug}</span>
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Gói hiện tại</p>
            <p className="mt-1 font-black text-foreground">{plan?.name ?? '—'}</p>
            {plan?.monthly_price != null ? (
              <p className="text-xs text-muted">{formatVND(Number(plan.monthly_price))} / tháng</p>
            ) : null}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 border-b border-border/70 pb-3">
          {(
            [
              ['overview', 'Tổng quan'],
              ['members', 'Thành viên'],
              ['plan', 'Gói dịch vụ'],
              ['activity', 'Hoạt động'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
                tab === k
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'overview' ? (
          <form
            className="mt-6 max-w-xl space-y-4"
            onSubmit={form.handleSubmit((v) => saveMu.mutate(v))}
          >
            <div>
              <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-muted">
                Tên
              </label>
              <Input {...form.register('name')} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-muted">
                Slug
              </label>
              <Input {...form.register('slug')} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-muted">
                Mô tả
              </label>
              <textarea
                {...form.register('description')}
                rows={3}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>
            <Button type="submit" isLoading={saveMu.isPending}>
              Lưu thay đổi
            </Button>
          </form>
        ) : null}

        {tab === 'members' ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted">
              Thêm chủ nhà từ trang <Link className="font-bold text-primary underline" to="/super-admin/owners">Owner</Link>.
            </p>
            <div className="overflow-hidden rounded-[24px] border border-border/70">
              <table className="w-full text-sm">
                <thead className="border-b border-border/70 bg-background/70">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-muted">
                      Người dùng
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-muted">
                      Vai trò
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-muted">
                      Email (prefs)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {membersQuery.isLoading ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted">
                        Đang tải...
                      </td>
                    </tr>
                  ) : (membersQuery.data ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted">
                        Chưa có thành viên.
                      </td>
                    </tr>
                  ) : (
                    membersQuery.data!.map((m) => {
                      const p = m.profile;
                      return (
                        <tr key={m.id} className="border-b border-border/40">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Users size={16} className="text-muted" />
                              <span className="font-semibold text-foreground">{p?.full_name ?? m.user_id}</span>
                            </div>
                            <Link
                              to={`/super-admin/owners/${m.user_id}`}
                              className="text-xs font-bold text-primary hover:underline"
                            >
                              Xem hồ sơ
                            </Link>
                          </td>
                          <td className="px-4 py-3 capitalize text-muted">{m.member_role}</td>
                          <td className="px-4 py-3 text-muted">{prefsEmail(p?.preferences)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {tab === 'plan' ? (
          <div className="mt-6 rounded-[24px] border border-border/70 bg-background/70 p-6">
            <h3 className="text-lg font-black text-foreground">{plan?.name ?? '—'}</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li>
                Giá:{' '}
                <span className="font-semibold text-foreground">
                  {plan?.monthly_price != null ? formatVND(Number(plan.monthly_price)) : '—'}
                </span>{' '}
                / tháng
              </li>
              <li>
                Giới hạn tòa: <span className="text-foreground">{plan?.building_limit ?? '—'}</span>
              </li>
              <li>
                Giới hạn phòng: <span className="text-foreground">{plan?.room_limit ?? '—'}</span>
              </li>
              <li>
                Giới hạn người dùng: <span className="text-foreground">{plan?.user_limit ?? '—'}</span>
              </li>
            </ul>
            <p className="mt-4 text-xs text-muted">
              Đổi gói nhanh từ danh sách tổ chức (thao tác &quot;Đổi gói&quot;).
            </p>
          </div>
        ) : null}

        {tab === 'activity' ? (
          <div className="mt-6 space-y-3">
            {activityQuery.isLoading ? (
              <p className="text-muted">Đang tải nhật ký...</p>
            ) : (activityQuery.data ?? []).length === 0 ? (
              <p className="text-muted">Chưa có nhật ký gần đây cho thành viên tổ chức này.</p>
            ) : (
              <ul className="space-y-2">
                {activityQuery.data!.map((log) => (
                  <li
                    key={log.id}
                    className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm"
                  >
                    <span className="font-bold text-foreground">{log.action}</span>{' '}
                    <span className="text-muted">{log.entity_type}</span>
                    <p className="mt-1 text-xs text-muted">
                      {log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default OrganizationDetail;
