import React, { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  getOwner,
  sendOwnerPasswordReset,
  setOwnerActive,
  updateOwner,
} from '@/services/superAdmin/ownerAccountsService';
import { listLogsForUser } from '@/services/superAdmin/activityLogService';

const schema = z.object({
  full_name: z.string().min(2),
  phone: z.string().optional(),
  email: z.union([z.string().email(), z.literal('')]),
});

type FormValues = z.infer<typeof schema>;

export const OwnerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const ownerQuery = useQuery({
    queryKey: ['super-admin', 'owner', id],
    queryFn: () => getOwner(id!),
    enabled: !!id,
  });

  const logsQuery = useQuery({
    queryKey: ['super-admin', 'owner-logs', id],
    queryFn: () => listLogsForUser(id!, 80),
    enabled: !!id,
  });

  const owner = ownerQuery.data;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', phone: '', email: '' },
  });

  useEffect(() => {
    if (owner) {
      form.reset({
        full_name: owner.full_name,
        phone: owner.phone ?? '',
        email: owner.emailDisplay ?? '',
      });
    }
  }, [owner, form]);

  const saveMu = useMutation({
    mutationFn: (v: FormValues) =>
      updateOwner(id!, {
        full_name: v.full_name.trim(),
        phone: v.phone?.trim() || null,
        email: v.email.trim(),
      }),
    onSuccess: () => {
      toast.success('Đã lưu hồ sơ');
      qc.invalidateQueries({ queryKey: ['super-admin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!id) return null;

  if (ownerQuery.isLoading) {
    return (
      <div className="rounded-[28px] border border-border/70 bg-card p-12 text-center text-muted">
        Đang tải...
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="rounded-[28px] border border-border/70 bg-card p-12 text-center text-muted">
        Không tìm thấy Owner.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/super-admin/owners"
        className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-bold text-foreground hover:border-primary/25"
      >
        <ArrowLeft size={16} />
        Danh sách Owner
      </Link>

      <section className="rounded-[32px] border border-border/70 bg-card p-6 shadow-[0_24px_72px_-48px_rgba(15,23,42,0.45)] sm:p-8">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Shield size={26} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-secondary">Owner</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground">{owner.full_name}</h1>
            <p className="mt-2 text-sm text-muted">
              Email (prefs):{' '}
              <span className="font-mono text-foreground">{owner.emailDisplay ?? '—'}</span>
            </p>
            <p className="text-sm text-muted">
              Tổ chức: <span className="text-foreground">{owner.organizationName ?? '—'}</span>
            </p>
          </div>
        </div>

        <form
          className="mt-8 grid max-w-lg gap-4"
          onSubmit={form.handleSubmit((v) => saveMu.mutate(v))}
        >
          <div>
            <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-muted">
              Họ tên
            </label>
            <Input {...form.register('full_name')} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-muted">
              Điện thoại
            </label>
            <Input {...form.register('phone')} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-muted">
              Email đăng nhập / liên hệ
            </label>
            <Input type="email" {...form.register('email')} />
          </div>
          <Button type="submit" isLoading={saveMu.isPending}>
            Lưu thay đổi
          </Button>
        </form>

        <div className="mt-10 border-t border-border/70 pt-8">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary">Thao tác</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={async () => {
                if (!owner.emailDisplay) {
                  toast.error('Không có email để gửi reset');
                  return;
                }
                try {
                  await sendOwnerPasswordReset(owner.emailDisplay);
                  toast.success('Đã gửi email đặt lại mật khẩu');
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Lỗi');
                }
              }}
            >
              Gửi reset mật khẩu
            </Button>
            {owner.is_active !== false ? (
              <Button
                variant="danger"
                type="button"
                onClick={async () => {
                  if (confirm('Vô hiệu hóa tài khoản này?')) {
                    try {
                      await setOwnerActive(owner.id, false);
                      toast.success('Đã vô hiệu hóa');
                      qc.invalidateQueries({ queryKey: ['super-admin'] });
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Lỗi');
                    }
                  }
                }}
              >
                Vô hiệu hóa
              </Button>
            ) : (
              <Button
                variant="success"
                type="button"
                onClick={async () => {
                  try {
                    await setOwnerActive(owner.id, true);
                    toast.success('Đã kích hoạt');
                    qc.invalidateQueries({ queryKey: ['super-admin'] });
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Lỗi');
                  }
                }}
              >
                Kích hoạt lại
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-border/70 bg-card p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.34)]">
        <h2 className="text-xl font-black tracking-tight text-foreground">Nhật ký hoạt động</h2>
        <p className="mt-1 text-sm text-muted">Các sự kiện audit gần đây của người dùng này.</p>
        <ul className="mt-6 space-y-2">
          {logsQuery.isLoading ? (
            <li className="text-muted">Đang tải...</li>
          ) : (logsQuery.data ?? []).length === 0 ? (
            <li className="text-muted">Chưa có nhật ký.</li>
          ) : (
            logsQuery.data!.map((log) => (
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
      </section>
    </div>
  );
};

export default OwnerDetail;
