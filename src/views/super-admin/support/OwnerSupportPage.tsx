import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  createBroadcastDraft,
  listBroadcasts,
  sendBroadcastEmails,
} from '@/services/superAdmin/platformBroadcastsService';
import { listOrganizations } from '@/services/superAdmin/organizationsService';
import useAuthStore from '@/stores/authStore';

type Tab = 'broadcast' | 'history' | 'phase2';

const OwnerSupportPage: React.FC = () => {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const [tab, setTab] = useState<Tab>('broadcast');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetScope, setTargetScope] = useState<'all' | 'orgs'>('all');
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [audience, setAudience] = useState<'owners' | 'owners_staff'>('owners');

  const orgsQuery = useQuery({
    queryKey: ['super-admin', 'orgs-broadcast'],
    queryFn: () => listOrganizations({ status: 'active' }),
  });

  const historyQuery = useQuery({
    queryKey: ['super-admin', 'platform-broadcasts'],
    queryFn: () => listBroadcasts(100),
    enabled: tab === 'history' || tab === 'broadcast',
  });

  const draftMu = useMutation({
    mutationFn: async () => {
      const target_org_ids = targetScope === 'orgs' ? selectedOrgIds : [];
      if (targetScope === 'orgs' && target_org_ids.length === 0) {
        throw new Error('Chọn ít nhất một tổ chức');
      }
      return createBroadcastDraft({
        title,
        content,
        target_scope: targetScope,
        target_org_ids,
        audience,
        created_by: userId ?? null,
      });
    },
    onSuccess: () => {
      toast.success('Đã lưu nháp');
      qc.invalidateQueries({ queryKey: ['super-admin', 'platform-broadcasts'] });
      setTitle('');
      setContent('');
      setSelectedOrgIds([]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendMu = useMutation({
    mutationFn: sendBroadcastEmails,
    onSuccess: (data) => {
      toast.success(`Đã gửi ${data.sent} email`);
      qc.invalidateQueries({ queryKey: ['super-admin', 'platform-broadcasts'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendAllMu = useMutation({
    mutationFn: async () => {
      const target_org_ids = targetScope === 'orgs' ? selectedOrgIds : [];
      if (targetScope === 'orgs' && target_org_ids.length === 0) {
        throw new Error('Chọn ít nhất một tổ chức');
      }
      const row = await createBroadcastDraft({
        title,
        content,
        target_scope: targetScope,
        target_org_ids,
        audience,
        created_by: userId ?? null,
      });
      const r = await sendBroadcastEmails(row.id);
      return r.sent;
    },
    onSuccess: (sent) => {
      toast.success(`Đã tạo và gửi broadcast (${sent} email)`);
      qc.invalidateQueries({ queryKey: ['super-admin', 'platform-broadcasts'] });
      setTitle('');
      setContent('');
      setSelectedOrgIds([]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleOrg = (id: string) => {
    setSelectedOrgIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

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
        <h1 className="text-3xl font-black tracking-tight text-foreground">Hỗ trợ Owner</h1>

        <div className="mt-8 flex flex-wrap gap-2 border-b border-border/70 pb-3">
          {(
            [
              ['broadcast', 'Broadcast email'],
              ['history', 'Lịch sử'],
              ['phase2', 'Phase 2'],
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

        {tab === 'broadcast' ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <Input placeholder="Tiêu đề" value={title} onChange={(e) => setTitle(e.target.value)} />
              <textarea
                placeholder="Nội dung (plain text / HTML đơn giản)"
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
              <div>
                <p className="mb-2 text-[11px] font-black uppercase text-muted">Phạm vi</p>
                <label className="mr-4 inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={targetScope === 'all'}
                    onChange={() => setTargetScope('all')}
                  />
                  Tất cả tổ chức hoạt động
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={targetScope === 'orgs'}
                    onChange={() => setTargetScope('orgs')}
                  />
                  Chọn tổ chức
                </label>
              </div>
              {targetScope === 'orgs' ? (
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-border/70 p-3">
                  {(orgsQuery.data ?? []).map((o) => (
                    <label key={o.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedOrgIds.includes(o.id)}
                        onChange={() => toggleOrg(o.id)}
                      />
                      {o.name}
                    </label>
                  ))}
                </div>
              ) : null}
              <div>
                <p className="mb-2 text-[11px] font-black uppercase text-muted">Đối tượng</p>
                <select
                  className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as 'owners' | 'owners_staff')}
                >
                  <option value="owners">Owner (theo profiles.organization_id)</option>
                  <option value="owners_staff">Owner + Admin/Staff (theo thành viên)</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => draftMu.mutate()}
                  isLoading={draftMu.isPending}
                  disabled={!title.trim() || !content.trim()}
                >
                  Lưu nháp
                </Button>
                <Button
                  type="button"
                  onClick={() => sendAllMu.mutate()}
                  isLoading={sendAllMu.isPending}
                  disabled={!title.trim() || !content.trim()}
                >
                  Tạo & gửi ngay
                </Button>
              </div>
              <p className="text-xs text-muted">
                Cần cấu hình RESEND_API_KEY trên Edge Function. Email lấy từ preferences.email của profile.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground">Gần đây</h2>
              <ul className="mt-4 space-y-2">
                {(historyQuery.data ?? []).slice(0, 12).map((b) => (
                  <li
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-foreground">{b.title}</span>
                    <span className="text-xs uppercase text-muted">{b.status}</span>
                    {b.status === 'draft' ? (
                      <Button type="button" size="sm" onClick={() => sendMu.mutate(b.id)} isLoading={sendMu.isPending}>
                        Gửi
                      </Button>
                    ) : (
                      <span className="text-xs text-muted">{b.recipient_count} gửi</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {tab === 'history' ? (
          <div className="mt-8 overflow-x-auto rounded-[24px] border border-border/70">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-border/70 bg-background/70">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-muted">Tiêu đề</th>
                  <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-muted">TT</th>
                  <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-muted">Gửi</th>
                  <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-muted">SL</th>
                </tr>
              </thead>
              <tbody>
                {(historyQuery.data ?? []).map((b) => (
                  <tr key={b.id} className="border-b border-border/40">
                    <td className="px-3 py-2 font-semibold">{b.title}</td>
                    <td className="px-3 py-2 text-xs uppercase">{b.status}</td>
                    <td className="px-3 py-2 text-xs text-muted">
                      {b.sent_at ? new Date(b.sent_at).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td className="px-3 py-2">{b.recipient_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {tab === 'phase2' ? (
          <div className="mt-8 space-y-3 text-sm text-muted">
            <p className="rounded-[22px] bg-background/70 px-4 py-3">
              <strong className="text-foreground">Đăng nhập với vai trò Owner (impersonation):</strong> Sắp có (Phase 2).
            </p>
            <p className="rounded-[22px] bg-background/70 px-4 py-3">
              <strong className="text-foreground">Sửa dữ liệu khẩn cấp:</strong> Sắp có (Phase 2).
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default OwnerSupportPage;
