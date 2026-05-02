import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, FileSearch, MapPin, Phone, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import ownerLeadService from '@/services/ownerLeadService';
import { cn, formatDate, formatVND } from '@/utils';
import type { DbRentalApplicationStatus } from '@/types/supabase';

const STATUS_LABELS: Record<DbRentalApplicationStatus, string> = {
  draft: 'Nháp',
  submitted: 'Mới gửi',
  under_review: 'Đang xem xét',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  cancelled: 'Đã hủy',
};

const STATUS_STYLES: Record<DbRentalApplicationStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  submitted: 'bg-primary/10 text-primary',
  under_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

const VERIFICATION_METHOD_LABELS: Record<string, string> = {
  id: 'Giấy tờ tùy thân',
  phone: 'Số điện thoại',
  email: 'Email',
};

function getVerificationMethodLabel(method?: string | null): string {
  if (!method) return 'Chưa chọn';
  return VERIFICATION_METHOD_LABELS[method] ?? 'Cách xác minh khác';
}

const LeadList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | DbRentalApplicationStatus>('all');

  const { data: leads = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['owner-rental-leads'],
    queryFn: () => ownerLeadService.getLeadSummaries(),
  });

  const filteredLeads = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesStatus = status === 'all' || lead.status === status;
      if (!matchesStatus) return false;

      if (!keyword) return true;

      return [
        lead.applicantName,
        lead.applicantPhone,
        lead.roomCode,
        lead.buildingName,
        lead.buildingAddress,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(keyword));
    });
  }, [leads, search, status]);

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-secondary">
            Đơn thuê
          </p>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Theo dõi khách đang chờ phản hồi.
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-muted">
            Màn hình này thay cho lớp tenant management nặng hơn. Chủ nhà và đội hỗ trợ chỉ cần xem ai đang quan tâm,
            họ muốn thuê phòng nào và thời điểm cần phản hồi.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Tổng đơn" value={leads.length} />
          <StatCard label="Đơn mới" value={leads.filter((lead) => lead.status === 'submitted').length} />
          <StatCard label="Đang xem xét" value={leads.filter((lead) => lead.status === 'under_review').length} />
        </div>
      </div>

      <section className="rounded-[30px] border border-border/70 bg-card p-5 shadow-[0_24px_72px_-48px_rgba(15,23,42,0.38)]">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_0.7fr_auto]">
          <label className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo khách thuê, số điện thoại, mã phòng hoặc tòa nhà"
              className="h-14 w-full rounded-2xl border border-border bg-background pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-primary/30"
            />
          </label>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as 'all' | DbRentalApplicationStatus)}
            className="h-14 rounded-2xl border border-border bg-background px-4 text-sm font-medium outline-none transition-all focus:border-primary/30"
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex h-14 items-center justify-center rounded-2xl border border-border bg-background px-5 text-sm font-bold text-foreground transition-all hover:border-primary/25 hover:text-primary"
          >
            Làm mới
          </button>
        </div>
      </section>

      {isLoading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-56 animate-pulse rounded-[30px] border border-border bg-card" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-[30px] border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Không tải được danh sách đơn thuê. Vui lòng kiểm tra lại quyền truy cập hoặc kết nối dữ liệu.
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-border bg-card p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <FileSearch size={28} />
          </div>
          <h2 className="mt-6 text-2xl font-black tracking-tight text-foreground">
            Chưa có đơn thuê phù hợp với bộ lọc hiện tại.
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            Khi khách gửi hồ sơ từ website công khai, danh sách này sẽ hiển thị ngay để đội phụ trách phản hồi nhanh.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {filteredLeads.map((lead) => (
            <article
              key={lead.id}
              className="rounded-[30px] border border-border/70 bg-card p-6 shadow-[0_24px_72px_-48px_rgba(15,23,42,0.38)]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted">
                    Ứng viên
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">
                    {lead.applicantName}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted">
                    {lead.applicantPhone && (
                      <span className="inline-flex items-center gap-2">
                        <Phone size={15} />
                        {lead.applicantPhone}
                      </span>
                    )}
                    {lead.submittedAt && (
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays size={15} />
                        {formatDate(lead.submittedAt, 'dd/MM/yyyy HH:mm')}
                      </span>
                    )}
                  </div>
                </div>

                <span className={cn('rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]', STATUS_STYLES[lead.status])}>
                  {STATUS_LABELS[lead.status]}
                </span>
              </div>

              <div className="mt-6 rounded-[24px] bg-background/80 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted">
                  Tin đăng quan tâm
                </p>
                <div className="mt-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-black tracking-tight text-foreground">
                      {lead.roomCode}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {lead.buildingName}
                    </p>
                    {lead.buildingAddress && (
                      <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-muted">
                        <MapPin size={15} className="mt-0.5 shrink-0" />
                        <span>{lead.buildingAddress}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">
                      Giá thuê
                    </p>
                    <p className="mt-2 text-lg font-black text-primary">
                      {formatVND(lead.rentAmount)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MetaItem label="Ngày vào ở mong muốn" value={lead.preferredMoveIn ? formatDate(lead.preferredMoveIn) : 'Chưa cung cấp'} />
                <MetaItem label="Cách xác minh" value={getVerificationMethodLabel(lead.verificationMethod)} />
              </div>

              {lead.notes && (
                <div className="mt-5 rounded-[22px] border border-border/70 bg-background/70 px-4 py-4 text-sm leading-7 text-muted">
                  {lead.notes}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={`/owner/rooms/${lead.roomId}`}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-black text-primary-foreground transition-all hover:bg-primary/95"
                >
                  Mở phòng
                  <ArrowRight size={16} />
                </Link>
                {lead.isPublicListingAvailable ? (
                  <Link
                    to={`/listings/${lead.roomId}`}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-5 text-sm font-black text-foreground transition-all hover:border-primary/25 hover:text-primary"
                  >
                    Xem trang công khai
                  </Link>
                ) : (
                  <span className="inline-flex h-12 items-center justify-center rounded-2xl border border-border bg-background px-5 text-sm font-black text-muted">
                    Chưa hiển thị công khai
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-[24px] border border-border/70 bg-card px-5 py-4 text-center shadow-[0_16px_48px_-40px_rgba(15,23,42,0.35)]">
    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted">
      {label}
    </p>
    <p className="mt-2 text-3xl font-black tracking-tight text-foreground">
      {value}
    </p>
  </div>
);

const MetaItem = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[22px] border border-border/70 bg-background/70 px-4 py-4">
    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">
      {label}
    </p>
    <p className="mt-2 text-sm font-semibold text-foreground">
      {value}
    </p>
  </div>
);

export default LeadList;
