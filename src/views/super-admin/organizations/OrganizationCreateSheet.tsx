import React, { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SidePanel } from '@/components/ui/SidePanel';
import {
  createOrganization,
  setPrimaryOwner,
  inviteOwnerToOrganization,
} from '@/services/superAdmin';
import { listPlans } from '@/services/superAdmin/subscriptionPlansService';

const schema = z.object({
  name: z.string().min(2, 'Tên tổ chức quá ngắn'),
  slug: z.string().optional(),
  description: z.string().optional(),
  plan_id: z.string().min(1, 'Chọn gói dịch vụ'),
  primary_owner_full_name: z.string().min(2, 'Họ tên chủ sở hữu'),
  primary_owner_email: z.string().email('Email không hợp lệ'),
  primary_owner_phone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface OrganizationCreateSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const OrganizationCreateSheet: React.FC<OrganizationCreateSheetProps> = ({
  open,
  onClose,
  onCreated,
}) => {
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['super-admin', 'subscription-plans'],
    queryFn: () => listPlans(true),
    enabled: open,
  });

  const defaultPlanId = useMemo(() => plans.find((p) => p.slug === 'free')?.id ?? plans[0]?.id ?? '', [plans]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      plan_id: '',
      primary_owner_full_name: '',
      primary_owner_email: '',
      primary_owner_phone: '',
    },
  });

  React.useEffect(() => {
    if (open && defaultPlanId && !form.getValues('plan_id')) {
      form.setValue('plan_id', defaultPlanId);
    }
  }, [open, defaultPlanId, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const org = await createOrganization({
        name: values.name,
        slug: values.slug?.trim() || undefined,
        description: values.description?.trim() || null,
        plan_id: values.plan_id,
      });

      const { ownerId } = await inviteOwnerToOrganization({
        fullName: values.primary_owner_full_name.trim(),
        email: values.primary_owner_email.trim(),
        phone: values.primary_owner_phone?.trim(),
        organizationId: org.id,
        memberRole: 'owner',
      });

      await setPrimaryOwner(org.id, ownerId);
      return org.id;
    },
    onSuccess: () => {
      toast.success('Đã tạo tổ chức và tài khoản chủ sở hữu');
      onCreated?.();
      onClose();
      form.reset();
    },
    onError: (e: Error) => {
      toast.error(e.message || 'Không thể tạo tổ chức');
    },
  });

  return (
    <SidePanel
      isOpen={open}
      onClose={onClose}
      title="Tạo tổ chức mới"
      icon={<Building2 className="h-5 w-5" />}
      footer={
        <div className="flex w-full gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            className="flex-1"
            isLoading={mutation.isPending}
            onClick={form.handleSubmit((v) => mutation.mutate(v))}
          >
            Tạo & mời chủ nhà
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-muted">
            Tên tổ chức
          </label>
          <Input {...form.register('name')} placeholder="VD: Công ty ABC" />
          {form.formState.errors.name ? (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-muted">
            Slug (tuỳ chọn)
          </label>
          <Input {...form.register('slug')} placeholder="abc-jsc — để trống để tự sinh" />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-muted">
            Mô tả
          </label>
          <textarea
            {...form.register('description')}
            rows={3}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/30"
            placeholder="Ghi chú nội bộ"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-muted">
            Gói dịch vụ
          </label>
          <select
            {...form.register('plan_id')}
            disabled={plansLoading}
            className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <option value="">— Chọn —</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {form.formState.errors.plan_id ? (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.plan_id.message}</p>
          ) : null}
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-secondary">
            Chủ sở hữu chính
          </p>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-muted">
                Họ tên
              </label>
              <Input {...form.register('primary_owner_full_name')} />
              {form.formState.errors.primary_owner_full_name ? (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.primary_owner_full_name.message}
                </p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-muted">
                Email đăng nhập
              </label>
              <Input type="email" {...form.register('primary_owner_email')} />
              {form.formState.errors.primary_owner_email ? (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.primary_owner_email.message}
                </p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-muted">
                Điện thoại
              </label>
              <Input {...form.register('primary_owner_phone')} />
            </div>
          </div>
        </div>
      </form>
    </SidePanel>
  );
};

export default OrganizationCreateSheet;
