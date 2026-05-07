import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  CreditCard,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  computeMrrEstimate,
  countOrganizationsByStatus,
  listOrganizations,
  type OrganizationSummary,
} from '@/services/superAdmin/organizationsService';
import { countOwnersByActive } from '@/services/superAdmin/ownerAccountsService';
import { listRecentAuditLogs } from '@/services/superAdmin/activityLogService';
import { formatVND } from '@/utils';

const shortcuts = [
  {
    title: 'Tổ chức',
    description: 'Tạo, tạm ngưng, đổi gói và lưu trữ không gian làm việc.',
    href: '/super-admin/organizations',
    icon: Building2,
  },
  {
    title: 'Owner',
    description: 'Mời chủ sở hữu, reset mật khẩu và vô hiệu hóa tài khoản.',
    href: '/super-admin/owners',
    icon: Users,
  },
  {
    title: 'Billing',
    description: 'MRR, hóa đơn nền tảng, theo dõi quá hạn và danh mục gói.',
    href: '/super-admin/billing',
    icon: CreditCard,
  },
  {
    title: 'Cấu hình hệ thống',
    description: 'Feature flags, gói dịch vụ, email Resend, bảo trì, template.',
    href: '/super-admin/system-config',
    icon: Settings,
  },
  {
    title: 'Rủi ro & Kiểm toán',
    description: 'Audit log toàn hệ thống, export backup org.',
    href: '/super-admin/audit',
    icon: Shield,
  },
];

const SuperAdminDashboard: React.FC = () => {
  const statsQuery = useQuery({
    queryKey: ['super-admin', 'dashboard-stats'],
    queryFn: async () => {
      const [orgCounts, ownerCounts, mrr] = await Promise.all([
        countOrganizationsByStatus(),
        countOwnersByActive(),
        computeMrrEstimate(),
      ]);
      return { orgCounts, ownerCounts, mrr };
    },
  });

  const recentOrgsQuery = useQuery({
    queryKey: ['super-admin', 'recent-orgs'],
    queryFn: () => listOrganizations({ includeArchived: false }),
    select: (rows: OrganizationSummary[]) => rows.slice(0, 5),
  });

  const recentLogsQuery = useQuery({
    queryKey: ['super-admin', 'recent-audit'],
    queryFn: () => listRecentAuditLogs(8),
  });

  const s = statsQuery.data;

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-border/70 bg-card p-8 shadow-[0_24px_72px_-48px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-secondary">Quản trị hệ thống</p>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Điều hành và giám sát toàn nền tảng.</h1>
            <p className="max-w-2xl text-sm leading-7 text-muted">
              Số liệu dưới đây lấy trực tiếp từ các bảng tổ chức và gói dịch vụ trong cơ sở dữ liệu.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/super-admin/organizations"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-black text-primary-foreground transition-all hover:bg-primary/95"
            >
              Quản lý tổ chức
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/super-admin/owners"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-5 text-sm font-black text-foreground transition-all hover:border-primary/25 hover:text-primary"
            >
              Tài khoản Owner
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-border/70 bg-background/70 p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">Tổ chức hoạt động</p>
            <p className="mt-3 text-3xl font-black tabular-nums text-foreground">
              {statsQuery.isLoading ? '—' : s?.orgCounts.active ?? 0}
            </p>
            <p className="mt-2 text-xs text-muted">
              Tạm ngưng: {statsQuery.isLoading ? '—' : s?.orgCounts.suspended ?? 0}
            </p>
          </div>
          <div className="rounded-[24px] border border-border/70 bg-background/70 p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">Owner hoạt động</p>
            <p className="mt-3 text-3xl font-black tabular-nums text-foreground">
              {statsQuery.isLoading ? '—' : s?.ownerCounts.active ?? 0}
            </p>
            <p className="mt-2 text-xs text-muted">
              Đã vô hiệu: {statsQuery.isLoading ? '—' : s?.ownerCounts.inactive ?? 0}
            </p>
          </div>
          <div className="rounded-[24px] border border-border/70 bg-background/70 p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">Ước tính MRR</p>
            <p className="mt-3 text-3xl font-black tabular-nums text-foreground">
              {statsQuery.isLoading ? '—' : formatVND(s?.mrr ?? 0)}
            </p>
            <p className="mt-2 text-xs text-muted">Tổng giá gói các tổ chức đang hoạt động</p>
          </div>
          <div className="rounded-[24px] border border-border/70 bg-background/70 p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">Đã lưu trữ</p>
            <p className="mt-3 text-3xl font-black tabular-nums text-foreground">
              {statsQuery.isLoading ? '—' : s?.orgCounts.archived ?? 0}
            </p>
            <p className="mt-2 text-xs text-muted">Tổ chức archived / soft-delete</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[30px] border border-border/70 bg-card p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.34)]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black tracking-tight text-foreground">Tổ chức gần đây</h2>
            <Link to="/super-admin/organizations" className="text-sm font-bold text-primary hover:underline">
              Xem tất cả
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {recentOrgsQuery.isLoading ? (
              <li className="text-sm text-muted">Đang tải...</li>
            ) : (recentOrgsQuery.data ?? []).length === 0 ? (
              <li className="text-sm text-muted">Chưa có dữ liệu.</li>
            ) : (
              recentOrgsQuery.data!.map((o) => (
                <li key={o.id}>
                  <Link
                    to={`/super-admin/organizations/${o.id}`}
                    className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm transition hover:border-primary/25"
                  >
                    <span className="font-semibold text-foreground">{o.name}</span>
                    <span className="text-xs uppercase tracking-wider text-muted">{o.status}</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="rounded-[30px] border border-border/70 bg-card p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.34)]">
          <h2 className="text-xl font-black tracking-tight text-foreground">Nhật ký gần đây</h2>
          <p className="mt-1 text-sm text-muted">Audit log hệ thống (mẫu).</p>
          <ul className="mt-4 space-y-2">
            {recentLogsQuery.isLoading ? (
              <li className="text-sm text-muted">Đang tải...</li>
            ) : (recentLogsQuery.data ?? []).length === 0 ? (
              <li className="text-sm text-muted">Chưa có nhật ký.</li>
            ) : (
              recentLogsQuery.data!.map((log) => (
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
              ))
            )}
          </ul>
        </article>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {shortcuts.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="rounded-[28px] border border-border/70 bg-card p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.34)] transition-all hover:-translate-y-1 hover:border-primary/25"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <item.icon size={22} />
            </div>
            <p className="mt-5 text-[11px] font-black uppercase tracking-[0.2em] text-muted">Đi tới</p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-foreground">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{item.description}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">
              Tiếp tục
              <ArrowRight size={16} />
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
};

export default SuperAdminDashboard;
