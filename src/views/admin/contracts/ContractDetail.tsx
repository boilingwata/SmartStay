import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, FileText, Edit, History, Printer, 
  LogOut, Plus, User, Zap, ShieldCheck, 
  Clock, Receipt, FilePlus, ExternalLink, Home,
  Calendar, Wallet, Users, Download, Edit2, 
  ChevronRight, MoreVertical
} from 'lucide-react';
import { contractService } from '@/services/contractService';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ContractTimelineBar } from '@/components/contracts/ContractTimelineBar';
import { cn, formatVND } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { toast } from 'sonner';
import { ExtendContractModal } from '@/components/contracts/modals/ExtendContractModal';
import { TerminateContractModal } from '@/components/contracts/modals/TerminateContractModal';
import { CreateAddendumModal } from '@/components/contracts/modals/CreateAddendumModal';
import { LiquidationModal } from '@/components/contracts/modals/LiquidationModal';

const ContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isExtendModalOpen, setExtendModalOpen] = useState(false);
  const [isTerminateModalOpen, setTerminateModalOpen] = useState(false);
  const [isAddendumModalOpen, setAddendumModalOpen] = useState(false);
  const [isLiquidationModalOpen, setLiquidationModalOpen] = useState(false);

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => contractService.getContractDetail(id as string),
    enabled: !!id
  });

  if (isLoading) return (
    <div className="h-[600px] flex items-center justify-center">
      <Spinner className="w-12 h-12" />
    </div>
  );

  if (!contract) return (
    <div className="p-20 text-center">
      <h2 className="text-h2 mb-4 text-primary font-black">Contract not found</h2>
      <button onClick={() => navigate('/admin/contracts')} className="btn-outline mt-4">Quay lại</button>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: FileText },
    { id: 'tenants', label: 'Cư dân', icon: User },
    { id: 'services', label: 'Dịch vụ', icon: Zap },
    { id: 'signers', label: 'Đại diện ký', icon: ShieldCheck },
    { id: 'extensions', label: 'Gia hạn', icon: Clock },
    { id: 'addendums', label: 'Phụ lục', icon: FilePlus },
    { id: 'invoices', label: 'Hóa đơn', icon: Receipt },
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
      {/* 2.2.1 PageHeader */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/50">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[3px] text-muted mb-4 overflow-hidden">
          <Link to="/admin/dashboard" className="hover:text-primary transition-colors flex items-center gap-1"><Home size={12} /> Dashboard</Link>
          <ChevronRight size={14} className="text-muted/30" />
          <Link to="/admin/contracts" className="hover:text-primary transition-colors">Hợp đồng</Link>
          <ChevronRight size={14} className="text-muted/30" />
          <Link to={`/admin/contracts/${id}`} className="font-bold text-primary truncate max-w-[200px]">{id}</Link>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <h1 className="text-display font-mono text-primary">{contract.contractCode}</h1>
            <StatusBadge status={contract.status} size="lg" />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-outline flex items-center gap-2" onClick={() => toast.info('Tính năng chỉnh sửa đang phát triển')}><Edit size={18} /> Sửa</button>
            <button className="btn-outline flex items-center gap-2" onClick={() => setAddendumModalOpen(true)}><FilePlus size={18} /> Tạo phụ lục</button>
            <button className="btn-outline flex items-center gap-2" onClick={() => setLiquidationModalOpen(true)}><Receipt size={18} /> Thanh lý</button>
            <button className="btn-primary flex items-center gap-2" onClick={() => setExtendModalOpen(true)}>Gia hạn</button>
            <button className="btn-danger-outline flex items-center gap-2" onClick={() => setTerminateModalOpen(true)}><LogOut size={18} /> Chấm dứt</button>
          </div>
        </div>
      </div>

      {/* 2.2.2 Contract Timeline Bar */}
      <div className="card-container p-6 bg-white">
        <h3 className="text-small font-bold text-muted uppercase tracking-widest mb-4">Tiến độ thời gian hợp đồng</h3>
        <ContractTimelineBar startDate={contract.startDate} endDate={contract.endDate} />
      </div>

      {/* 2.2.3 Tab Structure */}
      <div className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        <div className="flex overflow-x-auto border-b bg-bg/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-small font-bold transition-all border-b-2 whitespace-nowrap",
                activeTab === tab.id 
                  ? "border-primary text-primary bg-white" 
                  : "border-transparent text-muted hover:text-primary hover:bg-white/50"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8 min-h-[400px]">
          {activeTab === 'overview' && <OverviewTab contract={contract} />}
          {activeTab === 'tenants' && <TenantsTab tenants={contract.tenants} />}
          {activeTab === 'services' && <ServicesTab services={contract.services} />}
          {/* Remaining tabs are simplified placeholders for now */}
          {['signers', 'extensions', 'addendums', 'invoices'].includes(activeTab) && (
             <div className="flex flex-col items-center justify-center p-20 text-muted/30">
               <History size={64} />
               <p className="mt-4 font-bold text-body">Tính năng đang tải dữ liệu...</p>
             </div>
          )}
        </div>
      </div>

      <ExtendContractModal 
        isOpen={isExtendModalOpen} 
        onClose={() => setExtendModalOpen(false)} 
        contract={contract}
      />

      <TerminateContractModal
        isOpen={isTerminateModalOpen}
        onClose={() => setTerminateModalOpen(false)}
        contract={contract}
      />

      <CreateAddendumModal
        isOpen={isAddendumModalOpen}
        onClose={() => setAddendumModalOpen(false)}
        contract={contract}
      />

      <LiquidationModal
        isOpen={isLiquidationModalOpen}
        onClose={() => setLiquidationModalOpen(false)}
        contract={contract}
      />
    </div>
  );
};

