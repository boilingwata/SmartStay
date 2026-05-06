import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PublicListing } from '@/services/publicListingsService';
import { HomepageListingCard } from './HomepageListingCard';
import { Button } from '@/views/components/ui/button';

const CARD_STEP = 336; // sm card width (w-80 = 320) + gap-4 (16)

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
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header row */}
      <div className="flex items-center py-6 sm:py-8">
        <h2 className="text-primary text-2xl sm:text-3xl font-bold tracking-tight flex-1">
          {title}
        </h2>

        {/* Carousel nav + view-all */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            disabled={!canLeft}
            aria-label="Scroll left"
            className="rounded-full w-9 h-9 border-border text-primary hover:bg-primary/5 hover:text-primary disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            disabled={!canRight}
            aria-label="Scroll right"
            className="rounded-full w-9 h-9 border-border text-primary hover:bg-primary/5 hover:text-primary disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </Button>
          <Link
            to={viewAllHref}
            className="ml-2 flex items-center gap-1 text-sm font-medium text-primary/80 transition-colors duration-300 ease-out hover:text-primary"
          >
            Xem tất cả <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Scrollable cards */}
      <div
        ref={scrollRef}
        className={[
          'flex gap-4 overflow-x-scroll overflow-y-hidden scroll-smooth pb-3',
          // Firefox — visible themed scrollbar
          '[scrollbar-width:thin]',
          '[scrollbar-color:rgba(13,107,90,0.55)_rgb(226,232,240)]',
          // Chromium / Safari — taller thumb + track so it doesn’t feel “missing”
          '[&::-webkit-scrollbar]:h-2.5',
          '[&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-200/85 dark:[&::-webkit-scrollbar-track]:bg-slate-700/80',
          '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/55 [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-padding',
          'dark:[scrollbar-color:rgba(13,138,138,0.65)_rgb(30,41,59)]',
          'dark:[&::-webkit-scrollbar-thumb]:bg-secondary/60',
        ].join(' ')}
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-72 sm:w-80 h-[320px] rounded-2xl bg-muted animate-pulse"
              />
            ))
          : listings.map((listing) => (
              <HomepageListingCard key={listing.roomId} listing={listing} />
            ))}
      </div>
    </section>
  );
};
