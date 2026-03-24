import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, CreditCard, ChevronDown, CheckCircle2, ChevronRight, Copy, Wallet } from 'lucide-react';
import { invoiceService, PaymentMethod } from '@/services/invoiceService';
import { InvoiceDetail as IInvoiceDetail, InvoiceItem } from '@/models/Invoice';
import { cn, formatVND } from '@/utils';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { m, AnimatePresence } from 'framer-motion';

const InvoiceDetail: React.FC = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<IInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    fetchDetail();
  }, [id]);

  useEffect(() => {
    const paymentResult = searchParams.get('paymentResult');
    if (paymentResult === 'success') {
      toast.success('Thanh toán thành công!');
      fetchDetail();
      const sp = new URLSearchParams(searchParams);
      sp.delete('paymentResult');
      setSearchParams(sp);
    } else if (paymentResult === 'failed') {
      toast.error('Thanh toán thất bại hoặc bị hủy');
      const sp = new URLSearchParams(searchParams);
      sp.delete('paymentResult');
      setSearchParams(sp);
    }
  }, [searchParams, setSearchParams]);

  const handleCopy = async (text: string, key: string, label: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        toast.success(`Đã sao chép ${label}`);
        setCopiedStates(prev => ({ ...prev, [key]: true }));
        setTimeout(() => {
          setCopiedStates(prev => ({ ...prev, [key]: false }));
        }, 2000);
      } catch (e) {
        toast.error(`Không thể sao chép ${label}`);
      }
    } else {
      toast.error('Trình duyệt không hỗ trợ sao chép');
    }
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
        <div className="w-10 h-10 border-4 border-slate-100 border-teal-600 rounded-full animate-spin"></div>
        <p className="text-[10px] text-slate-400 font-black animate-pulse uppercase tracking-[3px]">Loading Invoice</p>
      </div>
    );
  }

  const isUnpaid = invoice.status === 'Unpaid' || invoice.status === 'Overdue';
  const walletBalance = 0; // Mocked 0 for edge cases

  const renderItemContent = (item: InvoiceItem) => {
    if (item.snapshotPrice == null) {
      return (
        <div className="text-red-500 text-xs font-semibold mt-1">
          Lỗi: Dữ liệu hợp đồng không hợp lệ
        </div>
      );
    }
    return (
      <p className="text-[11px] text-slate-500 font-medium tracking-wide">
        {item.quantity} x {formatVND(item.snapshotPrice)}
        <span className="ml-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px]">{item.snapshotLabel}</span>
      </p>
    );
  };

  return (
    <div className="flex-1 animate-in fade-in slide-in-from-right-6 duration-700 font-sans flex flex-col pb-32">
      <div className="p-5 md:p-8 space-y-10 w-full xl:max-w-[900px] mx-auto">
        
        {/* Invoice Metadata Hero (Replacer for redundant header) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl shadow-slate-200/20">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-600 text-[10px] font-black uppercase tracking-widest border border-teal-100">
               Tháng {invoice.period}
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">{invoice.invoiceCode}</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Hóa đơn điện tử chính thức</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="h-14 px-6 bg-teal-50 rounded-2xl shadow-sm border border-teal-100 flex items-center justify-center gap-3 text-teal-600 font-black text-xs uppercase tracking-widest active:scale-95 transition-all hover:bg-teal-100">
              <Download size={18} />
              <span>Tải hóa đơn (PDF)</span>
            </button>
          </div>
        </div>
        
        {/* D.7.1 Amount Header */}
        <div className="text-center space-y-3 pt-6 pb-4">
           <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white shadow-sm text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 border border-gray-100 ring-2 ring-gray-50">
               {invoice.status === 'Paid' ? 'Đã thu tiền' : 'Tổng cộng'}
           </div>
           <div className="flex items-center justify-center gap-2 mt-2">
             <h1 className="text-5xl font-black bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent leading-none tracking-tighter drop-shadow-sm">
               {formatVND(invoice.totalAmount).replace('₫', '').trim()}
             </h1>
             <span className="text-xl font-bold text-slate-400 self-end mb-1 uppercase tracking-widest">VND</span>
           </div>
           {isUnpaid && (
              <div className="flex justify-center gap-2 items-center mt-3">
               <span className={cn("text-[10px] font-black uppercase tracking-[2px] px-5 py-2 rounded-full inline-block shadow-inner", invoice.status === 'Overdue' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100')}>
                 Hạn chót: {invoice.dueDate}
               </span>
              </div>
           )}
        </div>

        {/* D.7.2 Detailed Breakdown */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-slate-200/30 overflow-hidden">
           <div className="p-5 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Bảng kê chi tiết</span>
              <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">{invoice.items.length} hạng mục</span>
           </div>
           
           <div className="divide-y divide-gray-50 stroke-gray-50">
             {invoice.items.map((item) => {
               const allowCollapse = (item.type === 'Electricity' || item.type === 'Water') && item.tierBreakdown && item.tierBreakdown.length > 0;
               return (
               <div key={item.id} className="group">
                  <div 
                    className={cn("p-5 flex justify-between items-start transition-colors", allowCollapse ? "cursor-pointer hover:bg-gray-50" : "")}
                    onClick={() => {
                      if (allowCollapse) {
                        setExpandedItem(expandedItem === item.id ? null : item.id);
                      }
                    }}
                  >
                     <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                           <p className="text-[14px] font-bold text-gray-800 tracking-tight">{item.description}</p>
                           {allowCollapse && (
                             <ChevronDown size={14} className={cn("text-gray-400 transition-transform", expandedItem === item.id && "rotate-180")} />
                           )}
                        </div>
                        {renderItemContent(item)}
                     </div>
                      <span className="text-[15px] font-black text-slate-900 tabular-nums">
                        {formatVND(item.amount)}
                      </span>
                  </div>

                  {/* Tier Breakdown Expandable Area using Framer Motion */}
                  <AnimatePresence>
                  {allowCollapse && expandedItem === item.id && (
                    <m.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-gray-50/50"
                    >
                      <div className="px-5 pb-5 pt-0 space-y-2">
                         <div className="h-px w-full bg-gray-100 mb-3" />
                         {item.tierBreakdown?.map((tier: any, i: number) => (
                           <div key={i} className="flex justify-between items-center text-[11px]">
                             <span className="font-bold text-gray-500">{tier.label}</span>
                             <div className="flex items-center gap-4">
                               <span className="text-slate-400 font-medium">{tier.qty} x {formatVND(tier.unitPrice)}</span>
                               <span className="font-bold text-slate-700 tabular-nums text-right w-24">{formatVND(tier.amount)}</span>
                             </div>
                           </div>
                         ))}
                      </div>
                    </m.div>
                  )}
                  </AnimatePresence>
               </div>
               );
             })}

             {/* Penalty Condition */}
             {invoice.status === 'Overdue' && invoice.overdueFee > 0 && (
                <div className="p-5 flex justify-between items-center bg-red-50/50">
                   <div className="space-y-0.5">
                     <p className="text-[13px] font-bold text-red-600 tracking-tight">Phí phạt trễ hạn</p>
                     <p className="text-[10px] text-red-400 font-medium">Theo quy định HĐ</p>
                   </div>
                    <span className="text-[14px] font-black text-red-600 tabular-nums">
                      {formatVND(invoice.overdueFee)}
                    </span>
                </div>
             )}

             {/* Discount Condition */}
             {invoice.discountAmount > 0 && (
                <div className="p-5 flex justify-between items-center bg-emerald-50/50">
                   <div className="space-y-0.5">
                     <p className="text-[13px] font-bold text-emerald-600 tracking-tight">Giảm giá</p>
                     {invoice.discountReason && <p className="text-[10px] text-emerald-500 font-medium">{invoice.discountReason}</p>}
                   </div>
                    <span className="text-[14px] font-black text-emerald-600 tabular-nums">
                      -{formatVND(invoice.discountAmount)}
                    </span>
                </div>
             )}
           </div>

            <div className="p-5 bg-teal-50/10 border-t border-teal-100/50 flex justify-between items-center bg-gradient-to-r from-teal-50/30 to-white">
               <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Tổng cộng thanh toán</span>
                <div className="flex items-baseline gap-1">
                   <span className="text-xl font-black text-slate-900 tabular-nums tracking-tighter">{formatVND(invoice.totalAmount)}</span>
                </div>
            </div>
        </div>

        {/* D.7.3 Payment Methods Section */}
        {isUnpaid && (
           <div className="space-y-4 pt-6">
              <h3 className="text-sm font-black text-gray-900 ml-2 uppercase tracking-widest drop-shadow-sm">Chọn phương thức thanh toán</h3>
              
              <div className="grid gap-3">
                 {/* Wallet Option */}
                 <button 
                   onClick={() => setPaymentMethod('Wallet')}
                   className={cn(
                     "flex items-center p-4 rounded-[24px] border-2 transition-all duration-300 cursor-pointer text-left hover:-translate-y-0.5 hover:shadow-md",
                     paymentMethod === 'Wallet' ? "border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20 shadow-[0_8px_30px_-5px_rgba(20,184,166,0.15)]" : "bg-white border-gray-100 hover:border-gray-200"
                   )}
                 >
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mr-4 transition-colors", paymentMethod === 'Wallet' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600')}>
                       <Wallet size={24} strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                       <p className="font-bold text-gray-900 text-[15px]">Ví SmartStay</p>
                        <p className={cn("text-[11px] font-medium", walletBalance >= invoice.totalAmount ? "text-teal-600" : "text-red-500")}>
                          Số dư: {formatVND(walletBalance)}
                          {walletBalance < invoice.totalAmount && <span> (Cần nộp thêm {formatVND(invoice.totalAmount - walletBalance)})</span>}
                        </p>
                    </div>
                    <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors", paymentMethod === 'Wallet' ? 'border-teal-500 bg-teal-500' : 'border-gray-300')}>
                       {paymentMethod === 'Wallet' && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
                    </div>
                 </button>

                 {/* VNPay Option */}
                 <button 
                   onClick={() => setPaymentMethod('VNPay')}
                   className={cn(
                     "flex items-center p-4 rounded-[24px] border-2 transition-all duration-300 cursor-pointer text-left hover:-translate-y-0.5 hover:shadow-md",
                     paymentMethod === 'VNPay' ? "border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20 shadow-[0_8px_30px_-5px_rgba(20,184,166,0.15)]" : "bg-white border-gray-100 hover:border-gray-200"
                   )}
                 >
                    <div className="w-12 h-12 rounded-2xl bg-[#005BAA]/5 flex items-center justify-center shrink-0 mr-4">
                       <span className="font-black text-[#005BAA] tracking-tighter text-sm">VNPAY</span>
                    </div>
                    <div className="flex-1">
                       <p className="font-bold text-gray-900 text-[15px]">Thanh toán qua VNPay</p>
                    </div>
                    <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors", paymentMethod === 'VNPay' ? 'border-teal-500 bg-teal-500' : 'border-gray-300')}>
                       {paymentMethod === 'VNPay' && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
                    </div>
                 </button>

                 {/* MoMo Option */}
                 <button 
                   onClick={() => setPaymentMethod('MoMo')}
                   className={cn(
                     "flex items-center p-4 rounded-[24px] border-2 transition-all duration-300 cursor-pointer text-left hover:-translate-y-0.5 hover:shadow-md",
                     paymentMethod === 'MoMo' ? "border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20 shadow-[0_8px_30px_-5px_rgba(20,184,166,0.15)]" : "bg-white border-gray-100 hover:border-gray-200"
                   )}
                 >
                    <div className="w-12 h-12 rounded-2xl bg-[#A50064]/5 flex items-center justify-center shrink-0 mr-4 text-[#A50064] font-black">
                       MOMO
                    </div>
                    <div className="flex-1">
                       <p className="font-bold text-gray-900 text-[15px]">Thanh toán qua MoMo</p>
                    </div>
                    <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors", paymentMethod === 'MoMo' ? 'border-teal-500 bg-teal-500' : 'border-gray-300')}>
                       {paymentMethod === 'MoMo' && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
                    </div>
                 </button>

                 {/* ZaloPay Option */}
                 <button 
                   onClick={() => setPaymentMethod('ZaloPay')}
                   className={cn(
                     "flex items-center p-4 rounded-[24px] border-2 transition-all duration-300 cursor-pointer text-left hover:-translate-y-0.5 hover:shadow-md",
                     paymentMethod === 'ZaloPay' ? "border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20 shadow-[0_8px_30px_-5px_rgba(20,184,166,0.15)]" : "bg-white border-gray-100 hover:border-gray-200"
                   )}
                 >
                    <div className="w-12 h-12 rounded-2xl bg-[#008FE5]/5 flex items-center justify-center shrink-0 mr-4 text-[#008FE5] font-black">
                       ZALO
                    </div>
                    <div className="flex-1">
                       <p className="font-bold text-gray-900 text-[15px]">Thanh toán qua ZaloPay</p>
                    </div>
                    <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors", paymentMethod === 'ZaloPay' ? 'border-teal-500 bg-teal-500' : 'border-gray-300')}>
                       {paymentMethod === 'ZaloPay' && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
                    </div>
                 </button>

                 {/* Transfer Option */}
                 <button 
                   onClick={() => setPaymentMethod('Transfer')}
                   className={cn(
                     "flex items-center p-4 rounded-[24px] border-2 transition-all duration-300 cursor-pointer text-left hover:-translate-y-0.5 hover:shadow-md",
                     paymentMethod === 'Transfer' ? "border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20 shadow-[0_8px_30px_-5px_rgba(20,184,166,0.15)]" : "bg-white border-gray-100 hover:border-gray-200"
                   )}
                 >
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mr-4 transition-colors", paymentMethod === 'Transfer' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600')}>
                       <CreditCard size={24} strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                       <p className="font-bold text-gray-900 text-[15px]">Chuyển khoản</p>
                    </div>
                    <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors", paymentMethod === 'Transfer' ? 'border-teal-500 bg-teal-500' : 'border-gray-300')}>
                       {paymentMethod === 'Transfer' && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
                    </div>
                 </button>
              </div>
           </div>
        )}

        {/* Transfer Details (Shown only when Transfer is selected) */}
        {paymentMethod === 'Transfer' && invoice.bankInfo && (
           <m.div
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="p-6 bg-white rounded-[32px] border border-gray-200 shadow-xl space-y-6"
           >
              <div className="text-center space-y-1">
                 <p className="text-[11px] font-black uppercase tracking-widest text-teal-600">Quét mã VietQR</p>
                 <p className="text-sm font-medium text-gray-500">Mở app Ngân hàng để quét mã</p>
              </div>
              
              <div className="bg-white p-4 rounded-[24px] border border-gray-100 w-fit mx-auto shadow-sm">
                 <QRCodeSVG value={invoice.bankInfo.qrContent} size={200} />
              </div>

              <div className="space-y-3 bg-gray-50 p-5 rounded-[24px] border border-gray-100">
                 <div className="flex justify-between items-center group">
                    <div className="space-y-0.5">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ngân hàng</p>
                       <p className="text-sm font-black text-gray-800">{invoice.bankInfo.bankName}</p>
                    </div>
                 </div>
                 <div className="flex justify-between items-center group">
                    <div className="space-y-0.5">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chủ tài khoản</p>
                       <p className="text-sm font-black text-gray-800">{invoice.bankInfo.accountName}</p>
                    </div>
                 </div>
                 <div className="flex justify-between items-center group">
                    <div className="space-y-0.5">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Số tài khoản</p>
                       <p className="text-lg font-black text-teal-600 tabular-nums tracking-tighter">{invoice.bankInfo.accountNumber}</p>
                    </div>
                     <button 
                       onClick={() => handleCopy(invoice.bankInfo!.accountNumber, `${invoice.id}-accountNumber`, 'Số tài khoản')} 
                       aria-label="Sao chép số tài khoản"
                       className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-600 active:scale-95 transition-transform hover:bg-slate-100"
                     >
                        {copiedStates[`${invoice.id}-accountNumber`] ? <CheckCircle2 size={16} className="text-teal-600" /> : <Copy size={16} />}
                     </button>
                 </div>
                 <div className="flex justify-between items-center group pt-3 mb-1 border-t border-gray-200/50">
                    <div className="space-y-0.5 max-w-[70%]">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nội dung (Bắt buộc)</p>
                       <p className="text-sm font-black text-red-600 break-words">{invoice.invoiceCode}</p>
                    </div>
                     <button 
                       onClick={() => handleCopy(invoice.invoiceCode, `${invoice.id}-invoiceCode`, 'Nội dung')} 
                       aria-label="Sao chép nội dung chuyển khoản"
                       className="w-10 h-10 bg-red-50 rounded-xl shadow-sm border border-red-100 flex items-center justify-center text-red-600 active:scale-95 transition-transform hover:bg-red-100"
                     >
                        {copiedStates[`${invoice.id}-invoiceCode`] ? <CheckCircle2 size={16} className="text-teal-600" /> : <Copy size={16} />}
                     </button>
                 </div>
              </div>
           </m.div>
        )}

      </div>

      {/* Pay Button Sticky Bottom CTA */}
      {isUnpaid && (
        <div className="sticky bottom-0 p-5 bg-white/90 backdrop-blur-2xl border-t border-gray-100 z-40 mt-auto">
           <div className="max-w-[900px] mx-auto flex items-center gap-4 group">
              <button 
                onClick={handlePay}
                disabled={!paymentMethod || processing || (paymentMethod === 'Wallet' && walletBalance < invoice.totalAmount)}
                title={
                  !paymentMethod 
                    ? "Chọn phương thức thanh toán" 
                    : (paymentMethod === 'Wallet' && walletBalance < invoice.totalAmount)
                      ? `Số dư không đủ (${formatVND(walletBalance)}) - Cần nộp thêm ${formatVND(invoice.totalAmount - walletBalance)}`
                      : ""
                }
                className={cn(
                   "w-full h-14 rounded-[20px] text-[13px] font-black uppercase tracking-[3px] flex items-center justify-center gap-3 transition-all duration-300",
                   paymentMethod && !processing && !(paymentMethod === 'Wallet' && walletBalance < invoice.totalAmount)
                     ? "bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-600 text-white shadow-[0_8px_30px_-5px_rgba(20,184,166,0.4)] hover:shadow-[0_12px_40px_-5px_rgba(20,184,166,0.6)] active:scale-[0.98] hover:-translate-y-0.5" 
                     : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60 border border-gray-200"
                )}
              >
                {processing ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : (
                    `Thanh toán ${formatVND(invoice.totalAmount)}`
                 )}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
