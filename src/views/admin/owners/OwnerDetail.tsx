import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Building2, User, Phone,
  Mail, MapPin, History,
  Download, Edit, CheckCircle2,
  TrendingUp, Home, CalendarDays
} from 'lucide-react';
import { buildingService } from '@/services/buildingService';
import { OwnerDetail as OwnerDetailModel, UpdateOwnerData } from '@/models/Owner';
import { formatDate } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { EmptyState } from '@/components/ui/StatusStates';
import { toast } from 'sonner';
import { OwnerModal } from './OwnerModal';

const DEFAULT_OWNER_AVATAR_URL = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const OwnerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  const { data: owner, isLoading } = useQuery<OwnerDetailModel>({
    queryKey: ['owner', id],
    enabled: Boolean(id),
    queryFn: () => buildingService.getOwnerDetail(id as string),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateOwnerData) => buildingService.updateOwner(id as string, data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['owner', id] }),
        queryClient.invalidateQueries({ queryKey: ['owners'] }),
      ]);
      setIsEditModalOpen(false);
      toast.success('Cập nhật chủ sở hữu thành công');
    },
    onError: () => toast.error('Có lỗi xảy ra khi cập nhật chủ sở hữu'),
  });

  const activityItems = React.useMemo(() => {
    if (!owner?.buildingsOwned?.length) return [];

    return [...owner.buildingsOwned]
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .map((building) => ({
        key: building.buildingId,
        title: `Đã ghi nhận quyền sở hữu tại ${building.buildingName}`,
        date: building.startDate,
        status: building.ownershipType === 'FullOwner' ? 'Sở hữu toàn phần' : 'Đồng sở hữu',
      }));
  }, [owner]);

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;
  if (!owner) return <div className="p-8 text-center bg-white rounded-3xl m-8 shadow-xl">Không tìm thấy thông tin chủ sở hữu.</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-3 hover:bg-bg rounded-2xl transition-all border border-border/50 shadow-sm">
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-[28px] bg-primary/10 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
              {owner.avatarUrl ? (
                <img src={owner.avatarUrl || DEFAULT_OWNER_AVATAR_URL} alt={owner.fullName} className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-primary" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-display text-primary font-tnr tracking-tighter">{owner.fullName}</h1>
                <span className="px-3 py-1 bg-primary text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-primary/20">
                  Chủ đầu tư chính
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-small text-muted font-medium mt-1">
                <span className="flex items-center gap-1.5"><Phone size={14} /> {owner.phone}</span>
                <span className="flex items-center gap-1.5"><Mail size={14} /> {owner.email}</span>
                <span className="flex items-center gap-1.5"><MapPin size={14} /> {owner.address || 'Chưa cập nhật địa chỉ'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled
            title="Chức năng xuất hồ sơ thuế chưa khả dụng"
            className="btn-outline flex items-center gap-2 opacity-50 cursor-not-allowed"
          >
            <Download size={18} /> Hồ sơ thuế
          </button>
          <button
            type="button"
            className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20 px-8"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit size={18} /> Chỉnh sửa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <div className="card-container p-8 space-y-8 bg-white shadow-xl shadow-primary/5">
            <h3 className="text-h3 text-primary border-b pb-4 font-tnr">Thông tin pháp lý</h3>

            <div className="space-y-6">
              <div>
                <p className="text-label text-muted mb-1">Mã chủ sở hữu</p>
                <p className="text-body font-black text-text font-mono uppercase tracking-widest">{owner.id}</p>
              </div>
              <div>
                <p className="text-label text-muted mb-1">CMND/CCCD</p>
                <p className="text-body font-black text-text">{owner.cccd || 'Chưa cập nhật'}</p>
              </div>
              <div>
                <p className="text-label text-muted mb-1">Mã số thuế</p>
                <p className="text-body font-black text-text">{owner.taxCode || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div className="pt-6 border-t font-medium text-muted text-small flex items-center gap-2">
              <CheckCircle2 size={16} className="text-success" /> Danh tính đã được xác thực
            </div>
          </div>

          <div className="card-container p-8 space-y-6 bg-gradient-to-br from-primary to-blue-900 text-white border-none shadow-2xl shadow-primary/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 -rotate-12 translate-x-8 -translate-y-8">
              <TrendingUp size={160} />
            </div>

            <div className="relative z-10">
              <p className="text-label text-white/60 mb-8 tracking-[4px]">Tổng tài sản quản lý</p>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[28px] font-black leading-none">{owner.totalBuildings}</p>
                  <p className="text-[10px] text-white/50 uppercase font-black tracking-widest">Tòa nhà</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[28px] font-black leading-none">{owner.totalRooms}</p>
                  <p className="text-[10px] text-white/50 uppercase font-black tracking-widest">Phòng đang quản lý</p>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-between">
                <p className="text-small font-bold">Ngày ghi nhận gần nhất</p>
                <span className="text-[11px] font-black bg-white/10 text-white px-2 py-0.5 rounded-lg border border-white/10">
                  {activityItems[0]?.date ? formatDate(activityItems[0].date) : 'Chưa có dữ liệu'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-h2 text-primary flex items-center gap-3 font-tnr">
              <Home size={24} /> Bất động sản đang quản lý
            </h2>
            <button
              type="button"
              disabled
              title="Chức năng thêm dự án từ hồ sơ chủ sở hữu chưa khả dụng"
              className="flex items-center gap-2 text-[11px] font-black uppercase text-primary/50 cursor-not-allowed"
            >
              Thêm dự án
            </button>
          </div>

          {owner.buildingsOwned.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {owner.buildingsOwned.map((building) => (
                <div
                  key={building.buildingId}
                  className="card-container p-6 group hover:translate-x-2 transition-all duration-300 cursor-pointer overflow-hidden relative shadow-lg shadow-primary/5 bg-white/70 backdrop-blur-md"
                  onClick={() => navigate(`/admin/buildings/${building.buildingId}`)}
                >
                  <div className="flex items-start justify-between relative z-10">
                    <div className="space-y-1">
                      <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm border border-primary/10">
                        <Building2 size={24} />
                      </div>
                      <h4 className="text-h3 font-black text-primary pt-3">{building.buildingName}</h4>
                      <p className="text-[10px] text-muted font-bold uppercase tracking-wider">{building.buildingCode}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-xl bg-primary/5 text-primary border border-primary/10">
                      {building.ownershipPercent}%
                    </span>
                  </div>

                  <div className="mt-8 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-[9px] text-muted font-black uppercase tracking-tighter">Vai trò</p>
                        <p className="text-body font-black text-secondary">
                          {building.ownershipType === 'FullOwner' ? 'Chính' : 'Phối hợp'}
                        </p>
                      </div>
                      <div className="w-px h-6 bg-border/50" />
                      <div className="text-center">
                        <p className="text-[9px] text-muted font-black uppercase tracking-tighter">Bắt đầu</p>
                        <p className="text-body font-black text-primary">{formatDate(building.startDate)}</p>
                      </div>
                    </div>
                    <span className="p-2 bg-primary/5 text-primary rounded-xl opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                      <ArrowLeft size={16} className="rotate-180" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-container bg-white/70">
              <EmptyState
                icon={Building2}
                title="Chưa có tòa nhà nào được gán"
                message="Hồ sơ chủ sở hữu này hiện chưa có dữ liệu bất động sản liên kết."
              />
            </div>
          )}

          <div className="card-container p-8 space-y-6 bg-white overflow-hidden shadow-xl shadow-primary/5">
            <h3 className="text-h3 text-primary flex items-center gap-3 font-tnr">
              <History size={20} /> Nhật ký hoạt động
            </h3>

            {activityItems.length ? (
              <div className="space-y-6">
                {activityItems.map((item) => (
                  <div key={item.key} className="flex gap-4 group/log">
                    <div className="w-10 h-10 rounded-2xl bg-bg border border-border flex items-center justify-center text-muted group-hover/log:bg-primary group-hover/log:text-white transition-all duration-300 shadow-sm shrink-0">
                      <CalendarDays size={18} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-body font-bold text-text group-hover/log:text-primary transition-colors">{item.title}</p>
                      <p className="text-small text-muted font-medium flex items-center gap-2">
                        {formatDate(item.date)} • <span className="text-success text-[10px] font-black uppercase">{item.status}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-primary/20 bg-bg/20 p-8 text-center text-muted">
                Chưa có lịch sử hoạt động chi tiết từ dữ liệu thực.
              </div>
            )}
          </div>
        </div>
      </div>

      <OwnerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={owner}
        onSubmit={(data) => updateMutation.mutate(data)}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
};

export default OwnerDetail;
