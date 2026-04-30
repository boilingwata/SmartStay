import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Layers,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Download,
  Info,
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { cn, formatVND } from '@/utils';
import { toast } from 'sonner';
import {
  invoiceService,
  type BulkInvoiceCreateResult,
  type BulkInvoiceInput,
  type BulkInvoicePreviewRow,
} from '@/services/invoiceService';

interface BulkInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (result: BulkInvoiceCreateResult) => void;
}

const defaultForm = (): BulkInvoiceInput => ({
  monthYear: new Date().toISOString().slice(0, 7),
  dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  buildingId: '',
});

const statusBadgeClasses: Record<BulkInvoicePreviewRow['status'], string> = {
  ready: 'bg-success/10 text-success',
  blocked: 'bg-danger/10 text-danger',
  duplicate: 'bg-slate-200 text-slate-700',
  error: 'bg-danger/10 text-danger',
};

const statusLabels: Record<BulkInvoicePreviewRow['status'], string> = {
  ready: 'Sẵn sàng',
  blocked: 'Bị chặn',
  duplicate: 'Đã tồn tại',
  error: 'Lỗi dữ liệu',
};

export const BulkInvoiceModal = ({ isOpen, onClose, onCreated }: BulkInvoiceModalProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<BulkInvoiceInput>(defaultForm);
  const [previewRows, setPreviewRows] = useState<BulkInvoicePreviewRow[]>([]);
  const [selectedContractIds, setSelectedContractIds] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BulkInvoiceCreateResult | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setFormData(defaultForm());
    setPreviewRows([]);
    setSelectedContractIds([]);
    setProgress(0);
    setResult(null);
  }, [isOpen]);

  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ['invoice-create-contracts'],
    queryFn: () => invoiceService.getCreateInvoiceContracts(),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  const buildingOptions = useMemo(() => {
    const seen = new Map<string, { id: string; name: string }>();
    for (const contract of contracts) {
      if (!contract.buildingId || !contract.buildingName || seen.has(contract.buildingId)) continue;
      seen.set(contract.buildingId, { id: contract.buildingId, name: contract.buildingName });
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [contracts]);

  const eligibleRows = previewRows.filter((row) => row.canCreate);
  const readyCount = previewRows.filter((row) => row.status === 'ready').length;
  const blockedCount = previewRows.filter((row) => row.status === 'blocked').length;
  const duplicateCount = previewRows.filter((row) => row.status === 'duplicate').length;
  const errorCount = previewRows.filter((row) => row.status === 'error').length;
  const selectedRows = eligibleRows.filter((row) => selectedContractIds.includes(row.contract.id));

  const previewMutation = useMutation({
    mutationFn: (payload: BulkInvoiceInput) => invoiceService.previewBulkInvoices(payload),
    onSuccess: (rows) => {
      setPreviewRows(rows);
      setSelectedContractIds(rows.filter((row) => row.canCreate).map((row) => row.contract.id));
      setStep(2);
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: BulkInvoiceInput & { contractIds: string[] }) =>
      invoiceService.createBulkInvoices({
        ...payload,
        onProgress: (completed, total) => {
          setProgress(total === 0 ? 100 : Math.round((completed / total) * 100));
        },
      }),
    onSuccess: (bulkResult) => {
      setResult(bulkResult);
      setProgress(100);
      onCreated?.(bulkResult);

      if (bulkResult.created.length > 0) {
        toast.success(`Đã tạo ${bulkResult.created.length} hóa đơn.`);
      } else {
        toast.error('Không tạo được hóa đơn nào.');
      }
    },
  });

  if (!isOpen) return null;

  const isGenerating = createMutation.isPending;
  const allEligibleSelected = eligibleRows.length > 0 && selectedContractIds.length === eligibleRows.length;
  const totalPreviewAmount = selectedRows.reduce((sum, row) => sum + (row.preview?.totalAmount ?? 0), 0);

  const handlePreview = async () => {
    try {
      const rows = await previewMutation.mutateAsync(formData);
      if (rows.length === 0) {
        toast.error('Không có hợp đồng hoạt động nào trong phạm vi đã chọn.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xem trước hóa đơn hàng loạt.');
    }
  };

  const handleCreate = async () => {
    if (selectedContractIds.length === 0) {
      toast.error('Hãy chọn ít nhất một hợp đồng để tạo hóa đơn.');
      return;
    }

    setStep(3);
    setProgress(0);
    setResult(null);

    try {
      await createMutation.mutateAsync({
        ...formData,
        contractIds: selectedContractIds,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo hóa đơn hàng loạt.');
    }
  };

  const toggleContract = (contractId: string) => {
    setSelectedContractIds((current) =>
      current.includes(contractId)
        ? current.filter((id) => id !== contractId)
        : [...current, contractId]
    );
  };

  const toggleAllContracts = () => {
    setSelectedContractIds(allEligibleSelected ? [] : eligibleRows.map((row) => row.contract.id));
  };

  const downloadSummary = () => {
    if (!result) return;

    const rows = [
      ['contract_code', 'status', 'reason'],
      ...result.created.map((invoice) => [invoice.contractCode, 'created', invoice.invoiceCode]),
      ...result.skipped.map((entry) => [entry.contractCode, 'skipped', entry.reason]),
      ...result.failed.map((entry) => [entry.contractCode, 'failed', entry.reason]),
    ];

    const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bulk-invoice-summary-${formData.monthYear}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b flex items-center justify-between bg-white z-10">
          <div>
            <h2 className="text-h2 text-primary">Tạo hóa đơn hàng loạt</h2>
            <p className="text-small text-muted">Tạo hóa đơn cho nhiều hợp đồng đang hoạt động trong cùng một kỳ.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="px-8 py-4 bg-bg/30 border-b flex items-center justify-center gap-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  step === s ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20'
                    : step > s ? 'bg-success text-white'
                    : 'bg-white border text-muted'
                )}
              >
                {step > s ? <CheckCircle2 size={16} /> : s}
              </div>
              <span className={cn('text-[10px] font-bold uppercase tracking-wider', step === s ? 'text-primary' : 'text-muted')}>
                {s === 1 ? 'Chọn kỳ' : s === 2 ? 'Xem trước' : 'Kết quả'}
              </span>
            </div>
          ))}
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-body font-bold text-primary flex items-center gap-2">
                    <Calendar size={18} /> Cấu hình thời gian
                  </h4>
                  <div className="space-y-2">
                    <label className="text-label text-muted">Chọn kỳ thanh toán</label>
                    <input
                      type="month"
                      className="input-base w-full"
                      value={formData.monthYear}
                      onChange={(event) => setFormData((current) => ({ ...current, monthYear: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-label text-muted">Hạn thanh toán mặc định</label>
                    <input
                      type="date"
                      className="input-base w-full"
                      value={formData.dueDate}
                      onChange={(event) => setFormData((current) => ({ ...current, dueDate: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-body font-bold text-primary flex items-center gap-2">
                    <Building2 size={18} /> Phạm vi áp dụng
                  </h4>
                  <div className="space-y-2">
                    <label className="text-label text-muted">Tòa nhà</label>
                    <select
                      className="input-base w-full"
                      value={formData.buildingId ?? ''}
                      onChange={(event) => setFormData((current) => ({ ...current, buildingId: event.target.value }))}
                      disabled={contractsLoading}
                    >
                      <option value="">{contractsLoading ? 'Đang tải dữ liệu...' : 'Tất cả tòa nhà đang quản lý'}</option>
                      {buildingOptions.map((building) => (
                        <option key={building.id} value={building.id}>{building.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="p-4 bg-info/5 rounded-2xl border border-info/10 text-small text-info flex gap-2">
                    <Info size={16} className="shrink-0" />
                    Chỉ áp dụng cho các hợp đồng đang hoạt động. Những hóa đơn đã tồn tại trong kỳ này sẽ bị bỏ qua.
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-body font-bold text-primary">
                    Danh sách hợp đồng dự kiến ({previewRows.length})
                  </h4>
                  <p className="text-small text-muted">
                    Chỉ những dòng được chọn và có trạng thái tạo được mới được ghi vào cơ sở dữ liệu.
                  </p>
                </div>
                <div className="flex gap-3 text-[10px] font-bold uppercase">
                  <span className="text-success">Sẵn sàng ({readyCount})</span>
                  <span className="text-danger">Bị chặn ({blockedCount})</span>
                  <span className="text-slate-500">Đã tồn tại ({duplicateCount})</span>
                  <span className="text-danger">Lỗi ({errorCount})</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-bg/40 rounded-2xl border">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Có thể tạo</p>
                  <p className="text-2xl font-black text-primary mt-2">{eligibleRows.length}</p>
                </div>
                <div className="p-4 bg-bg/40 rounded-2xl border">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Đã chọn</p>
                  <p className="text-2xl font-black text-primary mt-2">{selectedContractIds.length}</p>
                </div>
                <div className="p-4 bg-bg/40 rounded-2xl border">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Tổng dự kiến</p>
                  <p className="text-2xl font-black text-primary mt-2">{formatVND(totalPreviewAmount)}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-small">
                  <thead className="bg-bg/50 border-b">
                    <tr>
                      <th className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={allEligibleSelected}
                          onChange={toggleAllContracts}
                          disabled={eligibleRows.length === 0}
                        />
                      </th>
                      <th className="px-4 py-3">Phòng</th>
                      <th className="px-4 py-3">Cư dân</th>
                      <th className="px-4 py-3 text-right">Dự kiến</th>
                      <th className="px-4 py-3 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => {
                      const isSelected = selectedContractIds.includes(row.contract.id);
                      return (
                        <tr key={row.contract.id} className="border-b last:border-0 hover:bg-bg/20 align-top">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleContract(row.contract.id)}
                              disabled={!row.canCreate}
                            />
                          </td>
                          <td className="px-4 py-3 font-bold">
                            <div>{row.contract.roomCode}</div>
                            <div className="text-[11px] font-medium text-muted">{row.contract.contractCode}</div>
                          </td>
                          <td className="px-4 py-3 font-medium">
                            <div>{row.contract.tenantName}</div>
                            <div className="text-[11px] text-muted">{row.contract.buildingName}</div>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-primary">
                            {row.preview ? formatVND(row.preview.totalAmount) : '—'}
                            {row.issue && <div className="text-[11px] font-medium text-muted text-left mt-1">{row.issue}</div>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-bold', statusBadgeClasses[row.status])}>
                              {statusLabels[row.status]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-in zoom-in-95 duration-500">
              {isGenerating ? (
                <div className="text-center space-y-6 w-full max-w-md">
                  <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
                    <div
                      className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"
                      style={{ animationDuration: '2s' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-h2 font-black text-primary">{progress}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-body font-bold text-primary">Đang tạo hóa đơn...</p>
                    <p className="text-small text-muted">Chỉ những hóa đơn insert thành công mới được tính là hoàn tất.</p>
                  </div>
                  <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : result ? (
                <div className="text-center space-y-6 w-full max-w-2xl">
                  <div className={cn(
                    'w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-xl',
                    result.created.length > 0 ? 'bg-success/10 text-success shadow-success/10' : 'bg-warning/10 text-warning shadow-warning/10'
                  )}>
                    {result.created.length > 0 ? <CheckCircle2 size={48} /> : <AlertTriangle size={48} />}
                  </div>
                  <div className="space-y-2">
                    <h3 className={cn('text-h2 font-black', result.created.length > 0 ? 'text-success' : 'text-warning')}>
                      {result.created.length > 0 ? 'Xử lý hoàn tất' : 'Không tạo được hóa đơn'}
                    </h3>
                    <p className="text-body text-muted">
                      Đã tạo <strong>{result.created.length} hóa đơn</strong> trên tổng số {result.totalRequested} hợp đồng được chọn.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
                    <div className="p-4 bg-bg/50 rounded-2xl border">
                      <p className="text-[24px] font-black text-primary">{result.created.length}</p>
                      <p className="text-[10px] text-muted font-bold uppercase">Thành công</p>
                    </div>
                    <div className="p-4 bg-warning/5 rounded-2xl border border-warning/10">
                      <p className="text-[24px] font-black text-warning">{result.skipped.length}</p>
                      <p className="text-[10px] text-muted font-bold uppercase">Bỏ qua</p>
                    </div>
                    <div className="p-4 bg-danger/5 rounded-2xl border border-danger/10">
                      <p className="text-[24px] font-black text-danger">{result.failed.length}</p>
                      <p className="text-[10px] text-muted font-bold uppercase">Thất bại</p>
                    </div>
                  </div>
                  {(result.skipped.length > 0 || result.failed.length > 0) && (
                    <div className="text-left bg-bg/40 rounded-2xl border p-4 space-y-3">
                      {result.skipped.length > 0 && (
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-warning">Bỏ qua</p>
                          <div className="mt-2 space-y-1 text-small text-muted">
                            {result.skipped.slice(0, 5).map((entry) => (
                              <p key={`skip-${entry.contractId}`}>{entry.contractCode}: {entry.reason}</p>
                            ))}
                          </div>
                        </div>
                      )}
                      {result.failed.length > 0 && (
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-danger">Thất bại</p>
                          <div className="mt-2 space-y-1 text-small text-muted">
                            {result.failed.slice(0, 5).map((entry) => (
                              <p key={`fail-${entry.contractId}`}>{entry.contractCode}: {entry.reason}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <button className="btn-outline flex items-center gap-2 mx-auto" onClick={downloadSummary}>
                    <Download size={18} /> Tải báo cáo kết quả (.csv)
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="px-8 py-6 border-t bg-bg/20 flex items-center justify-between">
          {step > 1 && !isGenerating && (
            <button onClick={() => setStep(step - 1)} className="btn-outline flex items-center gap-2">
              <ChevronLeft size={18} /> Quay lại
            </button>
          )}
          <div className="flex items-center gap-3 ml-auto">
            {step === 1 && (
              <button
                onClick={handlePreview}
                className="btn-primary flex items-center gap-2"
                disabled={previewMutation.isPending}
              >
                {previewMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : null}
                Tiếp tục <ChevronRight size={18} />
              </button>
            )}

            {step === 2 && (
              <>
                <button onClick={() => setStep(1)} className="btn-outline flex items-center gap-2">
                  <ChevronLeft size={18} /> Quay lại
                </button>
                <button
                  onClick={handleCreate}
                  className="btn-primary bg-success hover:bg-success/90 border-none px-8 flex items-center gap-2"
                  disabled={selectedContractIds.length === 0 || createMutation.isPending}
                >
                  {createMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Layers size={18} />}
                  Xác nhận & Khởi tạo
                </button>
              </>
            )}

            {step === 3 && !isGenerating && (
              <button onClick={onClose} className="btn-primary px-12">Đóng</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