const OverviewTab = ({ contract }: { contract: any }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
    <div className="space-y-8">
      <div>
        <h4 className="text-h3 text-primary mb-6 flex items-center gap-2">
          <div className="w-1.5 h-6 bg-primary rounded-full"></div> Thông tin cơ bản
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
          <InfoItem label="Mã hợp đồng" value={contract.contractCode} isMono />
          <InfoItem label="Loại hợp đồng" value={contract.type === 'Residential' ? 'Cư dân' : 'Thương mại'} isBadge />
          <InfoItem label="Ngày bắt đầu" value={contract.startDate} />
          <InfoItem label="Ngày kết thúc" value={contract.endDate} />
          <InfoItem label="Chu kỳ thanh toán" value={`${contract.paymentCycle} tháng/kỳ`} />
          <InfoItem label="Ngày đến hạn" value={`Mùng ${contract.paymentDueDay} hàng tháng`} />
          <InfoItem label="Tự động gia hạn" value={contract.autoRenew ? 'Có' : 'Không'} />
          <InfoItem label="Thời hạn báo trước" value={`${contract.noticePeriodDays || 30} ngày`} />
        </div>
      </div>
    </div>

    <div className="space-y-8">
      <div>
        <h4 className="text-h3 text-primary mb-6 flex items-center gap-2">
          <div className="w-1.5 h-6 bg-success rounded-full"></div> Tài chính & Cọc
        </h4>
        <div className="bg-bg/30 p-6 rounded-2xl border border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <InfoItem label="Tiền thuê cố định" value={formatVND(contract.rentPriceSnapshot)} isSuccess />
          <InfoItem label="Tiền đặt cọc" value={formatVND(contract.depositAmount)} />
          <InfoItem label="Trạng thái cọc" value={contract.depositStatus} isBadge />
        </div>
      </div>
            <div className="p-8 bg-white/60 rounded-[40px] border border-primary/5 hover:border-primary/10 transition-all group flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary/5 text-primary rounded-[24px] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Home size={32} /></div>
          <p className="text-[10px] text-muted font-black uppercase tracking-widest mb-1">Căn hộ / Phòng</p>
          <p className="text-xl font-display font-black text-primary mb-4 uppercase">{contract.roomName}</p>
          <Link to={`/admin/rooms/${contract.roomId}`} className="text-small font-bold text-secondary flex items-center gap-1 hover:underline">
            Chi tiết phòng <ExternalLink size={14} />
          </Link>
        </div>
    </div>
  </div>
);

