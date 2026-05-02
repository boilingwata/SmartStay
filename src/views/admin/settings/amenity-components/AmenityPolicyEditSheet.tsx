import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import amenityAdminService, { type AmenityPolicyFormInput, type AmenityPolicyRecord } from '@/services/amenityAdminService';
import { SidePanel } from '@/components/ui/SidePanel';
import AmenityPolicyFormFields from './AmenityPolicyFormFields';
import { parsePolicyRulesForm, buildPolicyRulesJson, type AmenityRulesFormState, createPolicyForm, createPolicyRulesForm } from './formUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  policy: AmenityPolicyRecord | null;
  optionsQuery: any;
}

export default function AmenityPolicyEditSheet({ isOpen, onClose, policy, optionsQuery }: Props) {
  const queryClient = useQueryClient();
  const [policyForm, setPolicyForm] = useState<AmenityPolicyFormInput>(createPolicyForm());
  const [policyRules, setPolicyRules] = useState<AmenityRulesFormState>(createPolicyRulesForm());

  useEffect(() => {
    if (isOpen && policy) {
      setPolicyForm({
        code: policy.code,
        name: policy.name,
        serviceId: policy.serviceId,
        buildingId: policy.buildingId,
        bookingMode: policy.bookingMode,
        chargeMode: policy.chargeMode,
        status: policy.status,
        slotGranularityMinutes: policy.slotGranularityMinutes,
        maxCapacityPerSlot: policy.maxCapacityPerSlot,
        maxAdvanceDays: policy.maxAdvanceDays,
        cancellationCutoffHours: policy.cancellationCutoffHours,
        autoCompleteAfterMinutes: policy.autoCompleteAfterMinutes,
        allowWaitlist: policy.allowWaitlist,
        requiresStaffApproval: policy.requiresStaffApproval,
        requiresCheckin: policy.requiresCheckin,
        priceOverrideAmount: policy.priceOverrideAmount,
        activeFrom: policy.activeFrom,
        activeTo: policy.activeTo,
        notes: policy.notes,
        rulesJson: policy.rulesJson,
        changeSummary: 'Điều chỉnh từ trang quản trị',
      });
      setPolicyRules(parsePolicyRulesForm(policy.rulesJson));
    }
  }, [isOpen, policy]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!policy) throw new Error('Không tìm thấy chính sách để cập nhật.');
      const payload = { ...policyForm, rulesJson: buildPolicyRulesJson(policyRules) };
      return amenityAdminService.updatePolicy(policy.id, payload);
    },
    onSuccess: () => {
      toast.success('Đã cập nhật chính sách tiện ích.');
      onClose();
      queryClient.invalidateQueries({ queryKey: ['amenity-policies'] });
      queryClient.invalidateQueries({ queryKey: ['amenity-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['amenity-policy-versions'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể lưu chính sách.'),
  });

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa chính sách"
      icon={<Pencil size={20} />}
      footer={
        <div className="flex w-full gap-3">
          <button onClick={onClose} className="h-12 flex-1 rounded-xl border border-border bg-background font-bold text-foreground transition-colors hover:bg-muted">
            Hủy
          </button>
          <button 
            disabled={updateMutation.isPending} 
            onClick={() => updateMutation.mutate()} 
            className="h-12 flex-1 rounded-xl bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-[0.98] hover:bg-primary/90 disabled:opacity-70"
          >
            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu cập nhật'}
          </button>
        </div>
      }
    >
      <AmenityPolicyFormFields 
        policyForm={policyForm}
        setPolicyForm={setPolicyForm}
        policyRules={policyRules}
        setPolicyRules={setPolicyRules}
        optionsQuery={optionsQuery}
      />
    </SidePanel>
  );
}
