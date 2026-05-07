import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/utils';
import publicListingsService from '@/services/publicListingsService';
import { Button } from '@/views/components/ui/button';
import { Input } from '@/views/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/views/components/ui/select';

const BANNERS = [
  'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1280&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1280&q=80',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1280&q=80',
];

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [province, setProvince] = useState('');
  const [keyword, setKeyword] = useState('');

  const { data: listings = [] } = useQuery({
    queryKey: ['public-room-listings'],
    queryFn: () => publicListingsService.getListings(),
  });

  const provinceOptions = useMemo(() => {
    const unique = new Set<string>();
    for (const listing of listings) {
      const p = listing.province?.trim();
      if (p) unique.add(p);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [listings]);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % BANNERS.length), 6500);
    return () => clearInterval(id);
  }, []);

  const prev = () => setSlide((s) => (s - 1 + BANNERS.length) % BANNERS.length);
  const next = () => setSlide((s) => (s + 1) % BANNERS.length);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const q = keyword.trim();
    if (q) params.set('search', q);
    if (province) params.set('province', province);
    const qs = params.toString();
    navigate(qs ? `/listings?${qs}` : '/listings');
  };

  return (
    <section className="relative h-[550px] overflow-hidden">
      {BANNERS.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-[1100ms] ease-out motion-reduce:transition-none',
            i === slide ? 'opacity-100' : 'opacity-0'
          )}
          loading={i === 0 ? 'eager' : 'lazy'}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/10 to-black/28" />
      {/* Opaque pigment layer (no transparent stops); blend mode tints the photo instead of alpha stacking */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_0%,#d9eae5_0%,#eef6f3_42%,#f7faf9_100%)] mix-blend-soft-light"
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3">
        <button
          onClick={prev}
          className="pointer-events-auto flex h-[50px] w-[50px] items-center justify-center rounded-full border border-white/25 bg-white/18 text-white shadow-lg shadow-black/10 backdrop-blur-md transition-all duration-300 ease-out hover:bg-white/28 hover:border-white/35 motion-reduce:transition-none"
          aria-label="Previous"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={next}
          className="pointer-events-auto flex h-[50px] w-[50px] items-center justify-center rounded-full border border-white/25 bg-white/18 text-white shadow-lg shadow-black/10 backdrop-blur-md transition-all duration-300 ease-out hover:bg-white/28 hover:border-white/35 motion-reduce:transition-none"
          aria-label="Next"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-[5px] flex justify-center gap-[5px] py-1">
        <div className="flex items-center gap-[6px] rounded-full border border-white/15 bg-black/25 px-2 py-1.5 backdrop-blur-md">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSlide(i)}
              className={cn(
                'rounded-full transition-all duration-500 ease-out motion-reduce:transition-none',
                i === slide ? 'h-2.5 w-8 bg-white shadow-sm' : 'h-2.5 w-2.5 bg-white/40 hover:bg-white/55'
              )}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="absolute top-[108px] inset-x-0 flex justify-center px-4">
        <form
          onSubmit={handleSearch}
          className="w-full max-w-[780px] rounded-[1.35rem] border-[0.25px] border-solid border-stone-300/45 bg-[#faf9f6] px-4 py-5 shadow-[0_28px_60px_-28px_rgba(13,107,90,0.18)] sm:px-8 dark:border-white/[0.09] dark:bg-[#07111e]"
        >
          <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-inner shadow-black/[0.03] sm:flex-row dark:border-border dark:bg-[#0b1728]">
            <div className="flex w-full shrink-0 items-center border-b border-border bg-transparent sm:w-[193px] sm:border-b-0 sm:border-r">
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger className="h-12 w-full rounded-none border-0 bg-transparent text-sm text-muted-foreground shadow-none focus:ring-0 focus:ring-offset-0 dark:bg-transparent">
                  <SelectValue placeholder="Tỉnh/Thành phố" />
                </SelectTrigger>
                <SelectContent>
                  {provinceOptions.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2 border-b border-border bg-transparent px-3 h-12 sm:border-b-0">
              <Search className="pointer-events-none h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Nhập nội dung tìm kiếm..."
                className="h-full min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent"
              />
            </div>
            <Button
              type="submit"
              className="h-12 w-full shrink-0 rounded-none sm:w-auto sm:px-8"
            >
              Tìm kiếm
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
};
