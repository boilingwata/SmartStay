import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils';
import type { PublicListing } from '@/services/publicListingsService';
import { HomepageListingCard } from './HomepageListingCard';

const CARD_STEP = 305; // card width (300) + gap (5)

type Props = {
  title: string;
  listings: PublicListing[];
  isLoading: boolean;
  viewAllHref?: string;
};

export const HomepageListingSection: React.FC<Props> = ({
  title,
  listings,
  isLoading,
  viewAllHref = '/listings',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateNav = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateNav();
    el.addEventListener('scroll', updateNav, { passive: true });
    const ro = new ResizeObserver(updateNav);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateNav);
      ro.disconnect();
    };
  }, [listings, updateNav]);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: dir === 'left' ? -CARD_STEP : CARD_STEP,
      behavior: 'smooth',
    });
  };

  if (!isLoading && listings.length === 0) return null;

  return (
    <section className="py-4 max-w-[1100px] mx-auto px-4 lg:px-0">
      {/* Header row */}
      <div className="flex items-center h-[110px]">
        <h2 className="text-[#0d6b5a] text-[30px] font-bold tracking-tight flex-1">
          &nbsp;{title}
        </h2>

        {/* Carousel nav + view-all */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => scroll('left')}
            disabled={!canLeft}
            aria-label="Scroll left"
            className={cn(
              'w-9 h-9 rounded-full border flex items-center justify-center transition-colors',
              canLeft
                ? 'border-[#0d6b5a] text-[#0d6b5a] hover:bg-[#e8f5f1]'
                : 'border-slate-200 text-slate-300 cursor-not-allowed'
            )}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canRight}
            aria-label="Scroll right"
            className={cn(
              'w-9 h-9 rounded-full border flex items-center justify-center transition-colors',
              canRight
                ? 'border-[#0d6b5a] text-[#0d6b5a] hover:bg-[#e8f5f1]'
                : 'border-slate-200 text-slate-300 cursor-not-allowed'
            )}
          >
            <ChevronRight size={16} />
          </button>
          <Link
            to={viewAllHref}
            className="ml-2 text-sm text-[#0d6b5a]/60 flex items-center gap-1 hover:text-[#0d6b5a] transition-colors font-medium"
          >
            Xem tất cả <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Scrollable cards */}
      <div
        ref={scrollRef}
        className="flex gap-[5px] overflow-x-auto overflow-y-hidden pb-4 scroll-smooth [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-[#0d6b5a]/25 [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-[300px] h-[392px] rounded-[15px] bg-slate-200 animate-pulse"
              />
            ))
          : listings.map((listing, i) => (
              <HomepageListingCard key={listing.roomId} listing={listing} index={i} />
            ))}
      </div>
    </section>
  );
};
