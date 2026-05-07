import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import {
  listOwners,
  sendOwnerPasswordReset,
  setOwnerActive,
} from '@/services/superAdmin/ownerAccountsService';

import { InviteOwnerSheet } from './InviteOwnerSheet';

export const OwnersList: React.FC = () => {
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const activeOnly = filter === 'active' ? true : filter === 'inactive' ? false : null;

  const { data: owners = [], isLoading } = useQuery({
    queryKey: ['super-admin', 'owners', filter],
    queryFn: () => listOwners(activeOnly === null ? {} : { activeOnly }),
  });

  const resetPw = async (email: string | undefined) => {
    if (!email) {
      toast.error('Chưa có email trên hồ sơ (preferences)');
      return;
    }
    try {
      await sendOwnerPasswordReset(email);
      toast.success('Đã gửi email đặt lại mật khẩu');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi gửi email');
    }
  };

  const toggleActive = async (id: string, next: boolean) => {
    try {
      await setOwnerActive(id, next);
      toast.success(next ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hóa tài khoản');
      qc.invalidateQueries({ queryKey: ['super-admin'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi cập nhật');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-border/70 bg-card p-6 shadow-[0_24px_72px_-48px_rgba(15,23,42,0.45)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-secondary">Quản trị</p>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Tài khoản Owner</h1>
            <p className="max-w-xl text-sm leading-7 text-muted">
              Tạo và mời chủ sở hữu, đặt lại mật khẩu, vô hiệu hóa khi cần.
            </p>
          </div>
          <Button leftIcon={<UserPlus size={16} />} onClick={() => setInviteOpen(true)}>
            Mời Owner
          </Button>
        </div>

        <div className="mt-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="h-12 rounded-2xl border border-border bg-background px-4 text-sm font-semibold"
          >
            <option value="all">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã vô hiệu hóa</option>
          </select>
        </div>
      </section>

      <div className="overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-[0_20px_60px_-42px_rgba(15,23,42,0.34)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-border/70 bg-background/70">
              <tr>
                <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-muted">
                  Họ tên
                </th>
                <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-muted">
                  Email
                </th>
                <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-muted">
                  Điện thoại
                </th>
                <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-muted">
                  Tổ chức
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
              ) : owners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted">
                    Chưa có Owner.
                  </td>
                </tr>
              ) : (
                owners.map((o) => (
                  <tr key={o.id} className="border-b border-border/50 hover:bg-background/50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-primary" />
                        <span className="font-black text-foreground">{o.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted">{o.emailDisplay ?? '—'}</td>
                    <td className="px-5 py-4 text-muted">{o.phone ?? '—'}</td>
                    <td className="px-5 py-4 text-muted">{o.organizationName ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
                          o.is_active === false
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {o.is_active === false ? 'Vô hiệu' : 'Hoạt động'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          to={`/super-admin/owners/${o.id}`}
                          className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10"
                        >
                          Chi tiết
                          <ArrowRight size={14} />
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => resetPw(o.emailDisplay)}
                        >
                          Reset MK
                        </Button>
                        {o.is_active !== false ? (
                          <Button
                            variant="danger"
                            size="sm"
                            type="button"
                            onClick={() => {
                              if (confirm('Vô hiệu hóa tài khoản Owner này?')) toggleActive(o.id, false);
                            }}
                          >
                            Vô hiệu
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => toggleActive(o.id, true)}
                          >
                            Kích hoạt
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InviteOwnerSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={() => qc.invalidateQueries({ queryKey: ['super-admin'] })}
      />
    </div>
  );
};

export default OwnersList;
