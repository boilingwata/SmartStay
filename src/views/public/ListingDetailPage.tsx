import React, { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, MapPin, MessageSquare, Search, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { formatVND } from '@/utils';
import publicListingsService from '@/services/publicListingsService';
import useAuthStore from '@/stores/authStore';
import QuickInquiryModal from '@/components/portal/QuickInquiryModal';

const ListingDetailPage: React.FC = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuthStore();
  const [showInquiry, setShowInquiry] = useState(false);

  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ['public-room-listing', id],
    queryFn: () => publicListingsService.getListingDetail(id ?? ''),
    enabled: !!id,
  });

  if (!id) {
    return <Navigate to="/listings" replace />;
  }

  const ctaHref = `/listings/${id}/apply`;

  return (
    <div className="min-h-screen bg-[#F5F7FB] pt-[65px]">
      <div className="mx-auto max-w-[1120px] px-6 pb-20 pt-8">
        <Link
          to="/listings"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 shadow-sm"
        >
          <ArrowLeft size={14} />
          Danh sách phòng
        </Link>

        {isLoading ? (
          <div className="mt-6 h-[520px] animate-pulse rounded-[40px] border border-slate-200 bg-white" />
        ) : isError || !listing ? (
          <div className="mt-6 rounded-[40px] border border-red-100 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-black text-slate-900">Không tìm thấy phòng</h1>
            <p className="mt-2 text-sm text-slate-500">Phòng này không còn hiển thị công khai.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <section className="overflow-hidden rounded-[40px] border border-slate-200 bg-white shadow-sm">
              <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="bg-gradient-to-br from-[#16324F] via-[#0D8A8A] to-[#91C8E4] p-8 text-white lg:p-12">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-sm mb-4">
                    <ShieldCheck size={13} />
                    SmartStay Verified
                  </div>

                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/60">Phòng đang trống</p>
                  <h1 className="mt-5 text-4xl font-black tracking-tight lg:text-5xl">{listing.roomCode}</h1>
                  <p className="mt-3 text-lg font-semibold text-white/80">{listing.roomType} tại {listing.buildingName}</p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">Giá thuê/tháng</p>
                      <p className="mt-2 text-2xl font-black">{formatVND(listing.baseRent)}</p>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-slate-950/20 p-5 backdrop-blur-sm">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">Sức chứa</p>
                      <p className="mt-2 text-2xl font-black">{listing.maxOccupants} người</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 p-8 lg:p-10">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600">
                    <BadgeCheck size={14} />
                    {listing.availabilityLabel}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 text-sm text-slate-500">
                      <Building2 size={18} className="mt-0.5 text-[#0D8A8A]" />
                      <span>{listing.buildingName}</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm text-slate-500">
                      <MapPin size={18} className="mt-0.5 text-[#0D8A8A]" />
                      <span>{listing.buildingAddress}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <Users size={18} className="text-[#0D8A8A]" />
                      <span>{listing.areaSqm} m² — tối đa {listing.maxOccupants} người</span>
                    </div>
                  </div>

                  {listing.buildingDescription && (
                    <div className="rounded-[24px] bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">
                      {listing.buildingDescription}
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[24px] border border-slate-200 p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Tầng</p>
                      <p className="mt-2 text-lg font-black text-slate-900">{listing.floorNumber ?? '—'}</p>
                    </div>
                    <div className="rounded-[24px] border border-slate-200 p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Hướng</p>
                      <p className="mt-2 text-lg font-black text-slate-900">{listing.facing ?? '—'}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Link
                      to={ctaHref}
                      className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-[12px] font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-[#0D8A8A]"
                    >
                      {isAuthenticated ? 'Tiếp tục đăng ký' : 'Đăng ký thuê phòng'}
                      <ArrowRight size={16} />
                    </Link>

                    <button
                      onClick={() => setShowInquiry(true)}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-[12px] font-black uppercase tracking-[0.18em] text-slate-600 transition-all hover:border-[#0D8A8A] hover:text-[#0D8A8A]"
                    >
                      <MessageSquare size={15} />
                      Đặt câu hỏi
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D8A8A]">Tiện ích</p>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">Những gì đi kèm với phòng này</h2>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {(listing.amenities.length > 0 ? listing.amenities : ['Sẵn sàng vào ở', 'Hỗ trợ cư dân']).map((amenity) => (
                      <span key={amenity} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">
                        {amenity}
                      </span>
                    ))}
                    {listing.hasBalcony && (
                      <span className="rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-[#0D8A8A]">Ban công</span>
                    )}
                    {listing.hasPrivateBathroom && (
                      <span className="rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-[#0D8A8A]">Nhà vệ sinh riêng</span>
                    )}
                  </div>
                </div>

                <div className="rounded-[28px] bg-slate-50 p-6">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Quy trình thuê phòng</p>
                  <ol className="mt-5 space-y-4 text-sm text-slate-600">
                    <li className="flex items-start gap-3">
                      <div className="mt-0.5 w-6 h-6 rounded-lg bg-[#0D8A8A]/10 flex items-center justify-center shrink-0">
                        <Search size={12} className="text-[#0D8A8A]" />
                      </div>
                      <span><span className="font-black text-slate-900">Xem & so sánh</span> các phòng trống không cần tài khoản.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-0.5 w-6 h-6 rounded-lg bg-[#0D8A8A]/10 flex items-center justify-center shrink-0">
                        <UserPlus size={12} className="text-[#0D8A8A]" />
                      </div>
                      <span><span className="font-black text-slate-900">Tạo tài khoản</span> chỉ khi bạn sẵn sàng đăng ký.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-0.5 w-6 h-6 rounded-lg bg-[#0D8A8A]/10 flex items-center justify-center shrink-0">
                        <ShieldCheck size={12} className="text-[#0D8A8A]" />
                      </div>
                      <span><span className="font-black text-slate-900">Xác minh danh tính</span> trong luồng đăng ký, không chặn khám phá.</span>
                    </li>
                  </ol>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {showInquiry && listing && (
        <QuickInquiryModal
          listingId={id}
          roomCode={listing.roomCode}
          onClose={() => setShowInquiry(false)}
        />
      )}
    </div>
  );
};

export default ListingDetailPage;
