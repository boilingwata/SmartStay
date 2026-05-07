import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  listCatalog,
  listFlagsForOrganization,
  upsertOrganizationFlag,
} from '@/services/superAdmin/featureFlagsService';
import { listOrganizations } from '@/services/superAdmin/organizationsService';
import {
  createPlan,
  listPlans,
  updatePlan,
  type SubscriptionPlanRow,
} from '@/services/superAdmin/subscriptionPlansService';
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
  type TemplateKind,
  type SystemTemplateRow,
} from '@/services/superAdmin/systemTemplatesService';
import {
  getEmailIdentity,
  getMaintenanceState,
  setEmailIdentity,
  setMaintenanceState,
} from '@/services/superAdmin/systemSettingsService';
import { sendTestEmail } from '@/services/superAdmin/platformBroadcastsService';
import useAuthStore from '@/stores/authStore';
import { formatVND } from '@/utils';

type Tab = 'flags' | 'plans' | 'email' | 'maintenance' | 'templates';

const SystemConfigPage: React.FC = () => {
  const qc = useQueryClient();
  const userEmail = useAuthStore((s) => s.user?.email);
  const [tab, setTab] = useState<Tab>('flags');

  const orgsQuery = useQuery({
    queryKey: ['super-admin', 'organizations', 'feature-flag-picker'],
    queryFn: () => listOrganizations({ status: 'active' }),
  });

  const [orgForFlags, setOrgForFlags] = useState<string>('');

  const catalogQuery = useQuery({
    queryKey: ['super-admin', 'flag-catalog'],
    queryFn: listCatalog,
  });

  const flagsQuery = useQuery({
    queryKey: ['super-admin', 'org-flags', orgForFlags],
    queryFn: () => listFlagsForOrganization(orgForFlags),
    enabled: !!orgForFlags,
  });

  const plansQuery = useQuery({
    queryKey: ['super-admin', 'plans-all'],
    queryFn: () => listPlans(false),
    enabled: tab === 'plans',
  });

  const templatesQuery = useQuery({
    queryKey: ['super-admin', 'templates-global'],
    queryFn: () => listTemplates({ organizationId: null }),
    enabled: tab === 'templates',
  });

  const maintenanceQuery = useQuery({
    queryKey: ['super-admin', 'maintenance'],
    queryFn: getMaintenanceState,
    enabled: tab === 'maintenance',
  });

  const emailQuery = useQuery({
    queryKey: ['super-admin', 'email-identity'],
    queryFn: getEmailIdentity,
    enabled: tab === 'email',
  });

  const toggleFlagMu = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      await upsertOrganizationFlag(orgForFlags, key, enabled);
    },
    onSuccess: () => {
      toast.success('Đã cập nhật');
      qc.invalidateQueries({ queryKey: ['super-admin', 'org-flags'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [planForm, setPlanForm] = useState({
    name: '',
    slug: '',
    monthly_price: '',
    building_limit: '999999',
    room_limit: '999999',
    user_limit: '999999',
  });

  const createPlanMu = useMutation({
    mutationFn: async () => {
      await createPlan({
        name: planForm.name,
        slug: planForm.slug || undefined,
        monthly_price: Number(planForm.monthly_price),
        building_limit: Number(planForm.building_limit),
        room_limit: Number(planForm.room_limit),
        user_limit: Number(planForm.user_limit),
      });
    },
    onSuccess: () => {
      toast.success('Đã tạo gói');
      setPlanForm({
        name: '',
        slug: '',
        monthly_price: '',
        building_limit: '999999',
        room_limit: '999999',
        user_limit: '999999',
      });
      qc.invalidateQueries({ queryKey: ['super-admin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveMaintenanceMu = useMutation({
    mutationFn: async (payload: { enabled: boolean; message: string }) => {
      await setMaintenanceState(payload.enabled, payload.message);
    },
    onSuccess: () => {
      toast.success('Đã lưu');
      qc.invalidateQueries({ queryKey: ['super-admin', 'maintenance'] });
      qc.invalidateQueries({ queryKey: ['platform', 'maintenance-banner'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveEmailMu = useMutation({
    mutationFn: async (payload: { fromName: string; fromAddress: string }) => {
      await setEmailIdentity(payload.fromName, payload.fromAddress);
    },
    onSuccess: () => {
      toast.success('Đã lưu');
      qc.invalidateQueries({ queryKey: ['super-admin', 'email-identity'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testEmailMu = useMutation({
    mutationFn: async (to: string) => {
      await sendTestEmail(to);
    },
    onSuccess: () => toast.success('Đã gửi email thử'),
    onError: (e: Error) => toast.error(e.message),
  });

  const [tplKind, setTplKind] = useState<TemplateKind>('email_html');
  const [tplDraft, setTplDraft] = useState({ slug: '', name: '', content: '' });

  const createTplMu = useMutation({
    mutationFn: async () => {
      await createTemplate({
        kind: tplKind,
        slug: tplDraft.slug,
        name: tplDraft.name,
        content: tplDraft.content,
        organization_id: null,
      });
    },
    onSuccess: () => {
      toast.success('Đã tạo template');
      setTplDraft({ slug: '', name: '', content: '' });
      qc.invalidateQueries({ queryKey: ['super-admin', 'templates-global'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delTplMu = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      toast.success('Đã xóa');
      qc.invalidateQueries({ queryKey: ['super-admin', 'templates-global'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const catalog = catalogQuery.data ?? [];
  const flags = flagsQuery.data ?? [];

  function flagEnabled(key: string): boolean {
    return flags.find((f) => f.flag_key === key)?.enabled ?? false;
  }

  return (
    <div className="space-y-6">
      <Link
        to="/super-admin/dashboard"
        className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-bold text-foreground hover:border-primary/25"
      >
        <ArrowLeft size={16} />
        Bảng điều khiển
      </Link>

      <section className="rounded-[32px] border border-border/70 bg-card p-6 shadow-[0_24px_72px_-48px_rgba(15,23,42,0.45)] sm:p-8">
        <h1 className="text-3xl font-black tracking-tight text-foreground">Cấu hình hệ thống</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Feature flags theo tổ chức, gói dịch vụ, email Resend, bảo trì và template mặc định.
        </p>

        <div className="mt-8 flex flex-wrap gap-2 border-b border-border/70 pb-3">
          {(
            [
              ['flags', 'Feature flags'],
              ['plans', 'Gói dịch vụ'],
              ['email', 'Email'],
              ['maintenance', 'Bảo trì'],
              ['templates', 'Template'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
                tab === k ? 'bg-primary text-primary-foreground' : 'bg-background text-muted hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'flags' ? (
          <div className="mt-8 space-y-6">
            <div className="max-w-md">
              <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-muted">
                Tổ chức
              </label>
              <select
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm"
                value={orgForFlags}
                onChange={(e) => setOrgForFlags(e.target.value)}
              >
                <option value="">— Chọn —</option>
                {(orgsQuery.data ?? []).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            {!orgForFlags ? (
              <p className="text-sm text-muted">Chọn tổ chức để bật/tắt cờ.</p>
            ) : catalogQuery.isLoading ? (
              <p className="text-muted">Đang tải...</p>
            ) : (
              <ul className="space-y-3">
                {catalog.map((c) => (
                  <li
                    key={c.key}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-border/60 bg-background/70 px-4 py-3"
                  >
                    <div>
                      <p className="font-bold text-foreground">{c.label}</p>
                      <p className="text-xs text-muted">{c.description ?? c.key}</p>
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={flagEnabled(c.key)}
                        onChange={(e) =>
                          toggleFlagMu.mutate({ key: c.key, enabled: e.target.checked })
                        }
                        disabled={toggleFlagMu.isPending}
                      />
                      {flagEnabled(c.key) ? 'Bật' : 'Tắt'}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {tab === 'plans' ? (
          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-lg font-black text-foreground">Tạo gói mới</h2>
              <div className="mt-4 grid gap-3">
                <Input
                  placeholder="Tên gói"
                  value={planForm.name}
                  onChange={(e) => setPlanForm((p) => ({ ...p, name: e.target.value }))}
                />
                <Input
                  placeholder="Slug (tuỳ chọn)"
                  value={planForm.slug}
                  onChange={(e) => setPlanForm((p) => ({ ...p, slug: e.target.value }))}
                />
                <Input
                  placeholder="Giá / tháng (₫)"
                  type="number"
                  value={planForm.monthly_price}
                  onChange={(e) => setPlanForm((p) => ({ ...p, monthly_price: e.target.value }))}
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Giới hạn tòa"
                    type="number"
                    value={planForm.building_limit}
                    onChange={(e) => setPlanForm((p) => ({ ...p, building_limit: e.target.value }))}
                  />
                  <Input
                    placeholder="Phòng"
                    type="number"
                    value={planForm.room_limit}
                    onChange={(e) => setPlanForm((p) => ({ ...p, room_limit: e.target.value }))}
                  />
                  <Input
                    placeholder="User"
                    type="number"
                    value={planForm.user_limit}
                    onChange={(e) => setPlanForm((p) => ({ ...p, user_limit: e.target.value }))}
                  />
                </div>
                <Button type="button" onClick={() => createPlanMu.mutate()} isLoading={createPlanMu.isPending}>
                  Tạo gói
                </Button>
              </div>
            </div>
            <div className="overflow-hidden rounded-[24px] border border-border/70">
              <table className="w-full text-sm">
                <thead className="border-b border-border/70 bg-background/70">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-muted">Gói</th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-muted">Giá</th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-muted">Hoạt động</th>
                  </tr>
                </thead>
                <tbody>
                  {(plansQuery.data ?? []).map((p: SubscriptionPlanRow) => (
                    <PlanRow key={p.id} plan={p} onSaved={() => qc.invalidateQueries({ queryKey: ['super-admin'] })} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {tab === 'email' ? (
          <div className="mt-8 max-w-lg space-y-4">
            {emailQuery.isLoading ? (
              <p className="text-muted">Đang tải...</p>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-muted">
                    Tên hiển thị (From)
                  </label>
                  <Input
                    defaultValue={emailQuery.data?.fromName ?? ''}
                    key={emailQuery.dataUpdatedAt}
                    id="email-from-name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-muted">
                    Địa chỉ From (Resend đã verify domain)
                  </label>
                  <Input
                    defaultValue={emailQuery.data?.fromAddress ?? ''}
                    key={`addr-${emailQuery.dataUpdatedAt}`}
                    id="email-from-address"
                    type="email"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    const nameEl = document.getElementById('email-from-name') as HTMLInputElement | null;
                    const addrEl = document.getElementById('email-from-address') as HTMLInputElement | null;
                    if (!nameEl || !addrEl) return;
                    saveEmailMu.mutate({ fromName: nameEl.value.trim(), fromAddress: addrEl.value.trim() });
                  }}
                  isLoading={saveEmailMu.isPending}
                >
                  Lưu cấu hình email
                </Button>
                <div className="border-t border-border pt-6">
                  <p className="text-sm text-muted">Gửi email thử qua Edge Function (cần RESEND_API_KEY).</p>
                  <div className="mt-3 flex gap-2">
                    <Input
                      placeholder="Email nhận"
                      defaultValue={userEmail ?? ''}
                      id="email-test-to"
                      type="email"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const el = document.getElementById('email-test-to') as HTMLInputElement | null;
                        if (el?.value) testEmailMu.mutate(el.value);
                      }}
                      isLoading={testEmailMu.isPending}
                    >
                      Gửi thử
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}

        {tab === 'maintenance' ? (
          <div className="mt-8 max-w-lg space-y-4">
            {maintenanceQuery.isLoading ? (
              <p className="text-muted">Đang tải...</p>
            ) : (
              <>
                <label className="flex items-center gap-2 font-semibold text-foreground">
                  <input
                    type="checkbox"
                    defaultChecked={maintenanceQuery.data?.enabled ?? false}
                    id="maint-enabled"
                  />
                  Bật chế độ bảo trì
                </label>
                <div>
                  <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-muted">
                    Thông báo
                  </label>
                  <textarea
                    id="maint-msg"
                    rows={3}
                    defaultValue={maintenanceQuery.data?.message ?? ''}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    const en = (document.getElementById('maint-enabled') as HTMLInputElement)?.checked ?? false;
                    const msg = (document.getElementById('maint-msg') as HTMLTextAreaElement)?.value ?? '';
                    saveMaintenanceMu.mutate({ enabled: en, message: msg });
                  }}
                  isLoading={saveMaintenanceMu.isPending}
                >
                  Lưu
                </Button>
              </>
            )}
          </div>
        ) : null}

        {tab === 'templates' ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-lg font-black text-foreground">Thêm template (toàn cục)</h2>
              <div className="mt-4 space-y-3">
                <select
                  className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm"
                  value={tplKind}
                  onChange={(e) => setTplKind(e.target.value as TemplateKind)}
                >
                  <option value="contract">contract</option>
                  <option value="invoice_html">invoice_html</option>
                  <option value="email_html">email_html</option>
                </select>
                <Input
                  placeholder="slug"
                  value={tplDraft.slug}
                  onChange={(e) => setTplDraft((t) => ({ ...t, slug: e.target.value }))}
                />
                <Input
                  placeholder="Tên hiển thị"
                  value={tplDraft.name}
                  onChange={(e) => setTplDraft((t) => ({ ...t, name: e.target.value }))}
                />
                <textarea
                  placeholder="Nội dung (HTML/text)"
                  rows={8}
                  value={tplDraft.content}
                  onChange={(e) => setTplDraft((t) => ({ ...t, content: e.target.value }))}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                <Button type="button" onClick={() => createTplMu.mutate()} isLoading={createTplMu.isPending}>
                  Tạo template
                </Button>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground">Danh sách</h2>
              <ul className="mt-4 space-y-2">
                {(templatesQuery.data ?? []).map((t: SystemTemplateRow) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-sm"
                  >
                    <span>
                      <span className="font-bold text-foreground">{t.name}</span>{' '}
                      <span className="text-xs text-muted">
                        {t.kind}/{t.slug}
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        if (confirm('Xóa template này?')) delTplMu.mutate(t.id);
                      }}
                    >
                      Xóa
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};

function PlanRow({ plan, onSaved }: { plan: SubscriptionPlanRow; onSaved: () => void }) {
  const qc = useQueryClient();
  const [price, setPrice] = useState(String(plan.monthly_price));
  const [active, setActive] = useState(plan.is_active !== false);

  const mu = useMutation({
    mutationFn: async () => {
      await updatePlan(plan.id, {
        monthly_price: Number(price),
        is_active: active,
      });
    },
    onSuccess: () => {
      toast.success('Đã lưu gói');
      onSaved();
      qc.invalidateQueries({ queryKey: ['super-admin', 'plans-all'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <tr className="border-b border-border/40">
      <td className="px-3 py-2 font-semibold text-foreground">{plan.name}</td>
      <td className="px-3 py-2">
        <Input
          className="h-9"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <span className="mt-1 block text-[10px] text-muted">{formatVND(Number(price || 0))}</span>
      </td>
      <td className="px-3 py-2">
        <label className="flex items-center gap-2 text-xs font-semibold">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Active
        </label>
        <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => mu.mutate()} isLoading={mu.isPending}>
          Lưu
        </Button>
      </td>
    </tr>
  );
}

export default SystemConfigPage;
