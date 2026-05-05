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
            className="ml-2 text-sm text-primary/80 flex items-center gap-1 hover:text-primary transition-colors font-medium"
          >
            Xem tất cả <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Scrollable cards */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto overflow-y-hidden pb-4 scroll-smooth [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-muted [&::-webkit-scrollbar-thumb]:bg-primary/25 [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-72 sm:w-80 h-[320px] rounded-2xl bg-muted animate-pulse"
              />
            ))
          : listings.map((listing, i) => (
              <HomepageListingCard key={listing.roomId} listing={listing} index={i} />
            ))}
      </div>
    </section>
  );
};
