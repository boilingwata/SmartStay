import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, FilePlus, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { ADDENDUM_STATUS_OPTIONS, ADDENDUM_TYPE_OPTIONS } from '@/lib/contractPresentation';
import type { ContractAddendum } from '@/models/Contract';
import portalAddendumService from '@/services/portalAddendumService';
import { cn } from '@/utils';

interface CreateAddendumModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: { id: string; contractCode: string } | null;
}

interface CreateAddendumFormState {
  contractId: number;
  addendumCode: string;
  type: ContractAddendum['type'];
  title: string;
  effectiveDate: string;
  status: ContractAddendum['status'];
  fileUrl: string;
  content: string;
}

function taoGiaTriMacDinh(contractId?: string): CreateAddendumFormState {
  return {
    contractId: Number(contractId ?? 0),
    addendumCode: '',
    type: 'RentChange',
    title: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    status: 'Draft',
    fileUrl: '',
    content: '',
  };
}

export function CreateAddendumModal({ isOpen, onClose, contract }: CreateAddendumModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateAddendumFormState>(taoGiaTriMacDinh(contract?.id));
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isOpen || !contract) return;
    setFormData(taoGiaTriMacDinh(contract.id));
  }, [contract, isOpen]);

  if (!isOpen || !contract) return null;

  const isSignedWithoutFile = formData.status === 'Signed' && !formData.fileUrl;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await portalAddendumService.uploadAddendumFile(file);
      setFormData((current) => ({ ...current, fileUrl: url }));
      toast.success('Đã tải tệp phụ lục lên thành công.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải tệp phụ lục.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề phụ lục.');
      return;
    }

    try {
      await portalAddendumService.createAddendum({
        contractId: formData.contractId,
        addendumCode: formData.addendumCode,
        type: formData.type,
        title: formData.title,
        content: formData.content,
        effectiveDate: formData.effectiveDate,
        status: formData.status,
        fileUrl: formData.fileUrl || undefined,
      });

      await queryClient.invalidateQueries({ queryKey: ['contract', contract.id] });
      await queryClient.invalidateQueries({ queryKey: ['contract-addendums-admin'] });
      await queryClient.invalidateQueries({ queryKey: ['portal-active-contract'] });
      toast.success('Đã lưu phụ lục hợp đồng.');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu phụ lục hợp đồng.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-[720px] overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-8 py-6">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900">
              <FilePlus size={24} className="text-blue-500" />
              Lập phụ lục hợp đồng
            </h2>
            <p className="mt-1 text-xs font-black uppercase tracking-widest text-slate-400">{contract.contractCode}</p>
          </div>

          <button type="button" onClick={onClose} className="rounded-2xl p-3 text-slate-400 transition-all hover:bg-white hover:text-slate-900 hover:shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="custom-scrollbar max-h-[70vh] space-y-8 overflow-y-auto p-8">
          {isSignedWithoutFile ? (
            <div className="flex gap-4 rounded-2xl border border-rose-100 bg-rose-50/50 p-5">
              <AlertCircle className="shrink-0 text-rose-500" size={20} />
              <p className="text-xs font-bold leading-relaxed text-rose-800">
                Bạn đang chọn trạng thái “Đã ký” nhưng chưa đính kèm tệp. Hệ thống vẫn cho phép lưu, nhưng nên tải bản ký lên để dễ đối soát về sau.
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Loại phụ lục</label>
              <select
                className="input-base h-12 w-full rounded-2xl border-slate-100 font-bold"
                value={formData.type}
                onChange={(event) => setFormData((current) => ({ ...current, type: event.target.value as ContractAddendum['type'] }))}
              >
                {ADDENDUM_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Tình trạng hồ sơ</label>
              <select
                className="input-base h-12 w-full rounded-2xl border-slate-100 font-black"
                value={formData.status}
                onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value as ContractAddendum['status'] }))}
              >
                {ADDENDUM_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Tiêu đề phụ lục</label>
            <input
              type="text"
              className="input-base h-12 w-full rounded-2xl border-slate-100 font-bold"
              placeholder="Ví dụ: Điều chỉnh giá thuê từ tháng 05/2026"
              value={formData.title}
              onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Nội dung tóm tắt</label>
            <textarea
              className="input-base min-h-[140px] w-full rounded-2xl border-slate-100 p-4 font-medium leading-relaxed"
              placeholder="Mô tả rõ thay đổi nào bắt đầu áp dụng, cho ai và từ thời điểm nào"
              value={formData.content}
              onChange={(event) => setFormData((current) => ({ ...current, content: event.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Ngày hiệu lực</label>
              <input
                type="date"
                className="input-base h-12 w-full rounded-2xl border-slate-100 font-bold"
                value={formData.effectiveDate}
                onChange={(event) => setFormData((current) => ({ ...current, effectiveDate: event.target.value }))}
              />
            </div>

            <div className="flex flex-col justify-end space-y-2">
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nguồn tạo</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Thủ công</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Tệp đính kèm</label>
            <div
              className={cn(
                'flex flex-col items-center justify-center gap-4 rounded-[32px] border-2 border-dashed p-10 transition-all duration-300',
                formData.fileUrl ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 bg-slate-50/30 hover:border-blue-200 hover:bg-blue-50/30'
              )}
            >
              {formData.fileUrl ? (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm">
                    <Check size={32} />
                  </div>
                  <div className="text-center">
                    <p className="max-w-[300px] truncate text-sm font-black text-slate-900">{formData.fileUrl.split('/').pop()}</p>
                    <button
                      type="button"
                      onClick={() => setFormData((current) => ({ ...current, fileUrl: '' }))}
                      className="mt-2 text-[10px] font-black uppercase tracking-widest text-rose-500 transition-colors hover:text-rose-700"
                    >
                      Xóa tệp và chọn lại
                    </button>
                  </div>
                </>
              ) : isUploading ? (
                <>
                  <div className="animate-spin text-blue-500">
                    <Upload size={40} />
                  </div>
                  <p className="animate-pulse text-sm font-black uppercase tracking-widest text-slate-400">Đang tải tệp lên...</p>
                </>
              ) : (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-200 shadow-sm">
                    <Upload size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-slate-900">Chọn tệp phụ lục</p>
                    <p className="mt-1 text-xs font-medium text-slate-400">Hỗ trợ PDF, DOC, DOCX, JPG, PNG tối đa 10MB</p>
                  </div>
                  <label className="mt-4 inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-8 text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm transition-all hover:border-slate-900 hover:text-slate-900">
                    Chọn tệp
                    <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                  </label>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 border-t border-slate-50 bg-slate-50/30 px-8 py-6">
          <button type="button" onClick={onClose} className="h-12 rounded-2xl px-6 text-xs font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-900">
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isUploading}
            className="inline-flex h-12 items-center gap-3 rounded-2xl bg-slate-900 px-10 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-slate-200 transition-all hover:bg-blue-600 disabled:opacity-50"
          >
            <Check size={18} />
            {isUploading ? 'Đang lưu...' : 'Lưu phụ lục'}
          </button>
        </div>
      </div>
    </div>
  );
}
