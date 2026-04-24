import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Building2, MapPin, Home, 
  ArrowRight, Search, Plus, 
  TrendingUp,
  LayoutGrid, List, SlidersHorizontal,
  ChevronDown, ArrowUpDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import { buildingService } from '@/services/buildingService';
import { BuildingSummary } from '@/models/Building';
import { cn } from '@/utils';
import { useTranslation } from 'react-i18next';
import { BuildingModal } from '@/components/buildings/BuildingModal';
import { GridSkeleton } from '@/components/ui/StatusStates';
import { SidePanel } from '@/components/ui/SidePanel';

type BuildingSortKey = 'name' | 'totalRooms' | 'occupancyRate';
type OccupancyTier = 'low' | 'medium' | 'high' | '';
type CapacityScale = 'small' | 'medium' | 'large' | '';

const BuildingList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Basic State
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Advanced Filter State
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [occupancyTier, setOccupancyTier] = useState<OccupancyTier>('');
  const [capacityScale, setCapacityScale] = useState<CapacityScale>('');
  
  // Sort State
  const [sortBy, setSortBy] = useState<BuildingSortKey>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const { data: buildings, isLoading } = useQuery<BuildingSummary[]>({
    queryKey: ['buildings', search],
    queryFn: () => buildingService.getBuildings({ search })
  });

  // Client-side Advanced Filtering (more responsive for 100-200 items)
  const filteredBuildings = useMemo(() => {
    if (!buildings) return [];
    
    let result = [...buildings];

    // Filter by Occupancy Tier
    if (occupancyTier) {
      result = result.filter(b => {
        if (occupancyTier === 'low') return b.occupancyRate < 70;
        if (occupancyTier === 'medium') return b.occupancyRate >= 70 && b.occupancyRate <= 90;
        if (occupancyTier === 'high') return b.occupancyRate > 90;
        return true;
      });
    }

    // Filter by Capacity Scale
    if (capacityScale) {
       result = result.filter(b => {
        if (capacityScale === 'small') return b.totalRooms < 10;
        if (capacityScale === 'medium') return b.totalRooms >= 10 && b.totalRooms <= 30;
        if (capacityScale === 'large') return b.totalRooms > 30;
        return true;
       });
    }

    // Sorting
    result.sort((a, b) => {
      let valA: string | number = a[sortBy];
      let valB: string | number = b[sortBy];
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [buildings, occupancyTier, capacityScale, sortBy, sortOrder]);

  // Paginated View
  const totalPages = Math.ceil(filteredBuildings.length / pageSize);
  const paginatedBuildings = filteredBuildings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusColor = (rate: number) => {
    if (rate >= 90) return 'bg-success';
    if (rate >= 70) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative">
      <SidePanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        title={t('pages.buildings.advancedFilters')}
        footer={
          <div className="flex gap-4">
             <button
               onClick={() => {
                 setOccupancyTier('');
                 setCapacityScale('');
               }}
               className="btn-ghost flex-1 h-12"
             >
                Xoá bộ lọc
             </button>
             <button
               onClick={() => setIsFilterPanelOpen(false)}
               className="btn-primary flex-1 h-12"
             >
                Áp dụng
             </button>
          </div>
        }
      >
        <div className="space-y-8 p-6">
           {/* Occupancy Tier */}
           <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted">{t('pages.buildings.filters.occupancy')}</label>
              <div className="grid gap-3">
                 {(['low', 'medium', 'high'] as const).map((tier) => (
                   <button
                    key={tier}
                    onClick={() => setOccupancyTier(tier)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border-2 transition-all group",
                      occupancyTier === tier ? "border-primary bg-primary/5 scale-[1.02]" : "border-transparent bg-slate-50 hover:bg-slate-100"
                    )}
                   >
                      <div className="flex flex-col items-start gap-1">
                         <span className="font-black text-[13px]">{t(`performanceTier.${tier}`)}</span>
                         <span className="text-[10px] text-muted opacity-60">
                           {tier === 'low' && 'Dưới 70% lấp đầy'}
                           {tier === 'medium' && 'Từ 70% đến 90%'}
                           {tier === 'high' && 'Trên 90% lấp đầy'}
                         </span>
                      </div>
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 transition-all",
                        occupancyTier === tier ? "border-primary bg-primary" : "border-slate-300"
                      )} />
                   </button>
                 ))}
              </div>
           </div>

           {/* Capacity Scale */}
           <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted">{t('pages.buildings.filters.capacity')}</label>
              <div className="grid grid-cols-1 gap-3">
                 {([
                   { id: '', label: t('pages.buildings.filters.allCapacities'), icon: Building2 },
                   { id: 'small', label: t('pages.buildings.filters.small'), icon: Home },
                   { id: 'medium', label: t('pages.buildings.filters.medium'), icon: Building2 },
                   { id: 'large', label: t('pages.buildings.filters.large'), icon: Building2 }
                 ] as { id: CapacityScale; label: string; icon: React.ElementType }[]).map((cap) => (
                   <button
                    key={cap.id}
                    onClick={() => setCapacityScale(cap.id)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                      capacityScale === cap.id ? "border-primary bg-primary/5" : "border-transparent bg-slate-50 hover:bg-slate-100"
                    )}
                   >
                     <cap.icon size={18} className={cn(capacityScale === cap.id ? "text-primary" : "text-muted")} />
                     <span className="font-bold text-[13px]">{cap.label}</span>
                   </button>
                 ))}
              </div>
           </div>
        </div>
      </SidePanel>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-display text-primary leading-tight flex items-center gap-4">
            {t('pages.buildings.title')}
            <span className="text-[14px] bg-primary/10 text-primary px-3 py-1 rounded-full font-black animate-pulse">
              {filteredBuildings.length} {t('sidebar.buildings')}
            </span>
          </h1>
          <p className="text-body text-muted font-medium italic">{t('pages.buildings.description')}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary group h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-3 hover:scale-105 transition-transform"
        >
          <Plus className="group-hover:rotate-90 transition-transform" size={20} />
          <span className="font-bold">{t('pages.buildings.create')}</span>
        </button>
      </div>

      {/* Filter & Sorting Bar */}
      <div className="card-premium p-6 lg:p-8 bg-white border border-slate-100 shadow-2xl shadow-slate-200/40 rounded-[44px]">
        <div className="flex flex-col lg:flex-row items-end gap-6 w-full">
           {/* Search Input */}
           <div className="flex-1 space-y-2.5 group w-full lg:w-[450px] min-w-0">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1 flex items-center gap-2 group-focus-within:text-primary transition-colors">
                 <Search size={14} /> {t('actions.search') || 'Tìm kiếm toà nhà'}
              </label>
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-all duration-300" size={20} />
                <input 
                  type="text" 
                  placeholder={t('pages.buildings.searchPlaceholder')} 
                  className="w-full h-16 pl-16 pr-6 bg-slate-50/50 border border-slate-100 rounded-[28px] text-[15px] font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all placeholder:text-slate-300 shadow-inner-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
           </div>

           {/* Sorting Toggle */}
           <div className="space-y-2.5 w-full lg:w-auto shrink-0">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1 flex items-center gap-2">
                 <ArrowUpDown size={14} /> Sắp xếp theo
              </label>
              <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50/50 border border-slate-100 rounded-[28px] hover:border-slate-200 transition-all">
                 {([
                   { id: 'name', label: t('pages.buildings.sorting.name'), icon: Building2 },
                   { id: 'totalRooms', label: t('pages.buildings.sorting.totalRooms'), icon: LayoutGrid },
                   { id: 'occupancyRate', label: t('pages.buildings.sorting.occupancyRate'), icon: TrendingUp },
                 ] as { id: BuildingSortKey; label: string; icon: React.ElementType }[]).map((option) => (
                   <button
                    key={option.id}
                    onClick={() => {
                      if (sortBy === option.id) {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy(option.id);
                        setSortOrder('desc');
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2 px-5 h-12 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all whitespace-nowrap",
                      sortBy === option.id 
                        ? "bg-primary text-white shadow-lg shadow-primary/30" 
                        : "text-slate-500 hover:bg-white hover:text-primary"
                    )}
                   >
                     <option.icon size={16} />
                     {option.label}
                     {sortBy === option.id && (
                       <ChevronDown size={14} className={cn("transition-transform duration-300", sortOrder === 'desc' && "rotate-180")} />
                     )}
                   </button>
                 ))}
              </div>
           </div>

           <div className="flex items-center gap-3 ml-auto shrink-0">
              <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
                 <button
                   onClick={() => setViewMode('grid')}
                   className={cn(
                     "p-2.5 rounded-xl transition-all",
                     viewMode === 'grid' ? "bg-white shadow-md text-primary" : "text-muted hover:text-slate-900"
                   )}
                 >
                   <LayoutGrid size={20} />
                 </button>
                 <button
                   onClick={() => setViewMode('list')}
                   className={cn(
                     "p-2.5 rounded-xl transition-all",
                     viewMode === 'list' ? "bg-white shadow-md text-primary" : "text-muted hover:text-slate-900"
                   )}
                 >
                   <List size={20} />
                 </button>
              </div>

              <button
                onClick={() => setIsFilterPanelOpen(true)}
                className={cn(
                  "p-4 rounded-2xl transition-all shadow-sm border-2 flex items-center gap-2",
                  (occupancyTier || capacityScale) 
                    ? "bg-secondary/10 border-secondary text-secondary font-black" 
                    : "bg-white border-transparent text-muted hover:bg-slate-50"
                )}
              >
                <SlidersHorizontal size={20} />
                {(occupancyTier || capacityScale) && (
                  <span className="w-5 h-5 rounded-full bg-secondary text-white text-[10px] flex items-center justify-center animate-bounce-slow">
                    !
                  </span>
                )}
              </button>
           </div>
        </div>
      </div>

      {isLoading ? (
        <GridSkeleton count={6} />
      ) : filteredBuildings.length === 0 ? (
        <div className="card-premium h-[400px] flex flex-col items-center justify-center text-center p-20 bg-white/40 border-dashed border-2">
           <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8">
              <Search className="text-muted/20" size={48} />
           </div>
           <h2 className="text-h2 font-black text-slate-400 mb-2">Không tìm thấy kết quả</h2>
           <p className="text-body text-muted italic">Hãy thử thay đổi từ khoá hoặc điều chỉnh bộ lọc.</p>
           <button 
            onClick={() => { setSearch(''); setOccupancyTier(''); setCapacityScale(''); }}
            className="mt-8 text-primary font-bold hover:underline"
           >
              Làm mới toàn bộ lọc
           </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {paginatedBuildings.map((building) => (
            <Link
              key={building.id}
              to={`/owner/buildings/${building.id}`}
              aria-label={`Xem chi tiết tòa nhà ${building.name}`}
              className="group card-premium p-0 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer border-none shadow-xl shadow-primary/5 bg-white/40 backdrop-blur-md flex flex-col scale-[0.99] hover:scale-100 w-full"
            >
              {/* Hero Image */}
              <div className="relative h-72 overflow-hidden bg-slate-100">
                <img
                  src={building.heroImageUrl || `https://source.unsplash.com/800x600/?architecture,building&sig=${building.id}`}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                />
                <div className="absolute top-6 left-6">
                   <div className={cn(
                     "px-5 py-2.5 backdrop-blur-xl text-white text-[10px] font-black rounded-2xl uppercase tracking-widest shadow-2xl border border-white/20",
                     building.occupancyRate > 90 ? "bg-success/80" : (building.occupancyRate < 70 ? "bg-danger/80" : "bg-primary/80")
                   )}>
                      {building.occupancyRate}% {t('pages.dashboard.fillRate')}
                   </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent min-w-0">
                   <h3 className="text-white text-[32px] font-black leading-[1.1] mb-2 group-hover:translate-x-1 transition-transform truncate">{building.name}</h3>
                   <p className="text-white/80 text-[12px] font-bold flex items-center gap-3 tracking-wide truncate">
                      <MapPin size={14} className="text-secondary shrink-0" /> {building.address}
                   </p>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="p-8 space-y-8 flex-1 flex flex-col">
                 <div className="flex items-center justify-between">
                    <div className="space-y-1 min-w-0">
                       <p className="text-[11px] text-muted font-black uppercase tracking-[0.2em] truncate">{t('pages.dashboard.totalRooms')}</p>
                       <div className="flex items-baseline gap-2 truncate">
                          <p className="text-h2 font-black text-primary">{building.totalRooms}</p>
                          <span className="text-[13px] text-muted font-bold opacity-40 lowercase">vị trí</span>
                       </div>
                    </div>
                    <div className="h-12 w-px bg-slate-100 shrink-0" />
                    <div className="space-y-1 text-right min-w-0">
                       <p className="text-[11px] text-muted font-black uppercase tracking-[0.2em] truncate">{t('pages.dashboard.occupiedRooms')}</p>
                       <p className="text-h2 font-black text-secondary truncate">{building.occupiedRooms}</p>
                    </div>
                 </div>

                 <div className="flex items-center justify-between border-t border-dashed border-border/20 pt-8 mt-auto">
                    <div className="flex -space-x-3 shrink-0">
                       {[1, 2, 3, 4].map(i => (
                         <div key={i} className="w-11 h-11 rounded-full border-[3px] border-white bg-slate-900 shadow-xl overflow-hidden group/avatar">
                            <img src={`https://i.pravatar.cc/100?img=${(Number(building.id) + i) % 70}`} className="w-full h-full object-cover group-hover/avatar:scale-125 transition-transform" />
                         </div>
                       ))}
                       <div className="w-11 h-11 rounded-full border-[3px] border-white bg-slate-100 flex items-center justify-center text-[12px] font-black text-muted shadow-xl">
                         +{Math.floor(Math.random() * 50)}
                       </div>
                    </div>
                    <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-indigo-100 group-hover:shadow-indigo-200 shrink-0">
                       <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                 </div>
              </div>

              <div className={cn("h-2.5 w-full transition-all duration-1000 shrink-0", getStatusColor(building.occupancyRate))} />
            </Link>
          ))}
        </div>
      ) : (
        /* Dense List View */
        <div className="card-premium overflow-hidden p-0 border-none shadow-2xl p-0 bg-white/40">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-slate-50/80 text-muted text-[11px] font-black uppercase tracking-[0.2em]">
                    <th className="px-8 py-6">{t('sidebar.buildings')}</th>
                    <th className="px-6 py-6 ring-slate-100">Địa chỉ</th>
                    <th className="px-6 py-6 text-center">Phòng</th>
                    <th className="px-6 py-6 text-center">Lấp đầy</th>
                    <th className="px-6 py-6 text-right">Hiệu suất</th>
                    <th className="px-8 py-6"></th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                 {paginatedBuildings.map((building) => (
                   <tr 
                    key={building.id} 
                    className="group hover:bg-white/80 transition-colors cursor-pointer"
                    onClick={() => navigate(`/owner/buildings/${building.id}`)}
                   >
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
                               <img src={building.heroImageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100'} className="w-full h-full object-cover" />
                            </div>
                            <div>
                               <p className="font-black text-[15px] text-primary leading-tight">{building.name}</p>
                               <p className="text-[12px] text-muted/60">{building.buildingCode}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                         <p className="text-[13px] text-slate-500 font-medium truncate max-w-xs">{building.address}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                         <p className="font-black text-[16px]">{building.totalRooms}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                         <div className="flex flex-col items-center gap-1.5">
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                               <div className={cn("h-full transition-all duration-1000", getStatusColor(building.occupancyRate))} style={{ width: `${building.occupancyRate}%` }} />
                            </div>
                            <p className="text-[12px] font-black text-slate-400">{building.occupiedRooms} / {building.totalRooms}</p>
                         </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                         <span className={cn(
                           "px-3 py-1 rounded-lg text-[11px] font-black ring-1",
                           building.occupancyRate > 90 ? "bg-success/10 text-success ring-success/20" : "bg-primary/10 text-primary ring-primary/20"
                         )}>
                            {building.occupancyRate}%
                         </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <ArrowRight size={18} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all inline-block" />
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {/* Pagination Container */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-12 bg-white/60 backdrop-blur-xl p-4 rounded-[2rem] shadow-premium">
           <p className="text-[13px] text-muted font-bold ml-4">
              Hiển thị <span className="text-primary font-black">{(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredBuildings.length)}</span> trong số <span className="text-primary font-black">{filteredBuildings.length}</span> toà nhà
           </p>
           <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-slate-100 shadow-sm hover:bg-slate-50 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex items-center gap-1">
                 {Array.from({ length: totalPages }).map((_, i) => (
                   <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "w-12 h-12 rounded-2xl font-black text-[13px] transition-all",
                      currentPage === i + 1 ? "bg-primary text-white shadow-lg shadow-primary/30 scale-110" : "hover:bg-slate-50 text-muted"
                    )}
                   >
                     {i + 1}
                   </button>
                 ))}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-slate-100 shadow-sm hover:bg-slate-50 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={20} />
              </button>
           </div>
        </div>
      )}

      {/* Floating Action Button (Mobile) */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-10 right-10 w-16 h-16 rounded-full bg-primary text-white shadow-3xl shadow-primary/40 flex md:hidden items-center justify-center z-50 animate-bounce-slow"
      >
        <Plus size={32} />
      </button>

      <BuildingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default BuildingList;
