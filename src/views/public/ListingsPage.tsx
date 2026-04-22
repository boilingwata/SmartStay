import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { cn } from '@/utils';
import publicListingsService from '@/services/publicListingsService';
import { ListingPreviewCard } from '@/components/public/ListingPreviewCard';

type SortOption = 'price_asc' | 'price_desc' | 'area_desc' | 'newest';

const SORT_LABELS: Record<SortOption, string> = {
  price_asc: 'Giá tăng dần',
  price_desc: 'Giá giảm dần',
  area_desc: 'Diện tích lớn nhất',
  newest: 'Mới nhất',
};

const matchesRoomTypeFilter = (listingType: string, selectedType: string) => {
  if (selectedType === 'all') return true;

  const normalizedListing = listingType.trim().toLowerCase();
  const normalizedSelected = selectedType.trim().toLowerCase();

  if (normalizedListing === normalizedSelected) return true;

  const aliases: Record<string, string[]> = {
    room: ['studio', 'room', 'phong', 'phòng', 'phong tro', 'phòng trọ'],
    apartment: ['apartment', 'can ho', 'căn hộ', '1 bedroom', '2 bedroom'],
    house: ['house', 'nha', 'nhà', 'townhouse'],
    retail: ['retail', 'mat bang', 'mặt bằng', 'shophouse', 'shop'],
  };

  return (aliases[normalizedSelected] ?? []).some((alias) => normalizedListing.includes(alias));
};

const formatRoomTypeLabel = (value: string) => {
  const labels: Record<string, string> = {
    all: 'Tất cả loại phòng',
    room: 'Phòng trọ',
    apartment: 'Căn hộ',
    house: 'Nhà nguyên căn',
    retail: 'Mặt bằng',
  };

  return labels[value] ?? value;
};

const ListingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [roomType, setRoomType] = useState(searchParams.get('roomType') ?? 'all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '');
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('price_asc');
  const [showFilters, setShowFilters] = useState(false);
  const urlSearch = searchParams.toString();

  useEffect(() => {
    setSearch(searchParams.get('search') ?? '');
    setRoomType(searchParams.get('roomType') ?? 'all');
    setMaxPrice(searchParams.get('maxPrice') ?? '');
  }, [urlSearch, searchParams]);

  const { data: listings = [], isLoading, isError } = useQuery({
    queryKey: ['public-room-listings'],
    queryFn: () => publicListingsService.getListings(),
  });

  const roomTypes = useMemo(
    () => Array.from(new Set(['all', 'room', 'apartment', 'house', 'retail', roomType, ...listings.map((l) => l.roomType).filter(Boolean)])),
    [listings, roomType]
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

      const matchesType = matchesRoomTypeFilter(listing.roomType, roomType);
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
      return 0;
    });

    return result;
  }, [listings, roomType, search, minPrice, maxPrice, minArea, maxArea, sortBy]);

  return (
    <div className="min-h-screen bg-[#F5F7FB] pt-[65px]">
      <section className="mx-auto max-w-[1280px] px-6 pb-20 pt-8">
        {/* Filter bar */}
        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
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
                  <option key={type} value={type}>{formatRoomTypeLabel(type)}</option>
                ))}
              </select>
            </label>

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

          <div className={cn(
            'mt-4 grid gap-3 grid-cols-2 sm:grid-cols-4 transition-all',
            'lg:grid',
            !showFilters && 'hidden lg:grid'
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
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#0D8A8A]">Phòng trống</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
              {filteredListings.length} phòng phù hợp
            </h2>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ListingPreviewCard key={i} listing={{} as never} index={i} skeleton />
            ))}
          </div>
        ) : isError ? (
          <div className="mt-8 rounded-[32px] border border-red-100 bg-white p-8 text-center shadow-sm">
            <h3 className="text-xl font-black text-slate-900">Danh sách phòng tạm thời không khả dụng</h3>
            <p className="mt-2 text-sm text-slate-500">Vui lòng thử lại sau giây lát.</p>
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
            {filteredListings.map((listing, index) => (
              <ListingPreviewCard
                key={listing.roomId}
                listing={listing}
                index={index}
                accent="latest"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ListingsPage;
