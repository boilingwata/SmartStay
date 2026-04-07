import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, MapPin, Search, SlidersHorizontal, Users, X, ChevronDown } from 'lucide-react';
import { cn, formatVND } from '@/utils';
import publicListingsService from '@/services/publicListingsService';

type SortOption = 'price_asc' | 'price_desc' | 'area_desc' | 'newest';

const SORT_LABELS: Record<SortOption, string> = {
  price_asc: 'Giá tăng dần',
  price_desc: 'Giá giảm dần',
  area_desc: 'Diện tích lớn nhất',
  newest: 'Mới nhất',
};

const ListingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [roomType, setRoomType] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('price_asc');
  const [showFilters, setShowFilters] = useState(false);

  const { data: listings = [], isLoading, isError } = useQuery({
    queryKey: ['public-room-listings'],
    queryFn: () => publicListingsService.getListings(),
  });

  const roomTypes = useMemo(
    () => ['all', ...Array.from(new Set(listings.map((l) => l.roomType).filter(Boolean)))],
    [listings]
  );

  const activeFilterCount = [
    roomType !== 'all',
    minPrice !== '',
    maxPrice !== '',
    minArea !== '',
    maxArea !== '',
    sortBy !== 'price_asc',
  ].filter(Boolean).length;

  const clearAll = () => {
    setRoomType('all');
    setMinPrice('');
    setMaxPrice('');
    setMinArea('');
    setMaxArea('');
    setSortBy('price_asc');
  };

  const filteredListings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const minP = minPrice ? Number(minPrice) : null;
    const maxP = maxPrice ? Number(maxPrice) : null;
    const minA = minArea ? Number(minArea) : null;
    const maxA = maxArea ? Number(maxArea) : null;

    let result = listings.filter((listing) => {
      const matchesSearch = normalizedSearch.length === 0 || [
        listing.roomCode,
        listing.roomType,
        listing.buildingName,
        listing.buildingAddress,
      ].some((field) => field.toLowerCase().includes(normalizedSearch));

      const matchesType = roomType === 'all' || listing.roomType === roomType;
      const matchesMinPrice = minP === null || listing.baseRent >= minP;
      const matchesMaxPrice = maxP === null || listing.baseRent <= maxP;
      const matchesMinArea = minA === null || listing.areaSqm >= minA;
      const matchesMaxArea = maxA === null || listing.areaSqm <= maxA;

      return matchesSearch && matchesType && matchesMinPrice && matchesMaxPrice && matchesMinArea && matchesMaxArea;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'price_asc') return a.baseRent - b.baseRent;
      if (sortBy === 'price_desc') return b.baseRent - a.baseRent;
      if (sortBy === 'area_desc') return b.areaSqm - a.areaSqm;
      return 0; // 'newest' — keep server order
    });

    return result;
  }, [listings, roomType, search, minPrice, maxPrice, minArea, maxArea, sortBy]);

  return (
    <div className="min-h-screen bg-[#F5F7FB] pt-28">
      <section className="mx-auto max-w-[1280px] px-6 pb-8">
        <div className="overflow-hidden rounded-[40px] bg-gradient-to-br from-[#173B63] via-[#0D8A8A] to-[#6AAFD8] px-8 py-10 text-white shadow-[0_30px_80px_-40px_rgba(13,138,138,0.65)] lg:px-12 lg:py-14">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/65">Hybrid tenant journey</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black tracking-tight lg:text-6xl">Browse available homes before any verification step.</h1>
              <p className="max-w-2xl text-sm leading-relaxed text-white/80 lg:text-base">
                SmartStay now lets prospects explore rooms first. Verification only starts when you choose to apply.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">Có thể vào ở ngay</p>
                <p className="mt-2 text-3xl font-black">{listings.length}</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-slate-950/20 p-5 backdrop-blur-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">Best for</p>
                <p className="mt-2 text-base font-bold leading-snug">Prospects, applicants, and future residents</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pb-20">
        {/* Filter bar */}
        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
          {/* Search + room type + mobile filter toggle */}
          <div className="grid gap-3 lg:grid-cols-[1.3fr_0.7fr_auto]">
            <label className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo mã phòng, toà nhà, khu vực..."
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-[#0D8A8A] focus:bg-white"
              />
            </label>

            <label className="relative">
              <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="h-14 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-[#0D8A8A] focus:bg-white"
              >
                {roomTypes.map((type) => (
                  <option key={type} value={type}>{type === 'all' ? 'Tất cả loại phòng' : type}</option>
                ))}
              </select>
            </label>

            {/* Mobile: toggle advanced filters; desktop: sort dropdown */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'lg:hidden h-14 flex items-center gap-2 px-4 rounded-2xl border text-sm font-bold transition-all',
                  showFilters ? 'border-[#0D8A8A] bg-[#0D8A8A]/5 text-[#0D8A8A]' : 'border-slate-200 bg-slate-50 text-slate-600'
                )}
              >
                <span>Bộ lọc</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#0D8A8A] text-white text-[10px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown size={14} className={cn('transition-transform', showFilters && 'rotate-180')} />
              </button>

              {/* Desktop sort */}
              <div className="hidden lg:block relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="h-14 appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-4 pr-9 text-sm font-medium text-slate-700 outline-none transition-all focus:border-[#0D8A8A] focus:bg-white"
                >
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                    <option key={key} value={key}>{SORT_LABELS[key]}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {activeFilterCount > 0 && (
                <button onClick={clearAll} className="h-14 flex items-center gap-1.5 px-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-500 hover:text-red-500 hover:border-red-200 transition-all whitespace-nowrap">
                  <X size={14} />
                  <span>Xoá lọc</span>
                </button>
              )}
            </div>
          </div>

          {/* Advanced filters — always visible on desktop, collapsible on mobile */}
          <div className={cn(
            'mt-4 grid gap-3 grid-cols-2 sm:grid-cols-4 transition-all',
            'lg:grid', // always show on desktop
            !showFilters && 'hidden lg:grid' // hide on mobile unless toggled
          )}>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Giá tối thiểu (VNĐ)</label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-[#0D8A8A] focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Giá tối đa (VNĐ)</label>
              <input
                type="number"
                min={0}
                placeholder="Không giới hạn"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-[#0D8A8A] focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Diện tích tối thiểu (m²)</label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={minArea}
                onChange={(e) => setMinArea(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-[#0D8A8A] focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Diện tích tối đa (m²)</label>
              <input
                type="number"
                min={0}
                placeholder="Không giới hạn"
                value={maxArea}
                onChange={(e) => setMaxArea(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-[#0D8A8A] focus:bg-white transition-all"
              />
            </div>

            {/* Mobile sort */}
            <div className="col-span-2 sm:col-span-4 lg:hidden space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sắp xếp theo</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-[#0D8A8A] focus:bg-white transition-all"
              >
                {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                  <option key={key} value={key}>{SORT_LABELS[key]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#0D8A8A]">Public listings</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
              {filteredListings.length} phòng phù hợp
            </h2>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[280px] animate-pulse rounded-[32px] border border-slate-200 bg-white" />
            ))}
          </div>
        ) : isError ? (
          <div className="mt-8 rounded-[32px] border border-red-100 bg-white p-8 text-center shadow-sm">
            <h3 className="text-xl font-black text-slate-900">Listings are unavailable right now</h3>
            <p className="mt-2 text-sm text-slate-500">Please try again in a moment.</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h3 className="text-xl font-black text-slate-900">Không tìm thấy phòng phù hợp</h3>
            <p className="mt-2 text-sm text-slate-500">Thử điều chỉnh bộ lọc để xem thêm phòng trống.</p>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#0D8A8A] hover:underline">
                <X size={14} /> Xoá tất cả bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredListings.map((listing) => (
              <article key={listing.roomId} className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                <div className="bg-gradient-to-br from-[#E0F2FE] via-[#F8FAFC] to-[#CCFBF1] p-6">
                  <div className="inline-flex rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#0D8A8A]">
                    {listing.availabilityLabel}
                  </div>
                  <h3 className="mt-6 text-2xl font-black tracking-tight text-slate-900">{listing.roomCode}</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">{listing.roomType} tại {listing.buildingName}</p>
                </div>

                <div className="space-y-5 p-6">
                  <div className="flex items-start gap-3 text-sm text-slate-500">
                    <MapPin size={18} className="mt-0.5 text-[#0D8A8A]" />
                    <span>{listing.buildingAddress}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Giá thuê</p>
                      <p className="mt-2 text-lg font-black text-slate-900">{formatVND(listing.baseRent)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Diện tích</p>
                      <p className="mt-2 text-lg font-black text-slate-900">{listing.areaSqm} m²</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users size={16} className="text-[#0D8A8A]" />
                    <span>Tối đa {listing.maxOccupants} người</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(listing.amenities.slice(0, 4).length > 0 ? listing.amenities.slice(0, 4) : ['Sẵn sàng vào ở', 'Cổng thông tin cư dân']).map((amenity) => (
                      <span key={`${listing.roomId}-${amenity}`} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                        {amenity}
                      </span>
                    ))}
                  </div>

                  <Link
                    to={`/listings/${listing.roomId}`}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-[12px] font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-[#0D8A8A]"
                  >
                    Xem chi tiết
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ListingsPage;
