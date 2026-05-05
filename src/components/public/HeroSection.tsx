import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/utils';
import { Button } from '@/views/components/ui/button';
import { Input } from '@/views/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/views/components/ui/select';

const BANNERS = [
  'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1280&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1280&q=80',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1280&q=80',
];

const PROVINCES = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Bình Dương',
  'Đồng Nai',
  'Cần Thơ',
  'Hải Phòng',
  'Huế',
  'Nha Trang',
];

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [province, setProvince] = useState('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % BANNERS.length), 5000);
    return () => clearInterval(id);
  }, []);

  const prev = () => setSlide((s) => (s - 1 + BANNERS.length) % BANNERS.length);
  const next = () => setSlide((s) => (s + 1) % BANNERS.length);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = keyword.trim() || province;
    navigate(q ? `/listings?search=${encodeURIComponent(q)}` : '/listings');
  };

  return (
    <section className="relative h-[550px] overflow-hidden">
      {/* Banner images */}
      {BANNERS.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-700',
            i === slide ? 'opacity-100' : 'opacity-0'
          )}
          loading={i === 0 ? 'eager' : 'lazy'}
        />
      ))}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/25" />

      {/* Carousel arrows */}
      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 pointer-events-none">
        <button
          onClick={prev}
          className="pointer-events-auto w-[50px] h-[50px] bg-black/35 hover:bg-black/55 text-white rounded-full flex items-center justify-center transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={next}
          className="pointer-events-auto w-[50px] h-[50px] bg-black/35 hover:bg-black/55 text-white rounded-full flex items-center justify-center transition-colors"
          aria-label="Next"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-[5px] inset-x-0 flex justify-center gap-[5px] py-1">
        <div className="bg-black/50 flex items-center gap-[5px] px-[5px] py-[4px] rounded-[25px]">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={cn(
                'rounded-[50px] transition-all duration-300',
                i === slide ? 'w-[30px] h-[10px] bg-white' : 'w-[10px] h-[10px] bg-white/35'
              )}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* QuickSearch panel — single search bar, no filter row */}
      <div className="absolute top-[108px] inset-x-0 px-4 flex justify-center">
        <form
          onSubmit={handleSearch}
          className="w-full max-w-[780px] bg-background/70 backdrop-blur-md rounded-2xl px-6 sm:px-12 py-8"
        >
          <div className="bg-background flex flex-col sm:flex-row rounded-lg overflow-hidden shadow-sm border border-border">
            {/* Province */}
            <div className="flex items-center w-full sm:w-[193px] border-b sm:border-b-0 sm:border-r border-border shrink-0">
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger className="w-full h-12 border-0 focus:ring-0 rounded-none shadow-none text-muted-foreground text-sm">
                  <SelectValue placeholder="Tỉnh/Thành phố" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Keyword */}
            <div className="flex-1 flex items-center px-3 h-12 border-b sm:border-b-0 border-border">
              <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Nhập nội dung tìm kiếm..."
                className="border-0 focus-visible:ring-0 shadow-none px-0 h-full text-sm"
              />
            </div>
            {/* Search button */}
            <Button
              type="submit"
              className="rounded-none h-12 sm:px-8 shrink-0 w-full sm:w-auto"
            >
              Tìm kiếm
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
};
