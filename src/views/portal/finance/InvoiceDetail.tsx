import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, Phone, CreditCard, ChevronDown, CheckCircle2, ChevronRight, Copy, Wallet, QrCode } from 'lucide-react';
import { invoiceService, PaymentMethod } from '@/services/invoiceService';
import { InvoiceDetail as IInvoiceDetail } from '@/models/Invoice';
import { cn } from '@/utils';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

const InvoiceDetail: React.FC = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<IInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await invoiceService.getInvoiceDetail(id);
        setInvoice(data);
      } catch (error) {
        toast.error('Không thể tải chi tiết hóa đơn');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  useEffect(() => {
    const paymentResult = searchParams.get('paymentResult');
    if (paymentResult === 'success') {
      toast.success('Thanh toán thành công!');
      // In a real app, refetch invoice status here
    } else if (paymentResult === 'failed') {
      toast.error('Thanh toán thất bại hoặc bị hủy');
    }
  }, [searchParams]);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${type}`);
  };

  const handlePay = async () => {
    if (!invoice || !paymentMethod) return;
    setProcessing(true);
    try {
      const result = await invoiceService.initiatePayment(invoice.id, paymentMethod);
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else if (result.success) {
        toast.success(result.message);
        // If transfer, show QR or instructions here. For simplicity, we just rely on the selection state below to show QR.
      }
    } catch (err) {
      toast.error('Lỗi khởi tạo thanh toán');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !invoice) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-6 bg-white min-h-[80vh]">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#0D8A8A] rounded-full animate-spin"></div>
        <p className="text-[10px] text-slate-400 font-black animate-pulse uppercase tracking-[3px]">Loading Invoice</p>
      </div>
    );
  }

  const isUnpaid = invoice.status === 'Unpaid' || invoice.status === 'Overdue';

  return (
    <div className="min-h-screen bg-slate-50/50 pb-40 animate-in fade-in slide-in-from-right-6 duration-700 font-sans">
      {/* Fixed Top Bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl px-5 py-4 flex items-center justify-between border-b border-slate-100">
        <button onClick={() => navigate(-1)} className="w-11 h-11 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition-all hover:bg-slate-50">
          <ArrowLeft size={22} />
        </button>
        <div className="text-center">
            <span className="block text-xs font-black uppercase tracking-[2px] text-slate-400">Tháng {invoice.period}</span>
            <span className="text-sm font-black text-slate-900">{invoice.invoiceCode}</span>
        </div>
        <button className="w-11 h-11 bg-teal-50 rounded-2xl shadow-sm border border-teal-100 flex items-center justify-center text-[#0D8A8A] active:scale-95 transition-all hover:bg-teal-100">
          <Download size={20} />
        </button>
      </div>

      <div className="p-5 space-y-6 max-w-[500px] mx-auto">
        
        {/* Amount Header */}
        <div className="text-center space-y-3 pt-6 pb-2">
           <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 border border-slate-200">
               {invoice.status === 'Paid' ? 'Đã thu tiền' : 'Tổng cộng'}
           </div>
           <div className="flex items-start justify-center gap-1.5">
             <h1 className="text-[42px] font-black tracking-tighter tabular-nums leading-none text-slate-900">{invoice.totalAmount.toLocaleString()}</h1>
             <span className="text-xl font-bold uppercase text-slate-400 mt-1">đ</span>
           </div>
           {isUnpaid && (
              <p className={cn("text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-2xl inline-block", invoice.status === 'Overdue' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600')}>
                Hạn chót: {invoice.dueDate}
              </p>
           )}
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden">
           <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Bảng kê chi tiết</span>
              <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">{invoice.items.length} hạng mục</span>
           </div>
           
           <div className="divide-y divide-slate-50 stroke-slate-50">
             {invoice.items.map((item) => (
               <div key={item.id} className="group">
                  <div 
                    className="p-5 flex justify-between items-start hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                  >
                     <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                           <p className="text-[14px] font-bold text-slate-800 tracking-tight">{item.description}</p>
                           {item.tierBreakdown && (
                             <ChevronDown size={14} className={cn("text-slate-400 transition-transform", expandedItem === item.id && "rotate-180")} />
                           )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                          {item.quantity} x {item.unitPriceSnapshot.toLocaleString()} đ
                        </p>
                     </div>
                     <span className="text-[15px] font-black text-slate-900 tabular-nums">
                       {item.amount.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold">đ</span>
                     </span>
                  </div>

                  {/* Tier Breakdown Expandable Area */}
                  {item.tierBreakdown && expandedItem === item.id && (
                    <div className="px-5 pb-5 pt-0 bg-slate-50/50 space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
                       <div className="h-px w-full bg-slate-100 mb-3" />
                       {item.tierBreakdown.map((tier: any, i: number) => (
                         <div key={i} className="flex justify-between items-center text-[11px]">
                           <span className="font-bold text-slate-500">{tier.label}</span>
                           <div className="flex items-center gap-4">
                             <span className="text-slate-400 font-medium">{tier.value}</span>
                             <span className="font-bold text-slate-700 tabular-nums text-right w-16">{tier.amount.toLocaleString()} đ</span>
                           </div>
                         </div>
                       ))}
                    </div>
                  )}
               </div>
             ))}

             {invoice.overdueFee > 0 && (
                <div className="p-5 flex justify-between items-center bg-red-50/50">
                   <div className="space-y-0.5">
                     <p className="text-[13px] font-bold text-red-600 tracking-tight">Phí phạt trễ hạn</p>
                     <p className="text-[10px] text-red-400 font-medium">Theo quy định HĐ</p>
                   </div>
                   <span className="text-[14px] font-black text-red-600 tabular-nums">
                     {invoice.overdueFee.toLocaleString()} <span className="text-[10px] opacity-70">đ</span>
                   </span>
                </div>
             )}
           </div>

           <div className="p-5 bg-teal-50/30 border-t border-teal-100/50 flex justify-between items-center">
              <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Tổng thanh toán</span>
              <div className="flex items-baseline gap-1">
                 <span className="text-xl font-black text-[#0D8A8A] tabular-nums tracking-tighter">{invoice.totalAmount.toLocaleString()}</span>
                 <span className="text-xs font-bold text-[#0D8A8A] uppercase">đ</span>
              </div>
           </div>
        </div>

        {/* Payment Methods Section */}
        {isUnpaid && (
           <div className="space-y-4 pt-4">
              <h3 className="text-[11px] font-black text-slate-400 ml-2 uppercase tracking-[2px]">Chọn phương thức thanh toán</h3>
              
              <div className="grid gap-3">
                 {/* Wallet Option */}
                 <button 
                   onClick={() => setPaymentMethod('Wallet')}
                   className={cn(
                     "flex items-center p-4 rounded-3xl border-2 transition-all text-left bg-white",
                     paymentMethod === 'Wallet' ? "border-[#0D8A8A] shadow-lg shadow-[#0D8A8A]/10" : "border-slate-100 hover:border-slate-200"
                   )}
                 >
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mr-4 transition-colors", paymentMethod === 'Wallet' ? 'bg-[#0D8A8A] text-white' : 'bg-slate-50 text-slate-600')}>
                       <Wallet size={24} strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                       <p className="font-bold text-slate-900 text-[15px]">Ví SmartStay</p>
                       <p className="text-[11px] text-slate-500 font-medium">Số dư: <span className="font-bold text-emerald-600">5,000,000 đ</span></p>
                    </div>
                    <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors", paymentMethod === 'Wallet' ? 'border-[#0D8A8A] bg-[#0D8A8A]' : 'border-slate-200')}>
                       {paymentMethod === 'Wallet' && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
                    </div>
                 </button>

                 {/* VNPay Option */}
                 <button 
                   onClick={() => setPaymentMethod('VNPay')}
                   className={cn(
                     "flex items-center p-4 rounded-3xl border-2 transition-all text-left bg-white",
                     paymentMethod === 'VNPay' ? "border-[#0D8A8A] shadow-lg shadow-[#0D8A8A]/10" : "border-slate-100 hover:border-slate-200"
                   )}
                 >
                    <div className="w-12 h-12 rounded-2xl bg-[#005BAA]/5 flex items-center justify-center shrink-0 mr-4">
                       <span className="font-black text-[#005BAA] tracking-tighter text-sm">VNPAY</span>
                    </div>
                    <div className="flex-1">
                       <p className="font-bold text-slate-900 text-[15px]">Cổng VNPay</p>
                       <p className="text-[11px] text-slate-500 font-medium">Thẻ ATM / Visa / QR</p>
                    </div>
                    <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors", paymentMethod === 'VNPay' ? 'border-[#0D8A8A] bg-[#0D8A8A]' : 'border-slate-200')}>
                       {paymentMethod === 'VNPay' && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
                    </div>
                 </button>

                 {/* Transfer Option */}
                 <button 
                   onClick={() => setPaymentMethod('Transfer')}
                   className={cn(
                     "flex items-center p-4 rounded-3xl border-2 transition-all text-left bg-white",
                     paymentMethod === 'Transfer' ? "border-[#0D8A8A] shadow-lg shadow-[#0D8A8A]/10" : "border-slate-100 hover:border-slate-200"
                   )}
                 >
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mr-4 transition-colors", paymentMethod === 'Transfer' ? 'bg-[#0D8A8A] text-white' : 'bg-slate-50 text-slate-600')}>
                       <CreditCard size={24} strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                       <p className="font-bold text-slate-900 text-[15px]">Chuyển khoản thủ công</p>
                       <p className="text-[11px] text-slate-500 font-medium">Internet Banking / Quét mã QR</p>
                    </div>
                    <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors", paymentMethod === 'Transfer' ? 'border-[#0D8A8A] bg-[#0D8A8A]' : 'border-slate-200')}>
                       {paymentMethod === 'Transfer' && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
                    </div>
                 </button>
              </div>
           </div>
        )}

        {/* Transfer Details (Shown only when Transfer is selected) */}
        {paymentMethod === 'Transfer' && invoice.bankInfo && (
           <div className="p-6 bg-white rounded-[32px] border border-[#0D8A8A]/20 shadow-xl shadow-[#0D8A8A]/5 space-y-6 animate-in slide-in-from-top-4 fade-in">
              <div className="text-center space-y-1">
                 <p className="text-[11px] font-black uppercase tracking-widest text-[#0D8A8A]">Quét mã VietQR</p>
                 <p className="text-sm font-medium text-slate-500">Mở app Ngân hàng để quét mã</p>
              </div>
              
              <div className="bg-white p-4 rounded-[24px] border border-slate-100 w-fit mx-auto shadow-sm">
                 <QRCodeSVG value={invoice.bankInfo.qrContent} size={180} />
              </div>

              <div className="space-y-3 bg-slate-50/80 p-5 rounded-[24px] border border-slate-100">
                 <div className="flex justify-between items-center group">
                    <div className="space-y-0.5">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ngân hàng</p>
                       <p className="text-sm font-black text-slate-800">{invoice.bankInfo.bankName}</p>
                    </div>
                 </div>
                 <div className="flex justify-between items-center group">
                    <div className="space-y-0.5">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chủ tài khoản</p>
                       <p className="text-sm font-black text-slate-800">{invoice.bankInfo.accountName}</p>
                    </div>
                 </div>
                 <div className="flex justify-between items-center group">
                    <div className="space-y-0.5">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Số tài khoản</p>
                       <p className="text-lg font-black text-[#0D8A8A] tabular-nums tracking-tighter">{invoice.bankInfo.accountNumber}</p>
                    </div>
                    <button onClick={() => handleCopy(invoice.bankInfo!.accountNumber, 'Số tài khoản')} className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-600 active:scale-95 transition-transform">
                       <Copy size={16} />
                    </button>
                 </div>
                 <div className="flex justify-between items-center group pt-3 mb-1 border-t border-slate-200/50">
                    <div className="space-y-0.5 max-w-[70%]">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nội dung (Bắt buộc)</p>
                       <p className="text-sm font-black text-rose-600 break-words">{invoice.invoiceCode}</p>
                    </div>
                    <button onClick={() => handleCopy(invoice.invoiceCode, 'Nội dung')} className="w-10 h-10 bg-rose-50 rounded-xl shadow-sm border border-rose-100 flex items-center justify-center text-rose-600 active:scale-95 transition-transform">
                       <Copy size={16} />
                    </button>
                 </div>
              </div>
           </div>
        )}

      </div>

      {/* Pay Button Sticky Bottom */}
      {isUnpaid && (
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-2xl border-t border-slate-100 z-[100] transform transition-transform duration-500">
           <div className="max-w-[500px] mx-auto flex items-center gap-4">
              <div className="flex-1 space-y-0.5">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Cần thanh toán</p>
                 <div className="flex items-baseline gap-1">
                   <p className="text-2xl font-black text-slate-900 tabular-nums tracking-tighter leading-none">{invoice.totalAmount.toLocaleString()}</p>
                   <span className="text-xs font-bold text-slate-400 uppercase">đ</span>
                 </div>
              </div>
              <button 
                onClick={handlePay}
                disabled={!paymentMethod || processing}
                className={cn(
                   "h-14 px-8 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all",
                   paymentMethod && !processing
                     ? "bg-[#0D8A8A] text-white shadow-xl shadow-[#0D8A8A]/30 active:scale-[0.97] hover:bg-[#0D7A7A]" 
                     : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                {processing ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                   <>
                     Xác nhận
                     <ChevronRight size={20} className="opacity-70" strokeWidth={3} />
                   </>
                )}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
