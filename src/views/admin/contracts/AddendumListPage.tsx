import React from 'react';
import { FileText, ShieldCheck, Clock, Download, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { contractService } from '@/services/contractService';
import { formatDate, cn } from '@/utils';
import { StatusBadge } from '@/components/ui';
import { Spinner } from '@/components/ui/Feedback';
import { toast } from 'sonner';

const AddendumListPage = () => {
    const { data: contracts, isLoading } = useQuery({
        queryKey: ['contracts_with_addendums'],
        queryFn: () => contractService.getContracts({})
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-h2 font-black text-primary uppercase tracking-tighter">Phụ lục Hợp đồng</h2>
                    <p className="text-small text-muted italic">Quản lý các thay đổi và bổ sung điều khoản hợp đồng</p>
                </div>
                <button onClick={() => toast.info('Chức năng đang phát triển để kết nối Backend')} className="btn-primary flex items-center gap-2">
                    <Plus size={18} /> Tạo phụ lục mới
                </button>
            </div>

            <div className="card-container bg-white p-0 overflow-hidden shadow-xl shadow-primary/5">
                <table className="w-full text-left">
                    <thead className="bg-bg/40 border-b">
                        <tr>
                            <th className="px-6 py-4 text-label text-muted">Phụ lục</th>
                            <th className="px-6 py-4 text-label text-muted">Hợp đồng gốc</th>
                            <th className="px-6 py-4 text-label text-muted">Người thuê</th>
                            <th className="px-6 py-4 text-label text-muted">Trạng thái</th>
                            <th className="px-6 py-4 text-label text-muted text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/10">
                        {isLoading ? (
                            <tr><td colSpan={5} className="py-20 text-center"><Spinner /></td></tr>
                        ) : [1, 2, 3].map((i) => (
                            <tr key={i} className="group hover:bg-bg/10 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-small font-bold text-primary">Phụ lục điều chỉnh giá thue v{i}</span>
                                        <span className="text-[10px] text-muted font-mono uppercase tracking-widest mt-1">ADD-2024-00{i}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-small font-medium text-text">CON-10029{i}</td>
                                <td className="px-6 py-4 text-small text-muted italic">Nguyễn Văn {i % 2 === 0 ? 'A' : 'B'}</td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={(i % 2 === 0 ? 'Signed' : 'Draft') as any} size="sm" />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => toast.info('Chức năng đang phát triển để kết nối Backend')} className="p-2 hover:bg-white rounded-xl shadow-sm border border-border/50 text-muted hover:text-primary transition-all">
                                        <Download size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AddendumListPage;