const TenantsTab = ({ tenants }: { tenants: any[] }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead>
        <tr className="border-b text-small font-bold text-muted uppercase">
          <th className="py-4">Cư dân</th>
          <th className="py-4">CCCD</th>
          <th className="py-4">Ngày tham gia</th>
          <th className="py-4 text-center">Vai trò</th>
          <th className="py-4 text-right">Hành động</th>
        </tr>
      </thead>
      <tbody>
        {tenants.map((t) => (
          <tr key={t.id} className="border-b border-border/30 hover:bg-bg/20 transition-colors">
            <td className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {t.fullName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-primary">{t.fullName}</p>
                  <p className="text-[10px] text-muted">ID: {t.id}</p>
                </div>
              </div>
            </td>
            <td className="py-4 font-mono text-small">****{t.cccd.slice(-4)}</td>
            <td className="py-4 text-small">{t.joinedAt}</td>
            <td className="py-4 text-center">
              {t.isRepresentative && (
                <span className="px-3 py-1 bg-accent/10 text-accent text-[10px] font-bold rounded-full uppercase">Đại diện</span>
              )}
            </td>
            <td className="py-4 text-right">
              <button className="p-2 text-muted hover:text-primary transition-colors"><Edit size={16} /></button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <button className="btn-outline w-full mt-6 py-3 border-dashed flex items-center justify-center gap-2">
      <Plus size={18} /> Thêm cư dân vào hợp đồng
    </button>
  </div>
);

const ServicesTab = ({ services }: { services: any[] }) => (
  <div className="space-y-6">
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b text-small font-bold text-muted uppercase">
            <th className="py-4">Dịch vụ</th>
            <th className="py-4 text-right">Đơn giá (Snapshot)</th>
            <th className="py-4 text-center">Đơn vị</th>
            <th className="py-4 text-center">Số lượng</th>
            <th className="py-4 text-right">Thành tiền/Kỳ</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id} className="border-b border-border/30">
              <td className="py-4 font-bold text-primary">{s.serviceName}</td>
              <td className="py-4 text-right font-display font-bold">{formatVND(s.unitPriceSnapshot)}</td>
              <td className="py-4 text-center text-small text-muted">{s.unit}</td>
              <td className="py-4 text-center font-bold">{s.quantity}</td>
              <td className="py-4 text-right font-display font-bold text-primary">{formatVND(s.unitPriceSnapshot * s.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="bg-warning/5 p-4 rounded-xl border border-warning/20 flex gap-3">
      <Zap className="text-warning shrink-0" size={20} />
      <p className="text-small text-warning font-medium">
        <strong>Lưu ý về giá dịch vụ:</strong> Theo <strong>RULE-04</strong>, đơn giá trên là snapshot tại thời điểm ký hợp đồng. 
        Mọi thay đổi giá trong hệ thống "Dịch vụ & Giá" sẽ không ảnh hưởng đến hợp đồng này trừ khi có phụ lục thay đổi giá.
      </p>
    </div>
  </div>
);

const InfoItem = ({ label, value, isMono, isBadge, isSuccess }: any) => (
  <div className="space-y-1">
    <p className="text-[11px] text-muted font-bold uppercase tracking-wider">{label}</p>
    <p className={cn(
      "text-body font-medium",
      isMono && "font-mono font-bold text-primary bg-bg/50 px-2 py-0.5 rounded",
      isBadge && "inline-block px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase",
      isSuccess && "text-success font-display font-bold text-lg"
    )}>
      {value}
    </p>
  </div>
);

export default ContractDetail;
