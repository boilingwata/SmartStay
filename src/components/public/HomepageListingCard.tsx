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
      className="block bg-white rounded-[15px] overflow-hidden shrink-0 w-[300px] h-[392px] relative hover:shadow-xl transition-shadow duration-300 group"
      aria-label={listing.roomCode}
    >
      {/* Cover image */}
      <div className="absolute top-[7px] left-[10px] right-[10px] h-[264px] rounded-[15px] overflow-hidden">
        <img
          src={imageSrc}
          alt={listing.buildingName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Top gradient for tag contrast */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent" />
        {/* Tags */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span
            className={cn(
              'flex items-center gap-1 text-white text-[8px] font-bold px-[5px] h-[20px] rounded-[20px]',
              isAvailable ? 'bg-[#1e7e4a]' : 'bg-[#d44333]'
            )}
          >
            {isAvailable ? (
              <>
                <ShieldCheck size={10} />
                Đã xác thực
              </>
            ) : (
              'Sắp hết'
            )}
          </span>
          {!isAvailable && (
            <span className="flex items-center gap-1 bg-[#1e7e4a] text-white text-[8px] font-bold px-[5px] h-[20px] rounded-[20px]">
              <ShieldCheck size={10} />
              Đã xác thực
            </span>
          )}
        </div>
      </div>

      {/* Availability bar */}
      <div className="absolute top-[275px] left-[10px] right-[10px] h-[22px] bg-[#0d6b5a] rounded-[2.5px] flex items-center justify-center">
        <span className="text-[#e8f5f1] text-[12px]">{listing.availabilityLabel}</span>
      </div>

      {/* Address */}
      <div className="absolute bottom-[53px] left-[10px] right-[10px] h-[39px] overflow-hidden flex items-start">
        <p className="text-black text-[12px] line-clamp-2 leading-tight">{listing.buildingAddress}</p>
      </div>

      {/* Price */}
      <div className="absolute bottom-[35px] left-[10px] right-[10px] h-[15px] flex items-center">
        <p className="text-[#0a5547] text-[12px] font-semibold truncate">
          Giá từ: {formatVND(listing.baseRent)}/tháng
        </p>
      </div>

      {/* Room info */}
      <div className="absolute bottom-[12px] left-[10px] right-[10px] h-[15px] flex items-center">
        <p className="text-black text-[12px] truncate">
          {listing.roomType} · {listing.areaSqm}m²
        </p>
      </div>
    </Link>
  );
};
