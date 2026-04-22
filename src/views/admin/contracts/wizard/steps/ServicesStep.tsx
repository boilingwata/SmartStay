import React from 'react';
import { Settings, UserCheck, Zap } from 'lucide-react';
import { formatVND } from '@/utils';
import type { Service, UtilityPolicy } from '../contractWizardShared';
import { useContractWizard } from '../useContractWizard';

interface ServicesStepProps {
  services: Service[];
  utilityPolicies: UtilityPolicy[];
}

export function ServicesStep({ services, utilityPolicies }: ServicesStepProps) {
  const { form } = useContractWizard();
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const selectedServiceIds = watch('selectedServices') || [];
  const utilityPolicyId = watch('utilityPolicyId');

  const toggleService = (id: string) => {
    if (selectedServiceIds.includes(id)) {
      setValue(
        'selectedServices',
        selectedServiceIds.filter((serviceId: string) => serviceId !== id)
      );
      return;
    }

    setValue('selectedServices', [...selectedServiceIds, id]);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-slate-700" />
          <div>
            <h2 className="text-base font-bold text-slate-950">5. Dịch vụ đi kèm</h2>
            <p className="text-sm text-slate-500">Chọn các khoản thu cố định cần đi cùng hợp đồng ngay từ đầu.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {services.map((service) => {
            const id = String(service.serviceId);
            const isSelected = selectedServiceIds.includes(id);

            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleService(id)}
                className={`rounded-[24px] border p-4 text-left transition ${
                  isSelected ? 'border-slate-950 bg-slate-950 text-white shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{service.serviceName}</p>
                    <p className={isSelected ? 'mt-1 text-xs text-slate-300' : 'mt-1 text-xs text-slate-500'}>
                      {service.billingMethod === 'PerPerson' ? 'Tính theo đầu người' : 'Tính cố định theo kỳ'}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${isSelected ? 'bg-white text-slate-950' : 'bg-slate-100 text-slate-700'}`}>
                    {isSelected ? 'Đã chọn' : 'Chọn'}
                  </span>
                </div>
                <p className="mt-4 text-sm font-semibold">
                  {formatVND(service.currentPrice)} / {service.unit}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-slate-700" />
          <div>
            <h2 className="text-base font-bold text-slate-950">6. Chính sách điện nước</h2>
            <p className="text-sm text-slate-500">Chọn đúng chính sách để hệ thống tính phí đúng ngay từ kỳ đầu tiên.</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <select
            value={utilityPolicyId}
            onChange={(event) => setValue('utilityPolicyId', event.target.value, { shouldValidate: true })}
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
          >
            <option value="">Chọn chính sách điện nước</option>
            {utilityPolicies.map((policy) => (
              <option key={policy.id} value={String(policy.id)}>
                {policy.name}
              </option>
            ))}
          </select>
          {errors.utilityPolicyId ? <p className="text-xs font-medium text-rose-600">{errors.utilityPolicyId.message}</p> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              <p className="font-semibold text-slate-950">Điện</p>
              Tùy chính sách bạn chọn, hệ thống có thể tính theo gói hoặc theo tài sản/phí cấu phần của phòng.
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              <p className="font-semibold text-slate-950">Nước</p>
              Nếu chính sách tính theo đầu người, số người đang cư trú sẽ được đồng bộ từ danh sách người ở cùng của hợp đồng.
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <UserCheck size={18} className="text-slate-700" />
          <div>
            <h2 className="text-base font-bold text-slate-950">7. Người đại diện bên cho thuê</h2>
            <p className="text-sm text-slate-500">Thông tin này sẽ đi kèm phần xác nhận pháp lý ở bước cuối.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Họ tên</label>
            <input {...register('ownerRep.fullName')} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-300 focus:bg-white" />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">CCCD</label>
            <input {...register('ownerRep.cccd')} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-300 focus:bg-white" />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Vai trò</label>
            <input {...register('ownerRep.role')} readOnly className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-500 outline-none" />
          </div>
        </div>
      </section>
    </div>
  );
}
