import React, { useState, useMemo } from 'react';
import { 
  Building2, Home, Search, 
  LayoutGrid, List, Plus, 
  Edit, Zap, Maximize,
  SlidersHorizontal, 
  X, ArrowUpAz, ArrowDownAz,
  MapPin, Sparkles, ArrowRight,
  AlertCircle, ChevronRight, Navigation,
  Share2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { roomService } from '@/services/roomService';
import { Room, RoomStatus, RoomType, DirectionFacing, type RoomFilters } from '@/models/Room';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn, formatVND } from '@/utils';
import useUIStore from '@/stores/uiStore';
import { usePermission } from '@/hooks/usePermission';
import { RoomModal } from '@/components/rooms/RoomModal';
import { SelectAsync } from '@/components/ui/SelectAsync';
import { buildingService } from '@/services/buildingService';
import { ErrorBanner } from '@/components/ui/StatusStates';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { SidePanel } from '@/components/ui/SidePanel';

const RoomList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
  const activeBuildingId = useUIStore((s) => s.activeBuildingId);
  const setBuilding = useUIStore((s) => s.setBuilding);
  
  const canManage = hasPermission('room.manage');
  const [viewMode, setViewMode] = useState<'List' | 'Grid'>(
    (localStorage.getItem('roomViewMode') as 'List' | 'Grid') || 'Grid'
  );
  
  // Search & Basic Filters
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'area' | 'floor' | 'code'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Advanced Filter states
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<RoomType | ''>('');
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [minFloor, setMinFloor] = useState<number | undefined>();
  const [maxFloor, setMaxFloor] = useState<number | undefined>();
  const [minArea, setMinArea] = useState<number | undefined>();
  const [maxArea, setMaxArea] = useState<number | undefined>();
  const [facing, setFacing] = useState<DirectionFacing | ''>('');
  const [isListedFilter, setIsListedFilter] = useState<boolean | undefined>(undefined);

  const toggleView = (mode: 'List' | 'Grid') => {
    setViewMode(mode);
    localStorage.setItem('roomViewMode', mode);
  };

  const { data: rooms, isLoading, isError, refetch } = useQuery<Room[]>({
    queryKey: ['rooms', activeBuildingId, search, statusFilter, typeFilter, facing, minPrice, maxPrice, minFloor, maxFloor, minArea, maxArea, isListedFilter, sortBy, sortOrder],
    queryFn: () => {
      const numericId = Number(activeBuildingId);
      const safeId = (activeBuildingId != null && activeBuildingId !== '' && Number.isFinite(numericId) && numericId > 0)
        ? String(activeBuildingId)
        : undefined;
        
      return roomService.getRooms({
        buildingId: safeId,
        search,
        status: statusFilter.length > 0 ? statusFilter as RoomStatus[] : undefined,
        roomType: typeFilter || undefined,
        facing: facing || undefined,
        minPrice,
        maxPrice,
        minFloor,
        maxFloor,
        minArea,
        maxArea,
        isListed: isListedFilter,
        sortBy,
        sortOrder
      });
    }
  });

  const clearFilters = () => {
    setSearch('');
    setStatusFilter([]);
    setTypeFilter('');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setMinFloor(undefined);
    setMaxFloor(undefined);
    setMinArea(undefined);
    setMaxArea(undefined);
    setFacing('');
    setIsListedFilter(undefined);
    toast.success("Đã xoá bộ lọc");
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter.length > 0) count++;
    if (typeFilter) count++;
    if (minPrice || maxPrice) count++;
    if (minFloor || maxFloor) count++;
    if (minArea || maxArea) count++;
    if (facing) count++;
    if (isListedFilter !== undefined) count++;
    return count;
  }, [statusFilter, typeFilter, minPrice, maxPrice, minFloor, maxFloor, minArea, maxArea, facing, isListedFilter]);

  const handleCreateRoom = () => {
    setSelectedRoom(null);
    setIsModalOpen(true);
  };

  const handleEditRoom = (room: Room, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">
              Quản lý vận hành
            </span>
            <div className="h-px w-8 bg-primary/20"></div>
          </div>
          <h1 className="text-display text-slate-900 leading-tight flex flex-wrap items-center gap-4">
            <span className="min-w-0 break-words">{t('pages.rooms.title')}</span>
            <div className="h-10 w-10 shrink-0 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
               <Home size={24} />
            </div>
          </h1>
          <p className="text-body text-muted font-medium italic max-w-2xl">{t('pages.rooms.description')}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/50 shadow-sm">
            <button
              onClick={() => toggleView('Grid')}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-xl transition-all",
                viewMode === 'Grid' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => toggleView('List')}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-xl transition-all",
                viewMode === 'List' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <List size={18} />
            </button>
          </div>
          {canManage && (
            <button
              onClick={handleCreateRoom}
              className="group h-12 px-6 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] flex items-center gap-3 hover:bg-primary transition-all shadow-xl shadow-slate-200 active:scale-95"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" /> 
              {t('pages.rooms.create')}
            </button>
          )}
        </div>
      </div>

      {/* Master Search Hub */}
      <div className="relative z-10">
         <div className="card-premium p-6 lg:p-8 bg-white border border-slate-100 shadow-2xl shadow-slate-200/40 rounded-[44px]">
            <div className="flex flex-col lg:flex-row lg:items-end gap-6">
               {/* Search Input */}
               <div className="flex-1 min-w-0 space-y-2.5 group">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1 flex items-center gap-2 group-focus-within:text-primary transition-colors">
                     <Search size={14} /> {t('common.search') || 'Tìm kiếm phòng'}
                  </label>
                  <div className="relative">
                     <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
                     <input
                       type="text"
                       placeholder={t('pages.rooms.searchPlaceholder')}
                       className="w-full h-16 pl-16 pr-6 bg-slate-50/50 border border-slate-100 rounded-[28px] text-[15px] font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all placeholder:text-slate-300 shadow-inner-sm"
                       value={search}
                       onChange={(e) => setSearch(e.target.value)}
                     />
                  </div>
               </div>

               {/* Building Select */}
               <div className="w-full lg:w-72 space-y-2.5">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1 flex items-center gap-2">
                     <Building2 size={14} /> {t('pages.rooms.building') || 'Toà nhà'}
                  </label>
                  <SelectAsync 
                    placeholder={t('pages.rooms.allBuildings')}
                    value={activeBuildingId?.toString()}
                    onChange={(val) => {
                      if (!val) setBuilding(null);
                      else {
                        const num = Number(val);
                        setBuilding(Number.isFinite(num) ? num : val);
                      }
                    }}
                    onClear={() => setBuilding(null)}
                    loadOptions={async (search) => {
                      const b = await buildingService.getBuildings({ search });
                      return b.map(item => ({ label: item.buildingName, value: item.id.toString() }));
                    }}
                    className="!space-y-0"
                  />
               </div>

               {/* Sort & Filter Toggle */}
               <div className="flex w-full lg:w-auto flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap items-stretch sm:items-end gap-3">
                  <div className="space-y-2.5 min-w-0 sm:flex-1 lg:flex-none">
                     <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1 flex items-center gap-2">
                        <ArrowUpAz size={14} /> Sắp xếp
                     </label>
                     <div className="h-16 flex items-center bg-slate-50/50 border border-slate-100 rounded-[28px] px-4 hover:border-slate-200 transition-all min-w-0">
                        <select
                          className="min-w-0 flex-1 bg-transparent border-none font-black text-[11px] uppercase tracking-widest text-slate-600 focus:ring-0 cursor-pointer pr-6"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as 'price' | 'area' | 'floor' | 'code')}
                        >
                           <option value="code">Mã phòng</option>
                           <option value="price">Giá thuê</option>
                           <option value="area">Diện tích</option>
                           <option value="floor">Số tầng</option>
                        </select>
                        <button
                          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                          className="w-12 h-12 flex items-center justify-center text-primary hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-slate-100"
                          title="Đảo chiều sắp xếp"
                        >
                           {sortOrder === 'asc' ? <ArrowUpAz size={20} /> : <ArrowDownAz size={20} />}
                        </button>
                     </div>
                  </div>

                  <div className="space-y-2.5 sm:flex-1 lg:flex-none">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1 opacity-0">Lọc</label>
                    <button
                      onClick={() => setIsFilterPanelOpen(true)}
                      className={cn(
                        "h-16 w-full px-6 rounded-[28px] flex items-center justify-center text-center gap-3 font-black text-[11px] uppercase tracking-widest transition-all relative border-2 shadow-lg",
                        activeFilterCount > 0 
                          ? "bg-primary/5 border-primary/20 text-primary shadow-primary/10" 
                          : "bg-slate-900 border-slate-900 text-white hover:bg-primary shadow-slate-200 hover:-translate-y-1"
                      )}
                    >
                      <SlidersHorizontal size={18} />
                      {t('pages.rooms.advancedFilters')}
                      {activeFilterCount > 0 && (
                        <span className="absolute -top-2 -right-2 w-7 h-7 bg-danger text-white rounded-full flex items-center justify-center text-[11px] font-black shadow-lg border-4 border-white animate-bounce-subtle">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                  </div>
               </div>
            </div>

            {/* Quick Status Pill Bar */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2 flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-400" /> Phân loại nhanh:
               </span>
               <div className="flex flex-wrap items-center gap-2">
                  {['Vacant', 'Occupied', 'Maintenance', 'Reserved'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(prev =>
                          prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
                        );
                      }}
                      className={cn(
                        "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                        statusFilter.includes(status)
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/30 -translate-y-0.5"
                          : "bg-white border-slate-100 text-slate-500 hover:border-primary/30 hover:text-primary"
                      )}
                    >
                      {t(`status.${status}`)}
                    </button>
                  ))}
               </div>
               
               {activeFilterCount > 0 && (
                 <>
                   <div className="h-4 w-px bg-slate-200 mx-2"></div>
                   <button
                     onClick={clearFilters}
                     className="text-[10px] font-black uppercase tracking-widest text-danger hover:underline flex items-center gap-1.5"
                   >
                     <X size={14} /> Xoá tất cả lọc
                   </button>
                 </>
               )}

               <div className="w-full sm:w-auto sm:ml-auto text-[11px] font-bold text-slate-400 text-left sm:text-right">
                  Hiển thị <span className="text-slate-900">{rooms?.length || 0}</span> phòng
               </div>
            </div>
         </div>
      </div>

      {isError && <ErrorBanner message={t('toasts.error.generic')} onRetry={() => refetch()} />}

      {isLoading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-8">
           <div className="relative">
              <div className="w-20 h-20 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
              <Home size={24} className="absolute inset-0 m-auto text-primary animate-pulse" />
           </div>
           <div className="space-y-2 text-center">
             <p className="text-[11px] text-muted font-black uppercase tracking-[5px] animate-pulse">Đang truy xuất dữ liệu</p>
             <p className="text-[13px] text-slate-400 font-medium">Vui lòng chờ trong giây lát...</p>
           </div>
        </div>
      ) : rooms && rooms.length === 0 ? (
         <div className="py-40 flex flex-col items-center justify-center gap-6 animate-in zoom-in duration-700">
            <div className="w-32 h-32 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-200 border-2 border-dashed border-slate-100">
               <Search size={48} />
            </div>
            <div className="text-center space-y-2">
               <h3 className="text-h3 font-black text-slate-900">Không tìm thấy phòng nào</h3>
               <p className="text-body text-slate-500">Hãy thử thay đổi tiêu chí lọc hoặc từ khoá tìm kiếm của bạn.</p>
               <button onClick={clearFilters} className="btn-primary mt-4 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px]">Bắt đầu lại</button>
            </div>
         </div>
      ) : viewMode === 'Grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 items-stretch">
          {rooms?.map((room) => (
            <Link 
              key={room.id}
              to={`/owner/rooms/${room.id}`}
              aria-label={`Xem chi tiết phòng ${room.roomCode}`}
              className="group card-premium p-0 overflow-hidden hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-3 transition-all duration-700 cursor-pointer border-none shadow-xl shadow-slate-200/50 bg-white flex flex-col w-full max-w-full"
            >
              <div className="relative h-64 overflow-hidden bg-slate-100">
                <img 
                  src={room.thumbnailUrl || 'https://images.unsplash.com/photo-1513584684374-8bdb7489fe92?w=500'} 
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                />
                
                {/* Visual Overlays */}
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute top-5 left-5 right-5 flex justify-between items-start">
                   <div className="flex flex-col gap-2">
                      <StatusBadge status={room.status} size="sm" className="shadow-2xl backdrop-blur-xl border-white/20" />
                      <div className="w-fit px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white text-[9px] font-black uppercase tracking-widest">
                         {room.roomType}
                      </div>
                      {room.isListed && (
                        <div className="w-fit px-3 py-1 bg-secondary/80 backdrop-blur-md rounded-lg border border-white/20 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                          <Share2 size={10} /> Public
                        </div>
                      )}
                   </div>
                </div>

                <div className="absolute bottom-6 left-6 right-20 flex flex-col min-w-0">
                   <p className="text-white text-[10px] font-bold uppercase tracking-[3px] opacity-70 mb-1 truncate">{room.buildingName}</p>
                   <p className="text-white font-black text-[28px] tracking-tighter leading-none font-mono uppercase truncate">{room.roomCode}</p>
                </div>
                
                <div className="absolute bottom-6 right-6 shrink-0">
                   <div className="w-12 h-12 rounded-2xl bg-white/95 backdrop-blur shadow-lg flex items-center justify-center text-slate-800 transition-all hover:scale-110 active:scale-95 group/btn">
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                   </div>
                </div>
              </div>

              <div className="p-8 space-y-6 flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 pb-6 border-b border-dashed border-slate-100 items-start">
                    <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5 whitespace-nowrap"><MapPin size={10} className="shrink-0" /> Tầng</span>
                        <span className="text-[26px] leading-none font-black text-slate-900">{room.floorNumber}</span>
                    </div>
                    
                    <div className="flex flex-col border-l border-slate-100 pl-4 min-w-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5 whitespace-nowrap"><Maximize size={10} className="shrink-0" /> Diện tích</span>
                        <span className="text-[26px] leading-none font-black text-slate-900 whitespace-nowrap">{room.areaSqm} <span className="text-[12px] text-slate-400">m²</span></span>
                    </div>

                    <div className="col-span-2 flex flex-col border-t border-slate-100 pt-4 min-w-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Giá thuê từ</span>
                        <span className="text-[22px] leading-tight font-black text-primary tracking-tight break-words">{formatVND(room.baseRentPrice)}</span>
                    </div>
                </div>
                
                <div className="flex items-center justify-between mt-auto pt-6">
                   <div className="flex -space-x-3 shrink-0">
                      {room.tenantNames?.slice(0, 3).map((name, i) => (
                        <div 
                          key={i} 
                          className="w-10 h-10 rounded-2xl border-4 border-white bg-slate-900 flex items-center justify-center text-[12px] font-black text-white shadow-xl group/avatar transition-all hover:-translate-y-1"
                          title={name}
                        >
                           {name.charAt(0)}
                        </div>
                      ))}
                      {room.tenantNames && room.tenantNames.length > 3 && (
                        <div className="w-10 h-10 rounded-2xl border-4 border-white bg-slate-200 flex items-center justify-center text-[12px] font-black text-slate-600 shadow-xl">
                          +{room.tenantNames.length - 3}
                        </div>
                      )}
                      {!room.tenantNames && (
                         <div className="w-10 h-10 rounded-2xl border-4 border-white bg-slate-50 flex items-center justify-center text-slate-300 border-dashed">
                           <Home size={16} />
                         </div>
                      )}
                   </div>
                   
                   <div className="flex items-center gap-2 shrink-0">
                       {canManage && (
                        <button 
                          onClick={(e) => handleEditRoom(room, e)}
                          className="w-12 h-12 bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 hover:border-primary/20 border border-transparent rounded-2xl flex items-center justify-center transition-all active:scale-95"
                        >
                           <Edit size={18} />
                        </button>
                      )}
                      <div className="w-12 h-12 bg-slate-50 text-slate-400 flex items-center justify-center rounded-2xl border border-transparent group-hover:border-slate-100 transition-all">
                         <Search size={18} />
                      </div>
                   </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card-premium overflow-hidden p-0 border-none shadow-2xl shadow-slate-200/50 bg-white/90">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-black uppercase tracking-[3px] text-[10px]">
                  <th className="px-10 py-7 w-[200px]">Phòng</th>
                  <th className="px-6 py-7 border-l border-white/5 min-w-[150px]">Toà nhà</th>
                  <th className="px-6 py-7 border-l border-white/5">Vị trí</th>
                  <th className="px-6 py-7 border-l border-white/5">Thông tin</th>
                  <th className="px-6 py-7 border-l border-white/5 text-center">Trạng thái</th>
                  <th className="px-6 py-7 border-l border-white/5 text-right">Giá thuê</th>
                  <th className="px-10 py-7 border-l border-white/5 text-right w-[150px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms?.map((room) => (
                  <tr 
                    key={room.id} 
                    className="group hover:bg-primary/5 cursor-pointer transition-all h-24"
                    onClick={() => navigate(`/owner/rooms/${room.id}`)}
                  >
                    <td className="px-10 py-4">
                      <div className="flex items-center gap-4">
                         <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shadow-inner group-hover:scale-105 transition-transform duration-500 border border-slate-100">
                            <img src={room.thumbnailUrl || 'https://via.placeholder.com/64'} className="w-full h-full object-cover" alt="" />
                         </div>
                         <span className="text-[16px] font-black text-slate-900 font-mono tracking-tighter uppercase">{room.roomCode}</span>
                         {room.isListed && (
                           <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-primary" title="Đang niêm yết công khai">
                             <Share2 size={10} />
                           </div>
                         )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-[12px] font-black text-slate-900 uppercase tracking-tighter">{room.buildingName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{room.roomType}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="px-3 py-1.5 bg-slate-100 rounded-xl text-[11px] font-black text-slate-600 uppercase tracking-widest">Tầng {room.floorNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3 text-slate-500 italic">
                          <span className="flex items-center gap-1.5 font-bold"><Maximize size={14} /> {room.areaSqm}m²</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={room.status} size="sm" className="mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="text-[16px] font-black text-primary tracking-tight">{formatVND(room.baseRentPrice)}</span>
                    </td>
                    <td className="px-10 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                        {canManage && (
                          <button 
                            onClick={(e) => handleEditRoom(room, e)}
                            className="w-12 h-12 bg-white text-slate-400 hover:text-primary hover:shadow-xl rounded-2xl flex items-center justify-center transition-all border border-slate-100"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                        <button className="w-12 h-12 bg-white text-slate-400 hover:text-slate-900 hover:shadow-xl rounded-2xl flex items-center justify-center transition-all border border-slate-100">
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Advanced Filter SidePanel */}
      <SidePanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        title="Bộ lọc nâng cao"
        icon={<SlidersHorizontal size={24} />}
        footer={
           <div className="flex items-center gap-4 w-full">
              <button onClick={clearFilters} className="btn-ghost flex-1 h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest">Thiết lập lại</button>
              <button 
                onClick={() => setIsFilterPanelOpen(false)} 
                className="btn-primary flex-[2] h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-primary/20"
              >
                Áp dụng bộ lọc
              </button>
           </div>
        }
      >
        <div className="space-y-10 p-2">
           {/* Price Range */}
           <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-2">
                 <Zap size={14} className="text-amber-500" /> Ngân sách thuê (Tháng)
              </label>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 ml-1 font-bold">Tối thiểu</span>
                    <input
                      type="number" placeholder="0" className="input-base w-full h-14 bg-slate-50 border-none rounded-2xl font-bold px-5 text-slate-900 focus:ring-4 focus:ring-primary/10 transition-all shadow-none"
                      value={minPrice || ''}
                      onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                    />
                 </div>
                 <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 ml-1 font-bold">Tối đa</span>
                    <input
                      type="number" placeholder="50.000.000" className="input-base w-full h-14 bg-slate-50 border-none rounded-2xl font-bold px-5 text-slate-900 focus:ring-4 focus:ring-primary/10 transition-all shadow-none"
                      value={maxPrice || ''}
                      onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                    />
                 </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                  {[2000000, 5000000, 10000000].map(p => (
                    <button 
                      key={p} 
                      onClick={() => setMaxPrice(p)}
                      className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                       Dưới {formatVND(p)}
                    </button>
                  ))}
              </div>
           </div>

           {/* Room Characteristics */}
           <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-2">
                 <Home size={14} className="text-primary" /> Đặc điểm căn hộ
              </label>
              <div className="space-y-2">
                 <span className="text-[10px] text-slate-400 ml-1 font-bold">Loại căn hộ</span>
                 <select
                   className="input-base h-14 w-full bg-slate-50 border-none rounded-2xl shadow-none font-bold px-5 focus:ring-0"
                   value={typeFilter}
                   onChange={(e) => setTypeFilter(e.target.value as RoomType)}
                 >
                   <option value="">Tất cả các loại</option>
                   <option value="Studio">Phòng Studio</option>
                   <option value="1BR">1 Phòng ngủ (1BR)</option>
                   <option value="2BR">2 Phòng ngủ (2BR)</option>
                   <option value="3BR">3 Phòng ngủ (3BR)</option>
                   <option value="Penthouse">Penthouse sang trọng</option>
                   <option value="Commercial">Mặt bằng kinh doanh</option>
                 </select>
              </div>

              <div className="space-y-2">
                 <span className="text-[10px] text-slate-400 ml-1 font-bold">Hướng phòng</span>
                 <div className="grid grid-cols-4 gap-2">
                    {['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW'].map(d => (
                       <button
                         key={d}
                         onClick={() => setFacing(facing === d ? '' : d as DirectionFacing)}
                         className={cn(
                            "h-12 rounded-xl text-[11px] font-bold transition-all border",
                            facing === d ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-slate-50 border-transparent text-slate-500 hover:border-slate-200"
                         )}
                       >
                          {d}
                       </button>
                    ))}
                 </div>
              </div>
           </div>

           {/* Floor & Area */}
           <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-2">
                    <MapPin size={14} className="text-secondary" /> Tầng
                 </label>
                 <div className="flex items-center gap-2">
                    <input
                      type="number" placeholder="Min" className="input-base w-full h-12 bg-slate-50 border-none rounded-xl font-bold px-4 text-center focus:ring-0"
                      value={minFloor || ''}
                      onChange={(e) => setMinFloor(e.target.value ? Number(e.target.value) : undefined)}
                    />
                    <span className="text-slate-300">-</span>
                    <input
                      type="number" placeholder="Max" className="input-base w-full h-12 bg-slate-50 border-none rounded-xl font-bold px-4 text-center focus:ring-0"
                      value={maxFloor || ''}
                      onChange={(e) => setMaxFloor(e.target.value ? Number(e.target.value) : undefined)}
                    />
                 </div>
              </div>
              <div className="space-y-4">
                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-2">
                    <Maximize size={14} className="text-accent" /> Diện tích
                 </label>
                 <div className="flex items-center gap-2">
                    <input
                      type="number" placeholder="m²" className="input-base w-full h-12 bg-slate-50 border-none rounded-xl font-bold px-4 text-center focus:ring-0"
                      value={minArea || ''}
                      onChange={(e) => setMinArea(e.target.value ? Number(e.target.value) : undefined)}
                    />
                    <span className="text-slate-300">-</span>
                    <input
                      type="number" placeholder="m²" className="input-base w-full h-12 bg-slate-50 border-none rounded-xl font-bold px-4 text-center focus:ring-0"
                      value={maxArea || ''}
                      onChange={(e) => setMaxArea(e.target.value ? Number(e.target.value) : undefined)}
                    />
                 </div>
              </div>
            </div>

            {/* Listing Status */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
               <label className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-2">
                  <Share2 size={14} className="text-primary" /> Niêm yết công khai
               </label>
               <div className="flex gap-2">
                  {[
                    { label: 'Tất cả', value: undefined },
                    { label: 'Đang niêm yết', value: true },
                    { label: 'Chưa niêm yết', value: false }
                  ].map((opt) => (
                    <button
                      key={String(opt.value)}
                      onClick={() => setIsListedFilter(opt.value)}
                      className={cn(
                        "flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                        isListedFilter === opt.value 
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                          : "bg-slate-50 border-transparent text-slate-500 hover:border-slate-200"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
               </div>
            </div>

           {/* Amenities & Utilities */}
           <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-2">
                 <Navigation size={14} className="text-violet-500" /> Tiện ích & Trang bị
              </label>
              <div className="space-y-3">
                 <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100/50 flex gap-4">
                    <AlertCircle className="text-amber-500 shrink-0" size={20} />
                    <p className="text-[11px] text-amber-700 font-medium leading-relaxed italic">
                       Các đặc điểm mở rộng (Ban công, Nhà vệ sinh riêng) đang được cập nhật dữ liệu. Bạn vẫn có thể lọc theo hướng phòng và diện tích để có kết quả chính xác nhất.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </SidePanel>

      <RoomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        room={selectedRoom}
      />
    </div>
  );
};

export default RoomList;
