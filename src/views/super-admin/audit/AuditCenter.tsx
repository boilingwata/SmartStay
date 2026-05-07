import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { listAuditLogs } from '@/services/superAdmin/activityLogService';
import { exportOrganizationBackup, listOrganizations } from '@/services/superAdmin/organizationsService';

type Tab = 'audit' | 'export' | 'phase2';

const AuditCenter: React.FC = () => {
  const [tab, setTab] = useState<Tab>('audit');
  const [actionQ, setActionQ] = useState('');
  const [entityQ, setEntityQ] = useState('');
  const [userQ, setUserQ] = useState('');
  const [limit, setLimit] = useState(50);

  const logsQuery = useQuery({
    queryKey: ['super-admin', 'audit-logs', actionQ, entityQ, userQ, limit],
    queryFn: () =>
      listAuditLogs({
        actionContains: actionQ || undefined,
        entityType: entityQ || undefined,
        userId: userQ || undefined,
        limit,
        offset: 0,
      }),
    enabled: tab === 'audit',
  });

  const orgsQuery = useQuery({
    queryKey: ['super-admin', 'orgs-export-picker'],
    queryFn: () => listOrganizations({ includeArchived: true }),
    enabled: tab === 'export',
  });

  const [exportOrgId, setExportOrgId] = useState('');

  const downloadExport = async () => {
    if (!exportOrgId) {
      toast.error('Chọn tổ chức');
      return;
    }
    try {
      const payload = await exportOrganizationBackup(exportOrgId);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `org-backup-${exportOrgId.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Đã tải xuống');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi export');
    }
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
        <h1 className="text-3xl font-black tracking-tight text-foreground">Rủi ro & Kiểm toán</h1>
        <div className="mt-8 flex flex-wrap gap-2 border-b border-border/70 pb-3">
          {(
            [
              ['audit', 'Audit log'],
              ['export', 'Export org'],
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

        {tab === 'audit' ? (
          <div className="mt-8 space-y-4">
            <div className="flex flex-wrap gap-3">
              <Input placeholder="Lọc action (contains)" value={actionQ} onChange={(e) => setActionQ(e.target.value)} />
              <Input placeholder="entity_type" value={entityQ} onChange={(e) => setEntityQ(e.target.value)} />
              <Input placeholder="user_id (uuid)" value={userQ} onChange={(e) => setUserQ(e.target.value)} />
              <Input
                type="number"
                min={10}
                max={500}
                className="w-28"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value) || 50)}
              />
            </div>
            <div className="overflow-x-auto rounded-[24px] border border-border/70">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b border-border/70 bg-background/70">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-muted">Thời gian</th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-muted">Action</th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-muted">Entity</th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-muted">User</th>
                  </tr>
                </thead>
                <tbody>
                  {logsQuery.isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-muted">
                        Đang tải...
                      </td>
                    </tr>
                  ) : (
                    (logsQuery.data ?? []).map((log) => (
                      <tr key={log.id} className="border-b border-border/40">
                        <td className="px-3 py-2 text-xs text-muted">
                          {log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : '—'}
                        </td>
                        <td className="px-3 py-2 font-semibold text-foreground">{log.action}</td>
                        <td className="px-3 py-2 text-muted">
                          {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-muted">{log.user_id ?? '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {tab === 'export' ? (
          <div className="mt-8 max-w-lg space-y-4">
            <p className="text-sm text-muted">
              Tải snapshot JSON: tổ chức, thành viên, hồ sơ và audit log của các user trong org.
            </p>
            <select
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm"
              value={exportOrgId}
              onChange={(e) => setExportOrgId(e.target.value)}
            >
              <option value="">— Chọn tổ chức —</option>
              {(orgsQuery.data ?? []).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            <Button type="button" onClick={() => void downloadExport()}>
              Tải JSON
            </Button>
          </div>
        ) : null}

        {tab === 'phase2' ? (
          <div className="mt-8 space-y-3 text-sm text-muted">
            <p className="rounded-[22px] bg-background/70 px-4 py-3">
              <strong className="text-foreground">Supabase logs:</strong> Sắp có (Phase 2) — cần Management API /
              PAT.
            </p>
            <p className="rounded-[22px] bg-background/70 px-4 py-3">
              <strong className="text-foreground">Lịch sử impersonation:</strong> Sắp có (Phase 2).
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default AuditCenter;
