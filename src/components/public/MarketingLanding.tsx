import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BedDouble,
  Building2,
  FileText,
  Home,
  Store,
  Users,
  WalletCards,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PublicListing } from '@/services/publicListingsService';
import { ListingPreviewCard } from './ListingPreviewCard';

const fallbackListings: PublicListing[] = [
  { roomId: 'curated-1', roomCode: 'Studio Ban Công View Hồ', roomType: 'room', areaSqm: 28, baseRent: 7200000, maxOccupants: 2, floorNumber: 6, hasBalcony: true, hasPrivateBathroom: true, availabilityLabel: 'Có thể vào ở ngay', buildingId: 'building-1', buildingName: 'Westlake Maison', buildingAddress: 'Tây Hồ, Hà Nội', amenities: ['Ban công', 'Máy giặt', 'Bãi xe'] },
  { roomId: 'curated-2', roomCode: 'Căn Hộ 1PN Trung Tâm', roomType: 'apartment', areaSqm: 42, baseRent: 11800000, maxOccupants: 2, floorNumber: 12, hasBalcony: true, hasPrivateBathroom: true, availabilityLabel: 'Có thể vào ở ngay', buildingId: 'building-2', buildingName: 'Saigon Central Living', buildingAddress: 'Quận 1, TP Hồ Chí Minh', amenities: ['Gym', 'Hồ bơi', 'Lễ tân'] },
  { roomId: 'curated-3', roomCode: 'Nhà Phố Gia Định', roomType: 'house', areaSqm: 74, baseRent: 18900000, maxOccupants: 4, floorNumber: 2, hasBalcony: false, hasPrivateBathroom: true, availabilityLabel: 'Sẵn sàng xem phòng', buildingId: 'building-3', buildingName: 'Gia Dinh Collection', buildingAddress: 'Gò Vấp, TP Hồ Chí Minh', amenities: ['Bếp riêng', 'Sân thượng', 'Chỗ để xe'] },
  { roomId: 'curated-4', roomCode: 'Phòng Trọ Mới Xây', roomType: 'room', areaSqm: 24, baseRent: 4600000, maxOccupants: 2, floorNumber: 4, hasBalcony: false, hasPrivateBathroom: true, availabilityLabel: 'Có thể vào ở ngay', buildingId: 'building-4', buildingName: 'Binh Duong Urban Stay', buildingAddress: 'Thuận An, Bình Dương', amenities: ['Bảo vệ', 'Thang máy', 'Wifi'] },
  { roomId: 'curated-5', roomCode: 'Căn Hộ Sông Hàn', roomType: 'apartment', areaSqm: 51, baseRent: 13500000, maxOccupants: 3, floorNumber: 9, hasBalcony: true, hasPrivateBathroom: true, availabilityLabel: 'Sẵn sàng xem phòng', buildingId: 'building-5', buildingName: 'Han River Residence', buildingAddress: 'Sơn Trà, Đà Nẵng', amenities: ['Nội thất', 'View sông', 'Lễ tân'] },
  { roomId: 'curated-6', roomCode: 'Mặt Bằng Tầng Trệt', roomType: 'retail', areaSqm: 68, baseRent: 22000000, maxOccupants: 6, floorNumber: 1, hasBalcony: false, hasPrivateBathroom: false, availabilityLabel: 'Đang mở cho thuê', buildingId: 'building-6', buildingName: 'District Prime', buildingAddress: 'Quận 7, TP Hồ Chí Minh', amenities: ['Mặt tiền', 'Bảo vệ', 'Chỗ xe'] },
];

const buildBrowseHref = (options: { search?: string; roomType?: string; maxPrice?: string }) => {
  const params = new URLSearchParams();
  if (options.search) params.set('search', options.search);
  if (options.roomType && options.roomType !== 'all') params.set('roomType', options.roomType);
  if (options.maxPrice && options.maxPrice !== 'any') params.set('maxPrice', options.maxPrice);
  const query = params.toString();
  return query ? `/listings?${query}` : '/listings';
};

