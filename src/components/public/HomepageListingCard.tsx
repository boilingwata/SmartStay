import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImageOff } from 'lucide-react';
import { buildingCoverUrlForRoomId } from '@/constants/listingBuildingCovers';
import { formatVND } from '@/utils';
import type { PublicListing } from '@/services/publicListingsService';

type Props = {
  listing: PublicListing;
};

export const HomepageListingCard: React.FC<Props> = ({ listing }) => {
  const coverUrl = listing.coverImageUrl?.trim() || buildingCoverUrlForRoomId(listing.roomId);
  const imageAlt = `${listing.roomCode} — ${listing.buildingName}`;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [listing.roomId, listing.coverImageUrl]);

  const showPlaceholder = imageFailed;

  return (
    <Link
      to={`/listings/${listing.roomId}`}
      className={[
        'group relative isolate block w-72 shrink-0 overflow-hidden rounded-[1.35rem]',
        'border border-border/70 bg-card text-card-foreground',
        'shadow-[0_12px_40px_-28px_rgba(15,23,42,0.2)]',
        'transition-[transform,box-shadow,border-color] duration-300 ease-out',
        'hover:-translate-y-[11px] hover:border-primary/42',
        'hover:shadow-[0_34px_70px_-28px_rgba(13,107,90,0.48),0_18px_42px_-18px_rgba(15,23,42,0.22),0_6px_16px_-8px_rgba(13,107,90,0.15)]',
        'hover:ring-[3px] hover:ring-primary/30 hover:ring-offset-[3px] hover:ring-offset-[var(--card)]',
        'active:translate-y-[-6px] active:scale-[0.985] active:shadow-[0_22px_48px_-26px_rgba(13,107,90,0.38)]',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none',
        'motion-reduce:hover:ring-0 motion-reduce:hover:ring-offset-0 motion-reduce:active:scale-100 sm:w-80',
      ].join(' ')}
      aria-label={listing.roomCode}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {!showPlaceholder ? (
          <>
            <img
              src={coverUrl}
              alt={imageAlt}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.12] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              loading="lazy"
              decoding="async"
              onError={() => setImageFailed(true)}
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/45 via-primary/[0.14] to-transparent opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 motion-reduce:hidden"
              aria-hidden
            />
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-4 text-center text-muted-foreground">
            <ImageOff className="h-9 w-9 shrink-0 opacity-45" strokeWidth={1.25} aria-hidden />
            <span className="text-[11px] font-semibold leading-snug text-foreground/80">
              Không tải được ảnh
            </span>
            <span className="text-[10px] leading-snug opacity-70">
              Liên kết ảnh có thể đã hết hạn hoặc chặn hiển thị. Vẫn có thể xem chi tiết phòng.
            </span>
          </div>
        )}
      </div>

      <div className="relative flex flex-col gap-2 p-4">
        <div className="flex w-full items-center justify-center rounded-md bg-primary/10 px-2 py-1 text-primary transition-colors duration-300 ease-out group-hover:bg-primary/26 motion-reduce:transition-none">
          <span className="text-xs font-medium">{listing.availabilityLabel}</span>
        </div>

        <p className="line-clamp-2 text-sm font-medium leading-tight text-foreground/95 transition-colors duration-300 group-hover:text-foreground motion-reduce:transition-none">
          {listing.buildingAddress}
        </p>

        <div className="mt-1 flex flex-col gap-1">
          <p className="truncate text-sm font-semibold text-primary transition-[filter] duration-300 group-hover:brightness-[1.12] motion-reduce:transition-none">
            Giá từ: {formatVND(listing.baseRent)}/tháng
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {listing.roomType} · {listing.areaSqm}m²
          </p>
        </div>
      </div>
    </Link>
  );
};
