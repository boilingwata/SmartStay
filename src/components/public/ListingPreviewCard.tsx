import React, { useMemo, useState } from 'react';
import { ArrowRight, Heart, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SafeImage from '@/components/ui/SafeImage';
import { cn, formatVND } from '@/utils';
import type { PublicListing } from '@/services/publicListingsService';

const previewImages = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80',
];

type ListingPreviewCardProps = {
  listing: PublicListing;
  index: number;
  href?: string;
  badges?: string[];
  accent?: 'featured' | 'latest';
  skeleton?: boolean;
};

export const ListingPreviewCard: React.FC<ListingPreviewCardProps> = ({
  listing,
  index,
  href,
  badges,
  skeleton = false,
}) => {
  const { t } = useTranslation('public', { lng: 'vi' });
  const [liked, setLiked] = useState(false);

  const cardHref = href ?? `/listings/${listing.roomId}`;
  const imageSrc = previewImages[index % previewImages.length];

  const cardBadges = useMemo(() => {
    if (badges && badges.length > 0) return badges;
    const derived = [t('publicExperience.marketplace.card.verified')];
    if (index % 3 === 0) derived.unshift(t('publicExperience.marketplace.card.hot'));
    else derived.unshift(t('publicExperience.marketplace.card.new'));
    return derived;
  }, [badges, index, t]);

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

      {/* ── Image ─────────────────────────────────────── */}
      <div className="relative h-60 overflow-hidden">
        <SafeImage
          src={imageSrc}
          alt={listing.roomCode}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Top fade for badge contrast */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent" />

        {/* Badges + heart */}
        <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {cardBadges.slice(0, 2).map((badge) => (
              <span
                key={`${listing.roomId}-${badge}`}
                className="rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-sm"
              >
                {badge}
              </span>
            ))}
          </div>

          <button
            type="button"
            aria-label={t('publicExperience.marketplace.card.favorite')}
            onClick={() => setLiked((current) => !current)}
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur-sm transition-all',
              liked
                ? 'border-white/30 bg-white text-rose-500'
                : 'border-white/20 bg-black/30 text-white hover:bg-black/40'
            )}
          >
            <Heart size={15} className={liked ? 'fill-current' : ''} />
          </button>
        </div>

        {/* Availability pill — bottom left */}
        <div className="absolute bottom-3 left-3">
          <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-white shadow-sm">
            {listing.availabilityLabel}
          </span>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────── */}
      <div className="p-5">

        {/* 1. Price — dominant */}
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

        {/* 2. Title */}
        <div className="mt-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted">
            {listing.roomType}
          </p>
          <h3 className="mt-1 line-clamp-1 text-base font-bold text-slate-900 dark:text-white">
            {listing.roomCode} · {listing.buildingName}
          </h3>
        </div>

        {/* 3. Location */}
        <div className="mt-2.5 flex items-start gap-1.5">
          <MapPin size={13} className="mt-0.5 shrink-0 text-muted" />
          <span className="line-clamp-1 text-[13px] text-muted">{listing.buildingAddress}</span>
        </div>

        {/* 4. Tags */}
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

        {/* 5. CTA — full width */}
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