const parseAddress = (address: string) => address.split(',').map((part) => part.trim()).filter(Boolean);
const deriveCity = (address: string) => {
  const value = parseAddress(address).at(-1) ?? '';
  if (/ho chi minh|saigon/i.test(value)) return 'TP Ho Chi Minh';
  if (/ha noi/i.test(value)) return 'Ha Noi';
  if (/da nang/i.test(value)) return 'Da Nang';
  if (/binh duong/i.test(value)) return 'Binh Duong';
  return value;
};
const deriveDistrict = (address: string) => parseAddress(address)[0] ?? '';

const takeListings = (source: PublicListing[], start: number, count: number) => {
  const slice = source.slice(start, start + count);
  if (slice.length >= count) return slice;
  return [...slice, ...fallbackListings.slice(0, count - slice.length)];
};

type MarketingLandingProps = {
  previewListings: PublicListing[];
  isLoading: boolean;
};

export const MarketingLanding: React.FC<MarketingLandingProps> = ({ previewListings, isLoading }) => {
  const { t } = useTranslation('public', { lng: 'vi' });

  const listings = previewListings.length > 0 ? previewListings : fallbackListings;
  const featuredListings = useMemo(() => takeListings(listings, 0, 4), [listings]);
  const latestListings = useMemo(() => takeListings(listings, 2, 6), [listings]);

  const cityCards = useMemo(() => {
    const grouped = new Map<string, number>();
    listings.forEach((listing) => {
      const city = deriveCity(listing.buildingAddress);
      grouped.set(city, (grouped.get(city) ?? 0) + 1);
    });

    const cards = Array.from(grouped.entries()).slice(0, 4).map(([name, count], index) => ({
      name,
      count,
      search: name,
      image: [
        'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
      ][index],
    }));

    return cards.length > 0 ? cards : [
      { name: 'TP Ho Chi Minh', count: 1200, search: 'TP Ho Chi Minh', image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80' },
      { name: 'Ha Noi', count: 930, search: 'Ha Noi', image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80' },
      { name: 'Binh Duong', count: 420, search: 'Binh Duong', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80' },
      { name: 'Da Nang', count: 360, search: 'Da Nang', image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80' },
    ];
  }, [listings]);

  const districtCards = useMemo(() => {
    const grouped = new Map<string, number>();
    listings.forEach((listing) => {
      const district = deriveDistrict(listing.buildingAddress);
      grouped.set(district, (grouped.get(district) ?? 0) + 1);
    });

    const cards = Array.from(grouped.entries()).slice(0, 8).map(([name, count]) => ({ name, count, search: name }));
    return cards.length > 0 ? cards : ['Quan 1', 'Quan 7', 'Tay Ho', 'Cau Giay', 'Thu Duc', 'Son Tra', 'Hai Chau', 'Thuan An'].map((name, index) => ({ name, count: 64 - index * 4, search: name }));
  }, [listings]);

  const projects = useMemo(() => {
    const seen = new Set<string>();
    const cards = listings.filter((listing) => {
      if (seen.has(listing.buildingName)) return false;
      seen.add(listing.buildingName);
      return true;
    }).slice(0, 4).map((listing, index) => ({
      name: listing.buildingName,
      developer: ['SmartStay Developments', 'Urban Living Group', 'Blue Door Capital', 'City Habitat Partners'][index % 4],
      location: deriveCity(listing.buildingAddress),
      priceRange: `${listing.baseRent.toLocaleString('vi-VN')} - ${Math.round(listing.baseRent * 1.25).toLocaleString('vi-VN')} VND`,
      href: buildBrowseHref({ search: listing.buildingName }),
    }));

    return cards.length > 0 ? cards : [
      { name: 'Westlake Maison', developer: 'SmartStay Developments', location: 'Ha Noi', priceRange: '7.2M - 12.5M VND', href: buildBrowseHref({ search: 'Westlake Maison' }) },
      { name: 'Saigon Central Living', developer: 'Urban Living Group', location: 'TP Ho Chi Minh', priceRange: '11.8M - 18.6M VND', href: buildBrowseHref({ search: 'Saigon Central Living' }) },
      { name: 'Han River Residence', developer: 'Blue Door Capital', location: 'Da Nang', priceRange: '13.5M - 18.9M VND', href: buildBrowseHref({ search: 'Han River Residence' }) },
      { name: 'Binh Duong Urban Stay', developer: 'City Habitat Partners', location: 'Binh Duong', priceRange: '4.6M - 8.2M VND', href: buildBrowseHref({ search: 'Binh Duong Urban Stay' }) },
    ];
  }, [listings]);

  const categories = [
    { icon: BedDouble, label: t('publicExperience.marketplace.categories.room'), href: buildBrowseHref({ roomType: 'room' }) },
    { icon: Building2, label: t('publicExperience.marketplace.categories.apartment'), href: buildBrowseHref({ roomType: 'apartment' }) },
    { icon: Home, label: t('publicExperience.marketplace.categories.house'), href: buildBrowseHref({ roomType: 'house' }) },
    { icon: Store, label: t('publicExperience.marketplace.categories.retail'), href: buildBrowseHref({ roomType: 'retail' }) },
  ];

  const ownerFeatures = [
    { icon: Building2, title: 'Đăng và cập nhật phòng trống', description: 'Tập trung vào danh sách đang mở cho thuê, giá thuê và thông tin cần thiết để khách ra quyết định nhanh.' },
    { icon: Users, title: 'Nhận đơn thuê tập trung', description: 'Mỗi hồ sơ thuê được gom về một nơi để chủ nhà và đội launch phản hồi mà không cần CRM riêng.' },
    { icon: WalletCards, title: 'Giữ luồng quản lý gọn', description: 'Workspace launch chỉ ưu tiên tin đăng, tình trạng phòng và đơn thuê thay vì mở ra cả hệ thống vận hành phức tạp.' },
  ];

  return (
    <main className="overflow-hidden bg-[linear-gradient(180deg,#f2eadf_0%,#f8fafc_22%,#ffffff_62%,#f3f7fb_100%)] text-foreground dark:bg-[linear-gradient(180deg,#040b16_0%,#091424_30%,#08111f_68%,#040b16_100%)]">
      <section className="relative overflow-hidden pb-16 pt-28 lg:pb-20 lg:pt-36">
        <div className="absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-[520px] bg-[linear-gradient(110deg,rgba(5,10,22,0.82),rgba(5,10,22,0.55))]" />
          <div className="absolute inset-0 bg-cover bg-center opacity-35" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1800&q=80')" }} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(242,100,25,0.26),transparent_24%),radial-gradient(circle_at_right,rgba(13,138,138,0.24),transparent_24%)]" />
        </div>

        <div className="relative mx-auto max-w-[1280px] px-6">
          <div className="max-w-4xl text-white">
            <p className="inline-flex rounded-full border border-white/16 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-white/76 backdrop-blur-md">{t('publicExperience.marketplace.hero.eyebrow')}</p>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.94] tracking-tight md:text-6xl lg:text-[76px]">{t('publicExperience.marketplace.hero.title')}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/78 lg:text-lg">{t('publicExperience.marketplace.hero.description')}</p>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/listings"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-black text-primary shadow-[0_20px_50px_-24px_rgba(255,255,255,0.38)] transition-all hover:-translate-y-0.5"
            >
              {t('publicExperience.marketplace.finalCta.primary')}
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/login?intent=owner"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/18 bg-white/10 px-6 text-sm font-black text-white transition-all hover:bg-white/16"
            >
              Đăng tin cho thuê
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/16 bg-white/10 px-5 py-4 text-sm leading-7 text-white/82 backdrop-blur-md">
            {t('publicExperience.marketplace.hero.searchHint')}
          </div>
        </div>
      </section>

      <section id="categories" className="public-section py-12 lg:py-14">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="public-kicker">{t('publicExperience.marketplace.categories.eyebrow')}</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white lg:text-4xl">{t('publicExperience.marketplace.categories.title')}</h2>
          </div>
          <Link to="/listings" className="hidden items-center gap-2 text-sm font-bold text-primary lg:inline-flex">{t('publicExperience.marketplace.categories.viewAll')}<ArrowRight size={16} /></Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.label} to={category.href} className="group rounded-[28px] border border-border/70 bg-card p-6 shadow-[0_20px_56px_-40px_rgba(15,23,42,0.34)] transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_30px_80px_-42px_rgba(15,23,42,0.44)] dark:bg-white/5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 text-primary dark:bg-primary/12"><category.icon size={24} /></div>
              <h3 className="mt-5 text-2xl font-black tracking-tight text-foreground">{category.label}</h3>
              <p className="mt-2 text-sm leading-7 text-muted">{t('publicExperience.marketplace.categories.explore')}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="featured" className="public-section pt-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="public-kicker">{t('publicExperience.marketplace.featured.eyebrow')}</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white">{t('publicExperience.marketplace.featured.title')}</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">{t('publicExperience.marketplace.featured.description')}</p>
          </div>
          <Link to="/listings" className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-5 py-3 text-sm font-bold text-foreground transition-all hover:border-primary/25 hover:text-primary dark:bg-white/5">{t('publicExperience.marketplace.featured.viewAll')}<ArrowRight size={16} /></Link>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {(isLoading ? Array.from({ length: 4 }).map((_, index) => ({ listing: fallbackListings[index], skeleton: true })) : featuredListings.map((listing) => ({ listing, skeleton: false }))).map(({ listing, skeleton }, index) => (
            <ListingPreviewCard key={`featured-${listing.roomId}-${index}`} listing={listing} index={index} skeleton={skeleton} badges={skeleton ? undefined : [t('publicExperience.marketplace.card.hot'), t('publicExperience.marketplace.card.verified')]} />
          ))}
        </div>
      </section>

      <section className="public-section pt-8 lg:pt-10">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="public-kicker">{t('publicExperience.marketplace.latest.eyebrow')}</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white">{t('publicExperience.marketplace.latest.title')}</h2>
          </div>
          <p className="hidden max-w-xl text-sm leading-7 text-muted lg:block">{t('publicExperience.marketplace.latest.description')}</p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {(isLoading ? Array.from({ length: 6 }).map((_, index) => ({ listing: fallbackListings[index % fallbackListings.length], skeleton: true })) : latestListings.map((listing) => ({ listing, skeleton: false }))).map(({ listing, skeleton }, index) => (
            <ListingPreviewCard key={`latest-${listing.roomId}-${index}`} listing={listing} index={index + 4} accent="latest" skeleton={skeleton} />
          ))}
        </div>
      </section>

      <section id="locations" className="public-section pt-8 lg:pt-10">
        <div className="public-section-header mb-10 max-w-none text-left">
          <p className="public-kicker">{t('publicExperience.marketplace.locations.eyebrow')}</p>
          <h2 className="public-title text-left">{t('publicExperience.marketplace.locations.title')}</h2>
          <p className="public-subtitle max-w-2xl text-left">{t('publicExperience.marketplace.locations.description')}</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {cityCards.map((city) => (
            <Link key={city.name} to={buildBrowseHref({ search: city.search })} className="group relative overflow-hidden rounded-[30px] border border-border/70 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.42)]">
              <div className="h-72 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${city.image}')` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/82 via-slate-950/26 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="text-sm font-semibold text-white/68">{city.count} {t('publicExperience.marketplace.locations.listingsCount')}</p>
                <h3 className="mt-2 text-3xl font-black tracking-tight">{city.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="public-section pt-8 lg:pt-10">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="public-kicker">{t('publicExperience.marketplace.districts.eyebrow')}</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white">{t('publicExperience.marketplace.districts.title')}</h2>
          </div>
          <p className="hidden max-w-xl text-sm leading-7 text-muted lg:block">{t('publicExperience.marketplace.districts.description')}</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {districtCards.map((district) => (
            <Link key={district.name} to={buildBrowseHref({ search: district.search })} className="rounded-[24px] border border-border/70 bg-card px-5 py-5 shadow-[0_18px_54px_-40px_rgba(15,23,42,0.36)] transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:text-primary dark:bg-white/5">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted">{district.count} {t('publicExperience.marketplace.districts.available')}</p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-foreground">{district.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      <section className="public-section pt-8 lg:pt-10">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="public-kicker">{t('publicExperience.marketplace.projects.eyebrow')}</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white">{t('publicExperience.marketplace.projects.title')}</h2>
          </div>
          <p className="hidden max-w-xl text-sm leading-7 text-muted lg:block">{t('publicExperience.marketplace.projects.description')}</p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {projects.map((project) => (
            <Link key={project.name} to={project.href} className="rounded-[28px] border border-border/70 bg-card p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.4)] transition-all hover:-translate-y-1 hover:border-primary/25 dark:bg-white/5">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary">{project.location}</p>
              <h3 className="mt-4 text-2xl font-black tracking-tight text-foreground">{project.name}</h3>
              <p className="mt-3 text-sm font-semibold text-muted">{project.developer}</p>
              <div className="mt-6 rounded-[24px] bg-primary/6 px-4 py-4 dark:bg-primary/10">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">{t('publicExperience.marketplace.projects.priceRange')}</p>
                <p className="mt-2 text-lg font-black text-foreground">{project.priceRange}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="guides" className="public-section pt-8 lg:pt-10">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="public-kicker">{t('publicExperience.marketplace.guides.eyebrow')}</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white">{t('publicExperience.marketplace.guides.title')}</h2>
          </div>
          <p className="hidden max-w-xl text-sm leading-7 text-muted lg:block">{t('publicExperience.marketplace.guides.description')}</p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {['card1', 'card2', 'card3'].map((key) => (
            <article key={key} className="rounded-[28px] border border-border/70 bg-card p-6 shadow-[0_20px_56px_-42px_rgba(15,23,42,0.34)] dark:bg-white/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/12 text-accent"><FileText size={20} /></div>
              <h3 className="mt-5 text-2xl font-black tracking-tight text-foreground">{t(`publicExperience.marketplace.guides.${key}Title`)}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{t(`publicExperience.marketplace.guides.${key}Description`)}</p>
              <Link to="/listings" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-secondary">{t('publicExperience.marketplace.guides.readGuide')}<ArrowRight size={16} /></Link>
            </article>
          ))}
        </div>
      </section>

      <section id="owners" className="public-section pt-8 lg:pt-10">
        <div className="overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#0d1b2d_0%,#17335c_48%,#0d8a8a_100%)] px-8 py-10 text-white shadow-[0_36px_90px_-44px_rgba(9,20,36,0.88)] lg:px-12 lg:py-12">
          <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/64">{t('publicExperience.marketplace.owner.eyebrow')}</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight lg:text-5xl">Quản lý tin đăng và đơn thuê trong một workspace gọn.</h2>
              <p className="mt-4 text-sm leading-8 text-white/76 lg:text-base">
                SmartStay launch không cố biến phần chủ nhà thành một BMS đầy đủ. Trước mắt, bạn chỉ cần nơi để cập nhật phòng trống,
                giữ danh mục sạch và phản hồi khách thuê nhanh.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/login?intent=owner" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-primary transition-all hover:bg-[#f7ede6]">Đăng nhập chủ nhà<ArrowRight size={16} /></Link>
                <Link to="/login?intent=owner" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/16 bg-white/10 px-5 text-sm font-black text-white transition-all hover:bg-white/14">Tôi đã có tài khoản</Link>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {ownerFeatures.map((feature) => (
                <article key={feature.title} className="rounded-[26px] border border-white/12 bg-white/8 p-5 backdrop-blur-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white"><feature.icon size={20} /></div>
                  <h3 className="mt-4 text-lg font-black tracking-tight">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/72">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 pt-8">
        <div className="mx-auto max-w-[1280px] overflow-hidden rounded-[34px] border border-border/70 bg-card px-8 py-10 shadow-[0_28px_80px_-46px_rgba(15,23,42,0.42)] dark:bg-white/5 lg:px-12 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="public-kicker">{t('publicExperience.marketplace.finalCta.eyebrow')}</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white lg:text-5xl">{t('publicExperience.marketplace.finalCta.title')}</h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">{t('publicExperience.marketplace.finalCta.description')}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link to="/listings" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-black text-primary-foreground transition-all hover:bg-primary/95">{t('publicExperience.marketplace.finalCta.primary')}<ArrowRight size={16} /></Link>
              <Link to="/login?intent=owner" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 text-sm font-black text-foreground transition-all hover:border-primary/25 hover:text-primary dark:bg-white/5 dark:text-white">Đăng nhập để đăng tin<ArrowRight size={16} /></Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
