import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Star, Ticket as TicketIcon, User } from 'lucide-react';

import { EmptyState } from '@/components/ui/StatusStates';
import { Spinner } from '@/components/ui';
import { formatTicketDateTime, ticketQueryKeys } from '@/features/tickets/ticketPresentation';
import { ticketService } from '@/services/ticketService';
import { cn } from '@/utils';

const StaffRatings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const { data: ratingsData, isLoading, isError, refetch } = useQuery({
    queryKey: ticketQueryKeys.staffRatings(id),
    queryFn: () => ticketService.getStaffRatings(id!),
    enabled: !!id,
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ticketQueryKeys.staffList,
    queryFn: () => ticketService.getStaff(),
    staleTime: 5 * 60 * 1000,
  });

  const filteredList = useMemo(() => {
    const list = ratingsData?.list ?? [];
    return list.filter((rating) => {
      if (dateRange.start && rating.createdAt < `${dateRange.start}T00:00:00`) return false;
      if (dateRange.end && rating.createdAt > `${dateRange.end}T23:59:59`) return false;
      return true;
    });
  }, [dateRange.end, dateRange.start, ratingsData?.list]);

  const histogram = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((score) => ({
        score,
        count: filteredList.filter((rating) => rating.rating === score).length,
      })),
    [filteredList]
  );

  const filteredAverage = useMemo(() => {
    if (filteredList.length === 0) return 0;
    const sum = filteredList.reduce((total, item) => total + item.rating, 0);
    return Number((sum / filteredList.length).toFixed(2));
  }, [filteredList]);

  const staffProfile = useMemo(() => {
    const fromRatings = ratingsData?.list[0];
    if (fromRatings) {
      return {
        fullName: fromRatings.staffName,
        avatarUrl: fromRatings.staffAvatar,
        role: fromRatings.staffRole,
      };
    }

    const fromStaffList = staffList.find((staff) => staff.id === id);
    return fromStaffList
      ? {
          fullName: fromStaffList.fullName,
          avatarUrl: fromStaffList.avatarUrl,
          role: fromStaffList.role,
        }
      : null;
  }, [id, ratingsData?.list, staffList]);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <Spinner size="lg" />
          <p className="text-[12px] font-black uppercase tracking-[0.24em] text-slate-400">
            Đang tải đánh giá nhân viên...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !ratingsData) {
    return (
      <div className="rounded-[32px] border border-dashed border-slate-200 bg-white p-8">
        <EmptyState
          title="Không tải được dữ liệu đánh giá"
          message="Vui lòng thử lại để kiểm tra điểm đánh giá của nhân viên này."
          actionLabel="Tải lại"
          onAction={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>

        <div className="flex flex-wrap items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <CalendarDays size={16} className="text-slate-400" />
          <input
            type="date"
            value={dateRange.start}
            onChange={(event) => setDateRange((current) => ({ ...current, start: event.target.value }))}
            className="bg-transparent text-sm font-medium text-slate-700 outline-none"
          />
          <span className="text-slate-300">đến</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(event) => setDateRange((current) => ({ ...current, end: event.target.value }))}
            className="bg-transparent text-sm font-medium text-slate-700 outline-none"
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-slate-900 p-6 text-white shadow-xl shadow-slate-900/10">
            <div className="flex items-center gap-4">
              {staffProfile?.avatarUrl ? (
                <img src={staffProfile.avatarUrl} alt={staffProfile.fullName} className="h-20 w-20 rounded-[28px] object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-white/10 text-white/70">
                  <User size={28} />
                </div>
              )}

              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/55">Đánh giá nhân viên</p>
                <h1 className="mt-2 text-2xl font-black tracking-tight">
                  {staffProfile?.fullName || 'Nhân viên SmartStay'}
                </h1>
                <p className="mt-2 text-sm text-white/70">{staffProfile?.role || 'Nhân viên vận hành'}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/55">Điểm trung bình</p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-5xl font-black tracking-tight">{filteredAverage.toFixed(2)}</span>
                  <span className="pb-1 text-sm text-white/65">/ 5</span>
                </div>
                <div className="mt-3 flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      className={cn(
                        star <= Math.round(filteredAverage) ? 'fill-amber-400 text-amber-400' : 'text-white/20'
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/55">Số lượt đánh giá</p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-5xl font-black tracking-tight">{filteredList.length}</span>
                  <span className="pb-1 text-sm text-white/65">lượt</span>
                </div>
                <p className="mt-3 text-sm text-white/70">
                  Dữ liệu được lấy trực tiếp từ điểm hài lòng đã lưu trên từng yêu cầu đã hoàn tất.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Phân bố số sao</p>
            <div className="mt-5 space-y-3">
              {histogram.map((item) => {
                const percentage = filteredList.length > 0 ? (item.count / filteredList.length) * 100 : 0;
                return (
                  <div key={item.score} className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-bold text-slate-700">
                      <span>{item.score} sao</span>
                      <span>{item.count} lượt</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Chi tiết đánh giá</p>
                <h2 className="text-xl font-black tracking-tight text-slate-900">
                  Các yêu cầu đã có điểm hài lòng ({filteredList.length})
                </h2>
              </div>
            </div>

            {filteredList.length === 0 ? (
              <div className="mt-5 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
                  <Star size={20} />
                </div>
                <p className="mt-4 text-sm font-bold text-slate-700">Chưa có đánh giá phù hợp bộ lọc</p>
                <p className="mt-1 text-sm text-slate-500">
                  Hãy đổi khoảng ngày hoặc chờ thêm yêu cầu được cư dân chấm điểm.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {filteredList.map((rating) => (
                  <div key={rating.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
                            {rating.ticketCode}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-600">
                            {rating.tenantName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={16}
                              className={cn(star <= rating.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200')}
                            />
                          ))}
                        </div>

                        <p className="text-[15px] leading-7 text-slate-700">
                          {rating.comment || 'Hiện tại hệ thống chưa lưu nhận xét chi tiết riêng cho điểm đánh giá này.'}
                        </p>

                        <p className="text-sm text-slate-500">{formatTicketDateTime(rating.createdAt)}</p>
                      </div>

                      <button
                        onClick={() => navigate(`/owner/tickets/${rating.ticketId}`)}
                        className="inline-flex items-center gap-2 rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        <TicketIcon size={16} />
                        Mở yêu cầu
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StaffRatings;
