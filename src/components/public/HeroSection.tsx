import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils';

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
          className="w-full max-w-[780px] bg-[rgba(239,239,239,0.7)] backdrop-blur-md rounded-[15px] px-[55px] py-[33px]"
        >
          <div className="bg-white flex rounded-[10px] overflow-hidden shadow-sm h-[45px]">
            {/* Province */}
            <div className="flex items-center px-[10px] w-[193px] border-r border-slate-200 shrink-0">
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full bg-transparent text-[12px] text-[rgba(13,107,90,0.75)] outline-none cursor-pointer"
              >
                <option value="">Tỉnh/Thành phố</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            {/* Keyword */}
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Nhập nội dung tìm kiếm"
              className="flex-1 px-[10px] text-[12px] text-[rgba(13,107,90,0.64)] bg-transparent outline-none"
            />
            {/* Search button */}
            <button
              type="submit"
              className="bg-[#0d6b5a] text-[#e8f5f1] text-[12px] font-semibold px-[10px] w-[83px] shrink-0 hover:bg-[#0a5547] transition-colors whitespace-nowrap"
            >
              Tìm kiếm
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
