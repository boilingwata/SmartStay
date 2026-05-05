import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { cn, formatVND } from '@/utils';
import type { PublicListing } from '@/services/publicListingsService';

const PREVIEW_IMAGES = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=600&q=80',
];

type Props = {
  listing: PublicListing;
  index: number;
};

export const HomepageListingCard: React.FC<Props> = ({ listing, index }) => {
  const imageSrc = PREVIEW_IMAGES[index % PREVIEW_IMAGES.length];
  const isAvailable = listing.availabilityLabel === 'Có thể vào ở ngay';

  return (
    <Link
      to={`/listings/${listing.roomId}`}
      className="block bg-card text-card-foreground rounded-2xl overflow-hidden shrink-0 w-72 sm:w-80 border border-border hover:shadow-md transition-shadow duration-300 group"
      aria-label={listing.roomCode}
    >
      <div className="p-2 pb-0">
        {/* Cover image */}
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
          <img
            src={imageSrc}
            alt={listing.buildingName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Top gradient for tag contrast */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent" />
          {/* Tags */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span
              className={cn(
                'flex items-center gap-1 text-white text-xs font-bold px-2 py-1 rounded-full',
                isAvailable ? 'bg-emerald-600' : 'bg-destructive'
              )}
            >
              {isAvailable ? (
                <>
                  <ShieldCheck size={12} />
                  Đã xác thực
                </>
              ) : (
                'Sắp hết'
              )}
            </span>
            {!isAvailable && (
              <span className="flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                <ShieldCheck size={12} />
                Đã xác thực
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2">
        {/* Availability bar */}
        <div className="w-full bg-primary/10 text-primary py-1 px-2 rounded-md flex items-center justify-center">
          <span className="text-xs font-medium">{listing.availabilityLabel}</span>
        </div>

        {/* Address */}
        <p className="text-sm font-medium line-clamp-2 leading-tight">
          {listing.buildingAddress}
        </p>

        {/* Price and Info */}
        <div className="mt-1 flex flex-col gap-1">
          <p className="text-primary text-sm font-semibold truncate">
            Giá từ: {formatVND(listing.baseRent)}/tháng
          </p>
          <p className="text-muted-foreground text-xs truncate">
            {listing.roomType} · {listing.areaSqm}m²
          </p>
        </div>
      </div>
    </Link>
  );
};
