import React from 'react';
import { Download, FileText, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui';
import { getContractAddendumSourceLabel, getContractAddendumTypeLabel } from '@/lib/contractAddendums';
import portalAddendumService from '@/services/portalAddendumService';
import { formatDate } from '@/utils';
import { toast } from 'sonner';

const AddendumListPage = () => {
  const { data: addendums = [], isLoading } = useQuery({
    queryKey: ['contract-addendums-admin'],
    queryFn: () => portalAddendumService.listAdminAddendums(),
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h2 font-black text-primary uppercase tracking-tighter">Phu luc hop dong</h2>
          <p className="text-small text-muted italic">
            Theo doi thay doi gia, tai san tinh phi va cac dieu chinh sau khi hop dong da chay.
          </p>
        </div>
        <button
          onClick={() => toast.info('Phu luc moi duoc tao tu man hop dong hoac tu dong khi gan tai san tinh phi.')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Xem quy trinh tao
        </button>
      </div>

      <div className="card-container overflow-hidden bg-white p-0 shadow-xl shadow-primary/5">
        <table className="w-full text-left">
          <thead className="bg-bg/40 border-b">
            <tr>
              <th className="px-6 py-4 text-label text-muted">Phu luc</th>
              <th className="px-6 py-4 text-label text-muted">Hop dong goc</th>
              <th className="px-6 py-4 text-label text-muted">Khach thue</th>
              <th className="px-6 py-4 text-label text-muted">Ngay hieu luc</th>
              <th className="px-6 py-4 text-label text-muted">Trang thai</th>
              <th className="px-6 py-4 text-label text-muted text-right">Tai lieu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/10">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <Spinner />
                </td>
              </tr>
            ) : addendums.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-muted">
                  Chua co phu luc nao.
                </td>
              </tr>
            ) : (
              addendums.map((addendum) => (
                <tr key={addendum.id} className="group hover:bg-bg/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 rounded-2xl bg-primary/5 p-3 text-primary">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-small font-bold text-primary">{addendum.title}</p>
                        <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-muted">
                          {addendum.addendumCode}
                        </p>
                        <p className="mt-2 text-[11px] text-muted">
                          {getContractAddendumTypeLabel(addendum.type)} • {getContractAddendumSourceLabel(addendum.sourceType)} • Version {addendum.versionNo}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-small font-bold text-text">{addendum.contractCode}</p>
                    <p className="text-[11px] text-muted">
                      {addendum.buildingName}
                      {addendum.roomCode ? ` • ${addendum.roomCode}` : ''}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-small text-muted italic">{addendum.tenantName || '-'}</td>
                  <td className="px-6 py-4 text-small text-text">{formatDate(addendum.effectiveDate)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={addendum.status as any} size="sm" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {addendum.fileUrl ? (
                      <a
                        href={addendum.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2 text-muted transition-all hover:bg-white hover:text-primary"
                      >
                        <Download size={16} />
                        Tai file
                      </a>
                    ) : (
                      <span className="text-[11px] font-bold uppercase tracking-widest text-muted">Chua co file</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AddendumListPage;
