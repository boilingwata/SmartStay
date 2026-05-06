import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import publicListingsService from '@/services/publicListingsService';

/** Decorative imagery only; counts come from live listings. */
const LOCATION_ART: Partial<Record<string, string>> = {
  'Hà Nội': 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=800&q=80',
  'Bình Dương': 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80',
  'Đà Nẵng': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
  'TP. Hồ Chí Minh': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80',
  'Cần Thơ': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80',
  'Hải Phòng': 'https://images.unsplash.com/photo-1590886749298-85cccaeb040c?auto=format&fit=crop&w=800&q=80',
};

const FALLBACK_ART =
  'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=80';

export const LocationSection: React.FC = () => {
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['public-room-listings'],
    queryFn: () => publicListingsService.getListings(),
  });

  const tiles = useMemo(() => {
    const counts = new Map<string, number>();
    for (const listing of listings) {
      const p = listing.province?.trim();
      if (!p) continue;
      counts.set(p, (counts.get(p) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        count,
        img: LOCATION_ART[name] ?? FALLBACK_ART,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'))
      .slice(0, 4);
  }, [listings]);

  if (!isLoading && tiles.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="mb-6 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
        Tìm phòng trọ theo địa điểm
      </h2>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-[1.35rem] bg-muted sm:h-64"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          {tiles.map(({ name, img, count }) => (
            <Link
              key={name}
              to={`/listings?province=${encodeURIComponent(name)}`}
              className="group relative block h-56 w-full overflow-hidden rounded-[1.35rem] shadow-[0_14px_44px_-26px_rgba(15,23,42,0.25)] ring-1 ring-black/[0.04] transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-28px_rgba(13,107,90,0.2)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:h-64"
            >
              <img
                src={img}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/18 to-transparent" />
              <div className="absolute bottom-4 left-0 right-0 px-4 text-white sm:bottom-6 sm:px-6">
                <p className="text-xl font-bold leading-tight tracking-tight sm:text-2xl">{name}</p>
                <p className="mt-1 text-base font-normal leading-tight opacity-90 sm:text-lg">
                  {count > 0
                    ? `Xem ngay ${count} phòng còn trống`
                    : `Xem các phòng tại ${name}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};
