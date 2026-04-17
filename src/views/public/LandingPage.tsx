import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PublicTopbar } from '@/components/public/PublicTopbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { HeroSection } from '@/components/public/HeroSection';
import { RoomTypesSection } from '@/components/public/RoomTypesSection';
import { HomepageListingSection } from '@/components/public/HomepageListingSection';
import { LocationSection } from '@/components/public/LocationSection';
import publicListingsService from '@/services/publicListingsService';
import type { PublicListing } from '@/services/publicListingsService';

function filterByType(listings: PublicListing[], aliases: string[]) {
  return listings.filter((l) =>
    aliases.some((a) => l.roomType.toLowerCase().includes(a))
  );
}

const LandingPage: React.FC = () => {
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['public-room-listings'],
    queryFn: () => publicListingsService.getListings(),
  });

  const roomListings = useMemo(
    () => filterByType(listings, ['room', 'phòng', 'phong', 'studio']),
    [listings]
  );

  const aptListings = useMemo(
    () => filterByType(listings, ['apartment', 'căn hộ', 'can ho', 'chung cư', 'chung cu', 'mini']),
    [listings]
  );

  const fallback = listings.slice(0, 8);

  return (
    <div className="bg-white min-h-screen">
      <PublicTopbar />

      {/* Hero starts at y=0; topbar overlays it */}
      <HeroSection />

      <div className="pb-8">
        <RoomTypesSection />

        <HomepageListingSection
          title="Phòng trọ"
          listings={roomListings.length > 0 ? roomListings : fallback}
          isLoading={isLoading}
          viewAllHref="/listings?roomType=room"
        />

        <HomepageListingSection
          title="Chung cư mini"
          listings={aptListings.length > 0 ? aptListings : fallback}
          isLoading={isLoading}
          viewAllHref="/listings?roomType=apartment"
        />

        <LocationSection />
      </div>

      <PublicFooter />
    </div>
  );
};

export default LandingPage;
