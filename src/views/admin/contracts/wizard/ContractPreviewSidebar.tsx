import React from 'react';
import { Building2, Calendar, FileText, ShieldCheck, Users } from 'lucide-react';
import {
  formatContractDateRange,
  getPaymentCycleSummary,
  type Room,
  type Service,
  type TenantSummary,
  type UtilityPolicy,
} from './contractWizardShared';
import { formatVND } from '@/utils';
import { useContractWizard } from './useContractWizard';

interface ContractPreviewSidebarProps {
  rooms: Room[];
  tenants: TenantSummary[];
  services: Service[];
  utilityPolicies: UtilityPolicy[];
}

export function ContractPreviewSidebar({ rooms, tenants, services, utilityPolicies }: ContractPreviewSidebarProps) {
  const { form } = useContractWizard();
  const values = form.watch();

  const selectedRoom = rooms.find((room) => room.id === values.roomId);
  const selectedTenant = tenants.find((tenant) => tenant.id === values.primaryTenantId);
  const selectedUtilityPolicy = utilityPolicies.find((policy) => String(policy.id) === String(values.utilityPolicyId));
  const selectedServices = services.filter((service) => (values.selectedServices || []).includes(String(service.serviceId)));
  const serviceTotal = selectedServices.reduce((sum, service) => sum + service.currentPrice, 0);

  const items = [
    {
      icon: Building2,
      label: 'Phòng và tòa nhà',
      value: selectedRoom ? `${selectedRoom.roomCode} • ${selectedRoom.buildingName}` : 'Chưa chọn phòng',
      note: selectedRoom ? `Giá niêm yết ${formatVND(selectedRoom.baseRentPrice)}` : 'Chọn đúng phòng trước khi tiếp tục',
    },
    {
      icon: Users,
      label: 'Người thuê',
      value: selectedTenant?.fullName || 'Chưa chọn người đứng tên',
      note: values.occupantIds?.length ? `${values.occupantIds.length} người ở cùng` : 'Chưa có người ở cùng',
    },
    {
      icon: Calendar,
      label: 'Thời hạn',
      value: formatContractDateRange(values.startDate, values.endDate),
      note: getPaymentCycleSummary(values.paymentCycle),
    },
    {
      icon: FileText,
      label: 'Điện nước',
      value: selectedUtilityPolicy?.name || 'Chưa chọn chính sách',
      note: selectedServices.length ? `${selectedServices.length} dịch vụ cố định đi kèm` : 'Chưa chọn dịch vụ đi kèm',
    },
  ];

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-950">Tóm tắt trước khi tạo</h3>
            <p className="text-sm text-slate-500">Tự cập nhật theo dữ liệu đang nhập</p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
            <FileText size={18} />
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {items.map((item) => (
            <div key={item.label} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <item.icon size={14} className="text-slate-400" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-950">{item.value}</p>
              {item.note ? <p className="mt-1 text-xs text-slate-500">{item.note}</p> : null}
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[20px] border border-slate-200 bg-slate-950 p-4 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Tổng thu cố định dự kiến mỗi kỳ</p>
          <p className="mt-2 text-2xl font-black tracking-tight">{formatVND((values.rentPrice || 0) + serviceTotal)}</p>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-slate-700" />
          <h4 className="text-sm font-bold text-slate-950">Checklist trước khi bấm tạo</h4>
        </div>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          <li>Người đứng tên phải là người chịu trách nhiệm chính về pháp lý và thanh toán.</li>
          <li>Giá thuê và tiền cọc ở bước 2 sẽ được chụp lại vào hợp đồng tại thời điểm tạo.</li>
          <li>Chỉ hoàn tất khi bạn đã kiểm tra đủ hồ sơ pháp lý và điều kiện cho thuê.</li>
        </ul>
      </section>
    </div>
  );
}
