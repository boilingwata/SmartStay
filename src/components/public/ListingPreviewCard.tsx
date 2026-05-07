import React from 'react';
import { ArrowRight, Heart, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SafeImage from '@/components/ui/SafeImage';
import { buildingCoverUrlForRoomId } from '@/constants/listingBuildingCovers';
import { cn, formatVND } from '@/utils';
import type { PublicListing } from '@/services/publicListingsService';

type ListingPreviewCardProps = {
  listing: PublicListing;
  /** Kept for call-site compatibility; unused. */
  index?: number;
  href?: string;
  badges?: string[];
  accent?: 'featured' | 'latest';
  skeleton?: boolean;
};

export const ListingPreviewCard: React.FC<ListingPreviewCardProps> = ({
  listing,
  href,
  badges,
  skeleton = false,
}) => {
  const { t } = useTranslation('public', { lng: 'vi' });
  const [liked, setLiked] = React.useState(false);

  const cardHref = href ?? `/listings/${listing.roomId}`;
  const coverUrl = listing.coverImageUrl?.trim() || buildingCoverUrlForRoomId(listing.roomId);
  const imageAlt = `${listing.roomCode} — ${listing.buildingName}`;

  const cardBadges = badges ?? [];

  if (skeleton) {
    return (
      <article className="overflow-hidden rounded-[24px] border border-border/60 bg-card shadow-sm">
        <div className="h-60 animate-pulse bg-slate-200/70 dark:bg-slate-800/70" />
        <div className="p-5">
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <div className="h-8 w-32 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-8 w-14 rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-5 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="mt-3 h-4 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="mt-4 h-11 w-full rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </article>
    );
  }

  return (
    <article className="group overflow-hidden rounded-[24px] border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-[0_12px_40px_-8px_rgba(15,23,42,0.14)] dark:bg-white/5">

      <div className="relative h-60 overflow-hidden bg-muted">
        <>
          <SafeImage
            src={coverUrl}
            alt={imageAlt}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {cardBadges.length > 0 && (
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent" />
          )}
        </>

        <div
          className={cn(
            'absolute left-3 right-3 top-3 flex items-start gap-2',
            cardBadges.length === 0 ? 'justify-end' : 'justify-between'
          )}
        >
          {cardBadges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {cardBadges.slice(0, 2).map((badge) => (
                <span
                  key={`${listing.roomId}-${badge}`}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] backdrop-blur-sm',
                    coverUrl
                      ? 'border border-white/20 bg-black/30 text-white'
                      : 'border border-border bg-card/95 text-foreground'
                  )}
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
          <button
            type="button"
            aria-label={t('publicExperience.marketplace.card.favorite')}
            onClick={() => setLiked((current) => !current)}
            className={cn(
              'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border backdrop-blur-sm transition-all',
              coverUrl
                ? liked
                  ? 'border-white/30 bg-white text-rose-500'
                  : 'border-white/20 bg-black/30 text-white hover:bg-black/40'
                : liked
                  ? 'border-border bg-card text-rose-500'
                  : 'border-border bg-card/95 text-muted-foreground hover:bg-muted'
            )}
          >
            <Heart size={15} className={liked ? 'fill-current' : ''} />
          </button>
        </div>

        <div className="absolute bottom-3 left-3">
          <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-white shadow-sm">
            {listing.availabilityLabel}
          </span>
        </div>
      </div>

      <div className="p-5">

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-black leading-none tracking-tight text-slate-900 dark:text-white">
              {formatVND(listing.baseRent)}
            </p>
            <p className="mt-1.5 text-[11px] font-semibold text-muted">
              {t('publicExperience.marketplace.card.perMonth')}
            </p>
          </div>
          <span className="shrink-0 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            {listing.areaSqm} m²
          </span>
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted">
            {listing.roomType}
          </p>
          <h3 className="mt-1 line-clamp-1 text-base font-bold text-slate-900 dark:text-white">
            {listing.roomCode} · {listing.buildingName}
          </h3>
        </div>

        <div className="mt-2.5 flex items-start gap-1.5">
          <MapPin size={13} className="mt-0.5 shrink-0 text-muted" />
          <span className="line-clamp-1 text-[13px] text-muted">{listing.buildingAddress}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {(listing.amenities.length > 0 ? listing.amenities.slice(0, 3) : [t('publicExperience.marketplace.card.readyToMove')]).map((amenity) => (
            <span
              key={`${listing.roomId}-${amenity}`}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300"
            >
              {amenity}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="flex items-center gap-1 text-[12px] text-muted">
            <Users size={13} className="shrink-0" />
            <span>{listing.maxOccupants} {t('publicExperience.marketplace.card.people')}</span>
          </div>

          <Link
            to={cardHref}
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-[11px] font-black uppercase tracking-[0.15em] text-white transition-colors hover:bg-primary dark:bg-white/10 dark:hover:bg-primary"
          >
            {t('publicExperience.marketplace.card.viewListing')}
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
};
