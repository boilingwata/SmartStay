import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2, DoorOpen, FileSearch, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buildingService } from '@/services/buildingService';
import ownerLeadService from '@/services/ownerLeadService';
import { roomService } from '@/services/roomService';
import { formatVND } from '@/utils';

const MarketplaceDashboard: React.FC = () => {
  const { data: buildings = [] } = useQuery({
    queryKey: ['marketplace-dashboard', 'buildings'],
    queryFn: () => buildingService.getBuildings(),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['marketplace-dashboard', 'rooms'],
    queryFn: () => roomService.getRooms({ sortBy: 'code', sortOrder: 'asc' }),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['marketplace-dashboard', 'leads'],
    queryFn: () => ownerLeadService.getLeadSummaries(),
  });

  const vacantRooms = rooms.filter((room) => room.status === 'Vacant').length;
  const latestLeads = leads.slice(0, 4);

  const cards = [
    {
      label: 'Tòa nhà',
      value: buildings.length,
      helper: 'Danh mục đang hiển thị trong workspace',
      icon: Building2,
      href: '/owner/buildings',
      cta: 'Xem tòa nhà',
    },
    {
      label: 'Tin đang quản lý',
      value: rooms.length,
      helper: `${vacantRooms} phòng đang sẵn sàng nhận khách thuê`,
      icon: DoorOpen,
      href: '/owner/rooms',
      cta: 'Quản lý tin đăng',
    },
    {
      label: 'Đơn thuê mới',
      value: leads.length,
      helper: 'Tập trung vào khách đang cần phản hồi',
      icon: FileSearch,
      href: '/owner/leads',
      cta: 'Xem đơn thuê',
    },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-border/70 bg-card p-8 shadow-[0_24px_72px_-48px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-secondary">
              Marketplace workspace
            </p>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              Tập trung vào tin đăng và khách thuê.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted">
              Đây là bề mặt launch tối giản cho chủ nhà và đội hỗ trợ nội bộ: quản lý danh mục,
              cập nhật phòng đang trống và theo dõi đơn thuê mới.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/owner/rooms"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-black text-primary-foreground transition-all hover:bg-primary/95"
            >
              <Plus size={16} />
              Cập nhật tin đăng
            </Link>
            <Link
              to="/owner/leads"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-5 text-sm font-black text-foreground transition-all hover:border-primary/25 hover:text-primary"
            >
              Kiểm tra đơn thuê
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.href}
            className="rounded-[28px] border border-border/70 bg-card p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.34)] transition-all hover:-translate-y-1 hover:border-primary/25"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <card.icon size={22} />
            </div>
            <p className="mt-5 text-[11px] font-black uppercase tracking-[0.2em] text-muted">
              {card.label}
            </p>
            <p className="mt-3 text-4xl font-black tracking-tight text-foreground">
              {card.value}
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">
              {card.helper}
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">
              {card.cta}
              <ArrowRight size={16} />
            </span>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[30px] border border-border/70 bg-card p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.34)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted">
                Đơn thuê gần đây
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">
                Khách đang chờ phản hồi
              </h2>
            </div>
            <Link to="/owner/leads" className="text-sm font-bold text-primary hover:underline">
              Xem tất cả
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {latestLeads.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-background/70 p-6 text-sm leading-7 text-muted">
                Chưa có đơn thuê mới. Khi khách gửi hồ sơ từ marketplace, danh sách này sẽ cập nhật tại đây.
              </div>
            ) : (
              latestLeads.map((lead) => (
                <div key={lead.id} className="rounded-[24px] border border-border/70 bg-background/70 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-black tracking-tight text-foreground">
                        {lead.applicantName}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {lead.roomCode} • {lead.buildingName}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
                      {lead.status.replaceAll('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
                    {lead.applicantPhone && <span>{lead.applicantPhone}</span>}
                    {lead.preferredMoveIn && <span>Vào ở: {lead.preferredMoveIn}</span>}
                    <span>Giá thuê: {formatVND(lead.rentAmount)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-[30px] border border-border/70 bg-card p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.34)]">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted">
            Launch boundary
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">
            Những gì chưa đưa vào launch
          </h2>
          <div className="mt-6 space-y-3 text-sm leading-7 text-muted">
            <p className="rounded-[22px] bg-background/70 px-4 py-4">
              Hợp đồng, hóa đơn, thanh toán, ticket, báo cáo và các không gian resident portal đã được rút khỏi bề mặt launch.
            </p>
            <p className="rounded-[22px] bg-background/70 px-4 py-4">
              Workspace này chỉ giữ lại phần việc cần để xuất bản phòng trống, nhận đơn thuê và phản hồi khách.
            </p>
            <p className="rounded-[22px] bg-background/70 px-4 py-4">
              Nếu cần mở rộng sau launch, có thể kích hoạt lại từng module từ codebase hiện có thay vì xây mới từ đầu.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
};

export default MarketplaceDashboard;
