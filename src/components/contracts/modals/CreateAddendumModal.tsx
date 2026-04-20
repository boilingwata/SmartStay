import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, FilePlus, Upload, X } from 'lucide-react';
import { cn } from '@/utils';
import { toast } from 'sonner';
import portalAddendumService from '@/services/portalAddendumService';

interface CreateAddendumModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: { id: string; contractCode: string } | null;
}

export const CreateAddendumModal = ({ isOpen, onClose, contract }: CreateAddendumModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    contractId: Number(contract?.id),
    addendumCode: '',
    type: 'AssetRepricing',
    title: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    status: 'Draft',
    fileUrl: '',
    content: '',
  });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isOpen || !contract) return;
    setFormData({
      contractId: Number(contract.id),
      addendumCode: '',
      type: 'AssetRepricing',
      title: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      status: 'Draft',
      fileUrl: '',
      content: '',
    });
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
      toast.success('Da tai tep len thanh cong');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Vui long nhap tieu de phu luc');
      return;
    }

    if (isSignedWithoutFile) {
      toast.error('Trang thai da ky yeu cau file scan neu ban muon luu kem');
      return;
    }

    try {
      await portalAddendumService.createAddendum({
        contractId: formData.contractId,
        addendumCode: formData.addendumCode,
        type: formData.type as any,
        title: formData.title,
        content: formData.content,
        effectiveDate: formData.effectiveDate,
        status: formData.status as any,
        fileUrl: formData.fileUrl || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ['contract', contract.id] });
      await queryClient.invalidateQueries({ queryKey: ['contract-addendums-admin'] });
      await queryClient.invalidateQueries({ queryKey: ['portal-active-contract'] });
      toast.success('Da luu phu luc hop dong');
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

      <div className="relative w-full max-w-[700px] overflow-hidden rounded-3xl border border-border bg-white shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between border-b p-6">
          <h2 className="flex items-center gap-2 text-h2 text-primary">
            <FilePlus size={24} /> Tao phu luc hop dong
          </h2>
          <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-bg">
            <X size={20} />
          </button>
        </div>

        <div className="custom-scrollbar max-h-[70vh] space-y-6 overflow-y-auto p-8">
          {isSignedWithoutFile ? (
            <div className="flex gap-3 rounded-2xl border border-danger/20 bg-danger/5 p-4">
              <AlertCircle className="shrink-0 text-danger" size={20} />
              <p className="text-small font-bold uppercase text-danger">
                File scan la tuy chon, nhung neu danh dau da ky thi nen dinh kem de doi soat de hon.
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-small font-bold text-muted">Ma phu luc</label>
              <input type="text" className="input-base w-full font-mono font-bold" value={formData.addendumCode} readOnly />
            </div>
            <div className="space-y-1.5">
              <label className="text-small font-bold text-muted">Loai phu luc</label>
              <select
                className="input-base w-full"
                value={formData.type}
                onChange={(event) => setFormData((current) => ({ ...current, type: event.target.value }))}
              >
                <option value="AssetAssignment">Bo sung tai san tinh phi</option>
                <option value="AssetRepricing">Dieu chinh gia tai san</option>
                <option value="AssetStatusChange">Dung/tam dung tinh phi tai san</option>
                <option value="RentChange">Thay doi gia thue</option>
                <option value="ServiceChange">Thay doi dich vu</option>
                <option value="RoomChange">Thay doi phong</option>
                <option value="PolicyUpdate">Thay doi chinh sach</option>
                <option value="Other">Khac</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-small font-bold text-muted">Tieu de phu luc</label>
            <input
              type="text"
              className="input-base w-full"
              placeholder="VD: Dieu chinh phu phi dieu hoa tu 05/2026"
              value={formData.title}
              onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-small font-bold text-muted">Noi dung</label>
            <textarea
              className="input-base min-h-[140px] w-full py-4"
              placeholder="Mo ta ro thay doi ap dung cho hop dong nay."
              value={formData.content}
              onChange={(event) => setFormData((current) => ({ ...current, content: event.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-small font-bold text-muted">Ngay hieu luc</label>
              <input
                type="date"
                className="input-base w-full"
                value={formData.effectiveDate}
                onChange={(event) => setFormData((current) => ({ ...current, effectiveDate: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-small font-bold text-muted">Trang thai</label>
              <select
                className={cn('input-base w-full font-bold', formData.status === 'Signed' ? 'text-success' : 'text-primary')}
                value={formData.status}
                onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="Draft">Ban nhap</option>
                <option value="Signed">Da ky</option>
                <option value="Cancelled">Da huy</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-small font-bold text-muted">Tai lieu dinh kem</label>
            <div
              className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-all',
                formData.fileUrl ? 'border-success bg-success/5' : 'border-border hover:border-primary/30'
              )}
            >
              {formData.fileUrl ? (
                <>
                  <Check className="text-success" size={32} />
                  <p className="max-w-full truncate text-small font-bold text-success">{formData.fileUrl.split('/').pop()}</p>
                  <button
                    onClick={() => setFormData((current) => ({ ...current, fileUrl: '' }))}
                    className="text-[10px] font-bold uppercase text-danger underline"
                  >
                    Xoa file
                  </button>
                </>
              ) : isUploading ? (
                <>
                  <div className="animate-spin text-primary">
                    <Upload size={32} />
                  </div>
                  <p className="text-small font-bold italic text-primary">Dang tai tep len...</p>
                </>
              ) : (
                <>
                  <Upload className="text-muted/30" size={32} />
                  <p className="text-center text-small font-medium text-muted">Tai len PDF, DOC hoac DOCX neu can luu ban ky.</p>
                  <label className="btn-outline relative mt-2 cursor-pointer overflow-hidden">
                    Chon tep
                    <input type="file" className="absolute inset-0 cursor-pointer opacity-0" onChange={handleFileUpload} accept=".pdf,.doc,.docx" />
                  </label>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t bg-bg/50 p-6">
          <button onClick={onClose} className="btn-outline">Huy bo</button>
          <button
            onClick={handleSubmit}
            disabled={isUploading || isSignedWithoutFile}
            className={cn('btn-primary', (isUploading || isSignedWithoutFile) && 'cursor-not-allowed opacity-50 grayscale')}
          >
            Luu phu luc
          </button>
        </div>
      </div>
    </div>
  );
};
