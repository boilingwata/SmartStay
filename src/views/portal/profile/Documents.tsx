import React, { useState } from 'react';
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
  FolderOpen,
  ShieldCheck,
  CreditCard,
  FileBadge
} from 'lucide-react';
import { cn, formatDate } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { toast } from 'sonner';
import portalDocumentService from '@/services/portalDocumentService';

const Documents = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromOnboarding = searchParams.get('from') === 'onboarding';
  const [searchQuery, setSearchQuery] = useState('');

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['portal-documents'],
    queryFn: () => portalDocumentService.getDocuments()
  });

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [
    { label: 'Hợp đồng', count: documents.filter(d => d.type === 'Contract').length, icon: FileCheck, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Biên lai', count: documents.filter(d => d.type === 'Receipt').length, icon: Receipt, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Giấy tờ', count: documents.filter(d => d.type === 'ID').length, icon: FilePlus, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  if (isLoading) return <div className="py-20 flex justify-center items-center"><Spinner /></div>;

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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* 3. Document List */}
            <div className="space-y-6 text-left">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[12px] font-black text-primary/40 uppercase tracking-[0.3em] flex items-center gap-2">
                        <FolderOpen size={18} className="text-primary" /> Tệp tin ({filteredDocs.length})
                    </h3>
                </div>

                <div className="space-y-4">
                    {filteredDocs.length > 0 ? (
                        filteredDocs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)
                    ) : (
                        <div className="py-12 flex flex-col items-center text-center opacity-40">
                            <FolderOpen size={48} className="mb-4 text-slate-300" />
                            <p className="text-[13px] font-black uppercase tracking-widest text-slate-400">Không tìm thấy tài liệu nào</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

const DocumentCard = ({ doc }: { doc: any }) => {
  const isContract = doc.type === 'Contract';
  const isReceipt = doc.type === 'Receipt';

  const downloadFile = () => {
    if (doc.url) {
      window.open(doc.url, '_blank');
    } else {
      toast.error('Tài liệu chưa có bản kỹ thuật số để tải về');
    }
  };

  return (
    <div className="bg-white p-6 rounded-[36px] shadow-sm border border-slate-50 flex items-center justify-between group active:scale-[0.99] transition-all">
        <div className="flex items-center gap-5 overflow-hidden">
            <div className={cn(
                "w-12 h-12 rounded-[22px] flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner",
                isContract ? "bg-teal-50 text-teal-600" : 
                isReceipt ? "bg-orange-50 text-orange-600" : 
                "bg-blue-50 text-blue-600"
            )}>
                {isContract ? <ShieldCheck size={24} /> : 
                 isReceipt ? <CreditCard size={24} /> : 
                 <FileBadge size={24} />}
            </div>
            <div className="space-y-1 overflow-hidden">
                <h4 className="text-[13px] font-black text-slate-800 tracking-tight leading-none uppercase truncate group-hover:text-teal-600 transition-colors">{doc.name}</h4>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {doc.date ? formatDate(doc.date) : '—'} • {doc.category}
                </p>
            </div>
        </div>
        <button 
            onClick={downloadFile}
            className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm shrink-0",
                doc.url 
                    ? "bg-[#0D8A8A] text-white hover:scale-110 active:scale-95 shadow-teal-500/20" 
                    : "bg-slate-50 text-slate-300 pointer-events-none"
            )}
        >
            <Download size={18} />
        </button>
    </div>
  );
};

export default Documents;
