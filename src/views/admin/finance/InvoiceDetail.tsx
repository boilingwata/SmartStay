import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, FileText, Printer, Share2, 
  CreditCard, Send, Trash2, Building2, 
  Calendar, Info, ChevronDown, ChevronUp,
  Zap, Droplets, ShieldCheck, Receipt,
  Smartphone, Download, AlertCircle, CheckCircle2, QrCode,
  History as HistoryIcon
} from 'lucide-react';
import { invoiceService } from '@/services/invoiceService';
import { InvoiceDetail as InvoiceDetailType } from '@/models/Invoice';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn, formatVND, formatDate } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { toast } from 'sonner';
import { RecordPaymentModal } from '@/components/shared/modals/RecordPaymentModal';
import { useAdminFinanceRealtime } from '@/hooks/useAdminFinanceRealtime';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showElectricityDetails, setShowElectricityDetails] = useState(false);
  const [showWaterDetails, setShowWaterDetails] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useAdminFinanceRealtime(id);

  const { data: invoice, isLoading } = useQuery<InvoiceDetailType>({
    queryKey: ['invoice', id],
    queryFn: () => invoiceService.getInvoiceDetail(id!)
  });

  // 3.2.6 Auto-log InvoiceViewLogs
  useEffect(() => {
    if (invoice && id) {
      const sessionKey = `viewed_inv_${id}`;
      if (!sessionStorage.getItem(sessionKey)) {
        invoiceService.logInvoiceView(id);
        sessionStorage.setItem(sessionKey, 'true');
      }
    }
  }, [id, invoice]);

  const remainingAmount = invoice ? Math.max(0, invoice.totalAmount - invoice.paidAmount) : 0;
  const isFullyPaid = invoice ? invoice.status === 'Paid' || remainingAmount <= 0 : false;

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;
  if (!invoice) return <div>Không tìm thấy hóa đơn.</div>;

  // 3.2.1 Logic PDF generation (Checklist #8)
  const handleDownloadPDF = async () => {
    toast.promise(
      (async () => {
        // In production: const response = await fetch(`/api/invoices/${id}/pdf`);
        // const blob = await response.blob();
        const blob = new Blob(['Nội dung PDF hóa đơn'], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Hoa-don-${invoice.invoiceCode}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        return true;
      })(),
      {
        loading: 'Đang tạo bản PDF...',
        success: 'Tải về thành công!',
        error: 'Lỗi khi tạo PDF',
      }
    );
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* 3.2.2 Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-bg rounded-full transition-all">
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <h1 className="text-display text-primary">{invoice.invoiceCode}</h1>
                 <StatusBadge status={invoice.status} />
              </div>
              <div className="flex items-center gap-4 text-small text-muted font-medium">
                 <span className="flex items-center gap-1"><Building2 size={14} /> {invoice.buildingName}</span>
                 <span className="flex items-center gap-1"><Calendar size={14} /> Kỳ: Tháng {invoice.period.split('-')[1]}/{invoice.period.split('-')[0]}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleDownloadPDF} className="btn-outline flex items-center gap-2"><Printer size={18} /> In hóa đơn</button>
            <button className="btn-outline flex items-center gap-2" onClick={() => {
              toast.promise(
                invoiceService.sendNotification(id!),
                {
                  loading: 'Đang gửi thông báo...',
                  success: 'Đã gửi thông báo cho cư dân!',
                  error: 'Gửi thông báo thất bại. Vui lòng thử lại.',
                }
              );
            }}><Send size={18} /> Gửi lại thông báo</button>
            <button 
              className={cn(
                "btn-primary flex items-center gap-2 shadow-lg shadow-primary/20",
                isFullyPaid && "opacity-60 cursor-not-allowed shadow-none"
              )}
              onClick={() => {
                if (isFullyPaid) {
                  toast.info('Hóa đơn này đã được thanh toán đủ.');
                  return;
                }
                setIsPaymentModalOpen(true);
              }}
              disabled={isFullyPaid}
            >
              <CreditCard size={18} /> Ghi nhận thanh toán
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - 60% */}
          <div className="lg:col-span-8 space-y-8">
            <div className="card-container p-8 space-y-8 bg-white shadow-xl shadow-primary/5">
               <div className="flex justify-between items-start">
                  <div className="space-y-1">
                     <p className="text-label text-muted">Bên cho thuê</p>
                     <p className="text-body font-bold text-primary uppercase">CÔNG TY QUẢN LÝ BẤT ĐỘNG SẢN SMARTSTAY</p>
                     <p className="text-small text-muted">Tòa nhà {invoice.buildingName}, Quận Nam Từ Liêm, Hà Nội</p>
                  </div>
                  <div className="text-right space-y-1">
                     <p className="text-label text-muted">Khách hàng</p>
                     <p className="text-body font-bold text-primary uppercase">{invoice.tenantName}</p>
                     <p className="text-small text-muted">Mã cư dân: {invoice.tenantId}</p>
                     <p className="text-small text-muted">Phòng: {invoice.roomCode}</p>
                  </div>
               </div>

               {/* 3.2.3 InvoiceDetails Table */}
               <div className="overflow-hidden rounded-2xl border border-border/50">
                 <table className="w-full text-left">
                    <thead className="bg-bg/40">
                      <tr>
                        <th className="px-6 py-4 text-label text-muted">Mô tả chi tiết</th>
                        <th className="px-6 py-4 text-label text-muted text-center">SL</th>
                        <th className="px-6 py-4 text-label text-muted text-right">Đơn giá</th>
                        <th className="px-6 py-4 text-label text-muted text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {invoice.items.map((item) => (
                        <React.Fragment key={item.id}>
                          <tr className="group hover:bg-bg/20 transition-colors">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  {item.type === 'Electricity' ? <Zap className="text-warning" size={16} /> :
                                   item.type === 'Water' ? <Droplets className="text-secondary" size={16} /> :
                                   item.type === 'Rent' ? <Receipt className="text-primary" size={16} /> : <Info className="text-muted" size={16} />}
                                  <span className="text-body font-medium text-text">{item.description}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-center text-body font-medium text-muted">{item.quantity}</td>
                            <td className="px-6 py-4 text-right text-body font-medium text-muted">{formatVND(item.unitPriceSnapshot)}</td>
                            <td className="px-6 py-4 text-right text-body font-bold text-primary">{formatVND(item.amount)}</td>
                          </tr>
                          
                          {/* 3.2.4 Electricity Tier Breakdown (Collapsible) */}
                          {item.type === 'Electricity' && item.tierBreakdown && (
                            <tr>
                              <td colSpan={4} className="p-0">
                                 <button 
                                   onClick={() => setShowElectricityDetails(!showElectricityDetails)}
                                   className="w-full flex items-center justify-center gap-2 py-2 bg-warning/5 text-[10px] font-bold text-warning uppercase hover:bg-warning/10 transition-all"
                                 >
                                   {showElectricityDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Chi tiết định mức điện
                                 </button>
                                 {showElectricityDetails && (
                                   <div className="p-6 bg-warning/5 border-t border-warning/10 animate-in slide-in-from-top-2 duration-300">
                                     <table className="w-full text-left text-[11px]">
                                        <thead>
                                          <tr className="text-warning/70 border-b border-warning/20">
                                            <th className="pb-2">Bậc</th>
                                            <th className="pb-2">Từ (kWh)</th>
                                            <th className="pb-2">Đến (kWh)</th>
                                            <th className="pb-2 text-center">Tiêu thụ</th>
                                            <th className="pb-2 text-right">Đơn giá</th>
                                            <th className="pb-2 text-right">Thành tiền</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-warning/10">
                                          {item.tierBreakdown.map((t: any) => (
                                            <tr key={t.tierOrder}>
                                              <td className="py-2 font-bold">{t.tierOrder}</td>
                                              <td className="py-2">{t.fromKwh}</td>
                                              <td className="py-2">{t.toKwh || 'Không hạn chế'}</td>
                                              <td className="py-2 text-center font-medium">{t.kwh}</td>
                                              <td className="py-2 text-right">{formatVND(t.price)}</td>
                                              <td className="py-2 text-right font-bold">{formatVND(t.amount)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                     </table>
                                   </div>
                                 )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                    <tfoot className="bg-bg/20 border-t-2 border-primary/10 font-bold">
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-right text-muted uppercase text-small">Tổng cộng tiền hàng</td>
                        <td className="px-6 py-4 text-right text-primary">{formatVND(invoice.subTotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-right text-muted uppercase text-small">Thuế GTGT (VAT)</td>
                        <td className="px-6 py-4 text-right text-primary">{formatVND(invoice.taxAmount)}</td>
                      </tr>
                      {invoice.overdueFee > 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-right text-danger uppercase text-small">Phí quá hạn</td>
                          <td className="px-6 py-4 text-right text-danger">{formatVND(invoice.overdueFee)}</td>
                        </tr>
                      )}
                      <tr className="bg-primary/5 text-lg">
                        <td colSpan={3} className="px-6 py-6 text-right text-primary uppercase font-display">Tổng cộng thanh toán</td>
                        <td className="px-6 py-6 text-right text-primary font-display font-black">{formatVND(invoice.totalAmount)}</td>
                      </tr>
                    </tfoot>
                 </table>
               </div>
            </div>

            <div className="bg-info/5 p-6 rounded-3xl border border-info/20 flex gap-4">
               <AlertCircle className="text-info shrink-0" size={24} />
               <div className="space-y-1">
                  <p className="text-body font-bold text-info">Ghi chú quan trọng</p>
                  <p className="text-small text-info/80 font-medium">
                    Hóa đơn được tạo dựa trên <strong>UnitPriceSnapshot</strong> tại thời điểm ký hợp đồng. 
                    Mọi sự thay đổi về chính sách giá từ bên điện lực sẽ chỉ được áp dụng khi có sự đồng thuận ký phụ lục mới (Tuân thủ RULE-04).
                  </p>
               </div>
            </div>
          </div>

          {/* Right Column - 40% */}
          <div className="lg:col-span-4 space-y-8">
             {/* 3.2.5 Payment Summary */}
             <div className="card-container p-8 space-y-8 sticky top-6 shadow-2xl shadow-primary/5 transition-all hover:shadow-primary/10">
                <div className="text-center space-y-4">
                   <p className="text-label text-muted tracking-widest">Trạng thái thanh toán</p>
                   <div className="inline-block p-4 rounded-3xl bg-bg/50 border border-border/50">
                      <StatusBadge status={invoice.status} size="lg" />
                   </div>
                   
                   <div className="space-y-1 mt-4">
                     <p className="text-small text-muted uppercase font-bold">Số tiền cần trả</p>
                     <p className="text-[40px] font-display font-black text-primary leading-none">
                       {formatVND(invoice.totalAmount - invoice.paidAmount)}
                     </p>
                   </div>
                </div>

                {/* QR Code */}
                <div className="bg-white p-6 rounded-3xl border border-dashed border-border flex flex-col items-center gap-4 text-center">
                   <div className="w-48 h-48 bg-bg rounded-xl flex items-center justify-center border">
                      {/* Simplified QR Placeholder */}
                      <QrCode size={100} className="text-muted/20" />
                      <p className="absolute text-[10px] text-muted font-bold tracking-tighter uppercase opacity-30">Scan to Pay QR</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-small font-bold text-primary uppercase">{invoice.bankInfo?.bankName}</p>
                      <p className="text-body font-mono font-bold tracking-wider">{invoice.bankInfo?.accountNumber}</p>
                      <p className="text-[10px] text-muted font-medium">{invoice.bankInfo?.accountName}</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-label text-muted border-b pb-2 flex items-center gap-2">
                     <HistoryIcon size={14} /> Lịch sử thanh toán
                   </h4>
                   {invoice.payments.length > 0 ? (
                     <div className="space-y-4">
                        {invoice.payments.map((p) => (
                          <div key={p.id} className="flex gap-4 p-4 rounded-2xl bg-success/5 border border-success/10">
                             <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
                                <CheckCircle2 size={20} />
                             </div>
                             <div className="space-y-1">
                                <p className="text-small font-bold text-success">{formatVND(p.amount)}</p>
                                <p className="text-[10px] text-muted font-mono">{p.transactionCode}</p>
                                <p className="text-[9px] text-muted italic">{formatDate(p.paidAt)}</p>
                             </div>
                          </div>
                        ))}
                     </div>
                   ) : (
                     <div className="text-center py-6 text-muted italic text-[11px]">Chưa có giao dịch nào.</div>
                   )}
                </div>

                <div className="space-y-3">
                   <button 
                     className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-md shadow-lg shadow-primary/20"
                     onClick={() => toast.info('Tính năng thanh toán online đang được tích hợp.')}
                   >
                      <Smartphone size={20} /> Thanh toán Online
                   </button>
                   <button onClick={handleDownloadPDF} className="btn-outline w-full py-4 flex items-center justify-center gap-2 text-md">
                      <Download size={20} /> Tải bản PDF
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>

      {invoice && (
        <RecordPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          invoice={invoice as any}
        />
      )}
    </>
  );
};

export default InvoiceDetail;
