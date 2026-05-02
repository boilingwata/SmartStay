import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import amenityAdminService, { type AmenityPolicyFormInput } from '@/services/amenityAdminService';
import { SidePanel } from '@/components/ui/SidePanel';
import AmenityPolicyFormFields from './AmenityPolicyFormFields';
import { createPolicyForm, createPolicyRulesForm, buildPolicyRulesJson, type AmenityRulesFormState } from './formUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  optionsQuery: any;
}

export default function AmenityPolicyCreateSheet({ isOpen, onClose, optionsQuery }: Props) {
  const queryClient = useQueryClient();
  const [policyForm, setPolicyForm] = useState<AmenityPolicyFormInput>(createPolicyForm());
  const [policyRules, setPolicyRules] = useState<AmenityRulesFormState>(createPolicyRulesForm());

  const resetForm = () => {
    setPolicyForm(createPolicyForm());
    setPolicyRules(createPolicyRulesForm());
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...policyForm, rulesJson: buildPolicyRulesJson(policyRules) };
      return amenityAdminService.createPolicy(payload);
    },
    onSuccess: () => {
      toast.success('Đã tạo chính sách tiện ích mới thành công.');
      resetForm();
      onClose();
      queryClient.invalidateQueries({ queryKey: ['amenity-policies'] });
      queryClient.invalidateQueries({ queryKey: ['amenity-dashboard'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể tạo chính sách.'),
  });

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={handleClose}
      title="Tạo chính sách mới"
      icon={<Plus size={20} />}
      footer={
        <div className="flex w-full gap-3">
          <button onClick={handleClose} className="h-12 flex-1 rounded-xl border border-border bg-background font-bold text-foreground transition-colors hover:bg-muted">
            Hủy
          </button>
          <button 
            disabled={createMutation.isPending} 
            onClick={() => createMutation.mutate()} 
            className="h-12 flex-1 rounded-xl bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-[0.98] hover:bg-primary/90 disabled:opacity-70"
          >
            {createMutation.isPending ? 'Đang tạo...' : 'Lưu chính sách'}
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
