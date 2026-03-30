import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Building2, MapPin, Home, Users, 
  ArrowRight, Search, Plus, Filter,
  MoreVertical, TrendingUp, TrendingDown
} from 'lucide-react';
import { buildingService } from '@/services/buildingService';
import { BuildingSummary } from '@/models/Building';
import { cn, formatPercentage } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { toast } from 'sonner';
import { BuildingModal } from '@/components/buildings/BuildingModal';
import { GridSkeleton } from '@/components/ui/StatusStates';

const BuildingList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: buildings, isLoading } = useQuery<BuildingSummary[]>({
    queryKey: ['buildings', search],
    queryFn: () => buildingService.getBuildings({ search })
  });

  const getStatusColor = (rate: number) => {
    if (rate >= 90) return 'bg-success';
    if (rate >= 70) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-display text-primary">Danh mục Toà nhà</h1>
          <p className="text-body text-muted">Quản lý hiệu suất khai thác và tài chính trên từng bất động sản.</p>
        </div>
        <div className="relative w-full md:w-96">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
           <input 
             type="text" 
             placeholder="Tìm tên toà nhà, khu vực..." 
             className="input-base w-full pl-12 pr-4 h-12 shadow-sm focus:shadow-lg transition-all"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />
        </div>
      </div>

      {isLoading ? (
        <GridSkeleton count={6} />
      ) : (
        /* 2.1.1 Card Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {buildings?.map((building) => (
            <Link
              key={building.id}
              to={`/admin/buildings/${building.id}`}
              className="group card-container p-0 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer border-none shadow-xl shadow-primary/5 bg-white/40 backdrop-blur-md block"
            >
              {/* Hero Image */}
              <div className="relative h-60 overflow-hidden">
                <img
                  src={building.heroImageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'}
                  alt={building.buildingName}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4">
                   <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-primary text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg">
                      {building.type}
                   </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                   <h3 className="text-white text-h2 font-black tracking-tight leading-none group-hover:translate-x-1 transition-transform">{building.buildingName}</h3>
                   <p className="text-white/60 text-[11px] font-medium flex items-center gap-1.5 mt-2">
                      <MapPin size={12} className="text-white" /> {building.address}
                   </p>
                </div>
              </div>

              {/* Stats - RULE-02 compliance (Total from view) */}
              <div className="p-6 space-y-6">
                 <div className="grid grid-cols-3 gap-4 border-b border-dashed pb-6">
                    <div className="text-center">
                       <p className="text-[10px] text-muted font-black uppercase tracking-tighter mb-1">Tổng phòng</p>
                       <p className="text-h3 font-black text-primary">{building.totalRooms}</p>
                    </div>
                    <div className="text-center">
                       <p className="text-[10px] text-muted font-black uppercase tracking-tighter mb-1">Đang thuê</p>
                       <p className="text-h3 font-black text-secondary">{building.occupiedRooms}</p>
                    </div>
                    <div className="text-center">
                       <p className="text-[10px] text-muted font-black uppercase tracking-tighter mb-1">Tỉ lệ lấp</p>
                       <div className="flex items-center justify-center gap-1">
                          <p className="text-h3 font-black text-primary">{building.occupancyRate}%</p>
                          {building.occupancyRate > 80 ? <TrendingUp size={14} className="text-success" /> : <TrendingDown size={14} className="text-warning" />}
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                       {[1, 2, 3].map(i => (
                         <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-bg flex items-center justify-center text-[10px] font-bold text-muted shadow-sm">U{i}</div>
                       ))}
                       <div className="w-8 h-8 rounded-full border-2 border-white bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shadow-sm">+9</div>
                    </div>
                      <div 
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:gap-3 transition-all"
                      >
                         Chi tiết toà nhà <ArrowRight size={14} />
                      </div>
                 </div>
              </div>

              {/* Status Strip (2.1.1) */}
              <div className={cn("h-1.5 w-full", getStatusColor(building.occupancyRate))} />
            </Link>
          ))}
        </div>
      )}

      {/* Floating Action Button (2.1.1) */}
      <button 
        className="fixed bottom-10 right-10 w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-40 group"
        onClick={() => setIsModalOpen(true)}
      >
         <Plus size={32} className="group-hover:rotate-90 transition-transform duration-500" />
         <span className="absolute right-20 bg-primary px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
            Thêm toà nhà mới
         </span>
      </button>

      <BuildingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default BuildingList;
