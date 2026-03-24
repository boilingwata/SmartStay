import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  Search,
  FileCheck,
  Receipt,
  FilePlus,
  ArrowRight,
  FolderOpen
} from 'lucide-react';
import { cn, formatDate } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { toast } from 'sonner';

const Documents = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromOnboarding = searchParams.get('from') === 'onboarding';

  // Mock data for Documents
  const mockDocuments = {
    items: [
      { id: '1', name: 'Hợp đồng thuê phòng 902 - Signed.pdf', size: '2.4 MB', type: 'Contract', date: '2024-03-01', status: 'Signed' },
      { id: '2', name: 'Biên lai thanh toán INV-2024-001.pdf', size: '840 KB', type: 'Receipt', date: '2024-03-10', status: 'Paid' },
      { id: '3', name: 'Phụ lục hợp đồng - Diện tích.pdf', size: '1.2 MB', type: 'Addendum', date: '2024-03-12', status: 'Pending' },
      { id: '4', name: 'Nội quy tòa nhà 2024.pdf', size: '3.1 MB', type: 'Policy', date: '2024-01-01', status: 'Active' },
      { id: '5', name: 'Biên lai tiền điện tháng 02.pdf', size: '420 KB', type: 'Receipt', date: '2024-02-28', status: 'Paid' },
    ]
  };

  const categories = [
    { label: 'Hợp đồng', count: 1, icon: FileCheck, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Biên lai', count: 8, icon: Receipt, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Phụ lục', count: 1, icon: FilePlus, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className={cn(
      'space-y-8 pb-32 animate-in fade-in duration-700',
      fromOnboarding && 'lg:max-w-[1100px] lg:mx-auto lg:px-8 lg:pb-16'
    )}>
        {fromOnboarding && (
            <div className="px-8 pt-8">
                <button
                    onClick={() => navigate('/portal/onboarding')}
                    className="w-full h-14 bg-white text-[#0D8A8A] rounded-[28px] font-black shadow-xl shadow-slate-200/40 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[11px] border border-slate-100 active:scale-[0.98] transition-all"
                >
                    <ArrowRight size={18} className="rotate-180" />
                    Back to onboarding
                </button>
            </div>
        )}

        {/* 1. Statistics / Categories */}
        <div className="px-8 pt-8">
            <div className="grid grid-cols-3 gap-4">
                {categories.map((cat, idx) => (
                    <div key={idx} className="bg-white/80 backdrop-blur-md p-6 rounded-[32px] border border-white flex flex-col items-center gap-3 shadow-xl shadow-primary/5 text-center group hover:-translate-y-1 transition-all">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg", cat.bg, cat.color)}>
                            <cat.icon size={24} className="stroke-[2.5]" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">{cat.label}</span>
                            <p className="text-xl font-black text-primary leading-none">{cat.count}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* 2. Search & List */}
        <div className="px-8 flex flex-col gap-8">
            <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm tài liệu của bạn..."
                    className="w-full h-16 bg-white rounded-3xl pl-14 pr-6 text-base font-bold border-2 border-transparent focus:border-primary/10 shadow-xl shadow-primary/5 transition-all outline-none placeholder:text-muted/40"
                />
            </div>

            {/* 3. Document List */}
            <div className="space-y-6 text-left">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[12px] font-black text-primary/40 uppercase tracking-[0.3em] flex items-center gap-2">
                        <FolderOpen size={18} className="text-primary" /> Tệp tin gần đây
                    </h3>
                    <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:opacity-70 transition-opacity">Xem tất cả</button>
                </div>

                <div className="space-y-4">
                    {mockDocuments.items.map((doc) => <DocumentCard key={doc.id} doc={doc} />)}
                </div>
            </div>
        </div>
    </div>
  );
};

const DocumentCard = ({ doc }: { doc: any }) => {
  const isContract = doc.type === 'Contract';

  return (
    <div className="bg-white p-6 rounded-[36px] shadow-sm border border-slate-50 flex items-center justify-between group active:scale-[0.99] transition-all">
        <div className="flex items-center gap-5">
            <div className={cn(
                "w-12 h-12 rounded-[22px] flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner",
                isContract ? "bg-teal-50 text-teal-600" : "bg-orange-50 text-orange-600"
            )}>
                <FileText size={24} strokeWidth={2} />
            </div>
            <div className="space-y-1">
                <h4 className="text-[13px] font-black text-slate-800 tracking-tight leading-none uppercase truncate max-w-[160px]">{doc.name}</h4>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{formatDate(doc.date)} • {doc.size}</p>
            </div>
        </div>
        <button onClick={() => toast.info('Chức năng đang phát triển để kết nối Backend')} className="w-10 h-10 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center group-hover:bg-[#0D8A8A] group-hover:text-white transition-all shadow-sm">
            <Download size={18} />
        </button>
    </div>
  );
};

export default Documents;
