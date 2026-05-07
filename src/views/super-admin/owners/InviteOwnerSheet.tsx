import React, { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SidePanel } from '@/components/ui/SidePanel';
import { listOrganizations } from '@/services/superAdmin/organizationsService';
import { inviteOwnerToOrganization } from '@/services/superAdmin/ownerAccountsService';

const schema = z.object({
  organizationId: z.string().min(1, 'Chọn tổ chức'),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface InviteOwnerSheetProps {
  open: boolean;
  onClose: () => void;
  onInvited?: () => void;
}

export const InviteOwnerSheet: React.FC<InviteOwnerSheetProps> = ({ open, onClose, onInvited }) => {
  const { data: orgs = [] } = useQuery({
    queryKey: ['super-admin', 'organizations', 'invite-picker'],
    queryFn: () => listOrganizations({ status: 'active' }),
    enabled: open,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      organizationId: '',
      fullName: '',
      email: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (open && orgs.length && !form.getValues('organizationId')) {
      form.setValue('organizationId', orgs[0]!.id);
    }
  }, [open, orgs, form]);

  const mutation = useMutation({
    mutationFn: (v: FormValues) =>
      inviteOwnerToOrganization({
        organizationId: v.organizationId,
        fullName: v.fullName.trim(),
        email: v.email.trim(),
        phone: v.phone?.trim(),
        memberRole: 'owner',
      }),
    onSuccess: () => {
      toast.success('Đã tạo tài khoản Owner và gán vào tổ chức');
      onInvited?.();
      onClose();
      form.reset();
    },
    onError: (e: Error) => toast.error(e.message || 'Không thể mời Owner'),
  });

  return (
    <SidePanel
      isOpen={open}
      onClose={onClose}
      title="Mời Owner"
      icon={<UserPlus className="h-5 w-5" />}
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
            Tạo & gán
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-muted">
            Tổ chức
          </label>
          <select
            {...form.register('organizationId')}
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm"
          >
            <option value="">— Chọn —</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-muted">
            Họ tên
          </label>
          <Input {...form.register('fullName')} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-muted">
            Email
          </label>
          <Input type="email" {...form.register('email')} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-muted">
            Điện thoại
          </label>
          <Input {...form.register('phone')} />
        </div>
      </form>
    </SidePanel>
  );
};

export default InviteOwnerSheet;
