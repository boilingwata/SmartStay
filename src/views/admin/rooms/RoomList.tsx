import React, { useState } from 'react';
import { 
  Building2, Home, Search, Filter, 
  LayoutGrid, List, Plus, MoreVertical,
  Edit, Key, ClipboardList, Trash2,
  ChevronRight, ArrowUpDown, Smartphone,
  Zap, Droplets, MapPin, Maximize
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { roomService } from '@/services/roomService';
import { Room, RoomStatus } from '@/models/Room';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn, formatVND } from '@/utils';
import useUIStore from '@/stores/uiStore';
import { usePermission } from '@/hooks/usePermission';
import { RoomModal } from '@/components/rooms/RoomModal';
import { SelectAsync } from '@/components/ui/SelectAsync';
import { buildingService } from '@/services/buildingService';
import { ErrorBanner } from '@/components/ui/StatusStates';
import { useTranslation } from 'react-i18next';

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
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [minFloor, setMinFloor] = useState<number | undefined>();
  const [maxFloor, setMaxFloor] = useState<number | undefined>();
  const [minArea, setMinArea] = useState<number | undefined>();
  const [maxArea, setMaxArea] = useState<number | undefined>();
  const [hasMeter, setHasMeter] = useState<boolean | undefined>();

  const toggleView = (mode: 'List' | 'Grid') => {
    setViewMode(mode);
    localStorage.setItem('roomViewMode', mode);
  };

  const { data: rooms, isLoading, isError, refetch } = useQuery<Room[]>({
    queryKey: ['rooms', activeBuildingId, search, statusFilter, typeFilter, minPrice, maxPrice, minFloor, maxFloor, minArea, maxArea, hasMeter],
    queryFn: () => roomService.getRooms({
      buildingId: activeBuildingId,
      search,
      status: statusFilter.length > 0 ? statusFilter as RoomStatus[] : undefined,
      roomType: typeFilter || undefined,
      minPrice,
      maxPrice,
      minFloor,
      maxFloor,
      minArea,
      maxArea,
      hasMeter
    })
  });

  const handleCreateRoom = () => {
    setSelectedRoom(null);
    setIsModalOpen(true);
  };

  const handleEditRoom = (room: Room, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-display text-primary leading-tight">{t('pages.rooms.title')}</h1>
          <p className="text-body text-muted font-medium italic">{t('pages.rooms.description')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-bg/50 p-1 rounded-xl border border-border/10">
            <button
              onClick={() => toggleView('Grid')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'Grid' ? "bg-white text-primary shadow-sm" : "text-muted hover:text-text"
              )}
              title={t('pages.rooms.gridView')}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => toggleView('List')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'List' ? "bg-white text-primary shadow-sm" : "text-muted hover:text-text"
              )}
              title={t('pages.rooms.listView')}
            >
              <List size={18} />
            </button>
          </div>
          {canManage && (
            <button
              onClick={handleCreateRoom}
              className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20 h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[11px]"
            >
              <Plus size={18} /> {t('pages.rooms.create')}
            </button>
          )}
        </div>
      </div>

      <div className="card-container p-8 bg-white/60 backdrop-blur-md space-y-8 shadow-2xl shadow-primary/5 border-none">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-6">
           <SelectAsync 
             label={t('sidebar.buildings')}
             placeholder={t('pages.rooms.allBuildings')}
             value={activeBuildingId?.toString()}
             onChange={(val) => setBuilding(val ? (isNaN(Number(val)) ? val : Number(val)) : null)}
             loadOptions={async () => {
               const b = await buildingService.getBuildings();
               return b.map(item => ({ label: item.buildingName, value: item.id.toString() }));
             }}
             icon={Building2}
           />

           <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-[2px] ml-1 flex items-center gap-2"><Home size={12} /> {t('pages.rooms.roomType')}</label>
              <select
                className="input-base h-12 w-full font-bold"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">{t('pages.rooms.allTypes')}</option>
                <option value="Studio">Studio</option>
                <option value="1BR">1 Phòng ngủ</option>
                <option value="2BR">2 Phòng ngủ</option>
                <option value="3BR">3 Phòng ngủ</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Commercial">Kinh doanh</option>
              </select>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-[2px] ml-1">{t('pages.rooms.priceRange')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" placeholder="Min" className="input-base w-full h-12 font-mono"
                  value={minPrice || ''}
                  onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                />
                <span className="text-muted">-</span>
                <input
                  type="number" placeholder="Max" className="input-base w-full h-12 font-mono"
                  value={maxPrice || ''}
                  onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-[2px] ml-1">{t('pages.rooms.areaRange')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" placeholder="Min" className="input-base w-full h-12 font-mono"
                  value={minArea || ''}
                  onChange={(e) => setMinArea(e.target.value ? Number(e.target.value) : undefined)}
                />
                <span className="text-muted">-</span>
                <input
                  type="number" placeholder="Max" className="input-base w-full h-12 font-mono"
                  value={maxArea || ''}
                  onChange={(e) => setMaxArea(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-[2px] ml-1">{t('pages.rooms.floorRange')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" placeholder="Min" className="input-base w-full h-12 font-mono"
                  value={minFloor || ''}
                  onChange={(e) => setMinFloor(e.target.value ? Number(e.target.value) : undefined)}
                />
                <span className="text-muted">-</span>
                <input
                  type="number" placeholder="Max" className="input-base w-full h-12 font-mono"
                  value={maxFloor || ''}
                  onChange={(e) => setMaxFloor(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
           </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-6 border-t border-dashed border-border/20">
           <div className="flex flex-wrap items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="text"
                  placeholder={t('pages.rooms.searchPlaceholder')}
                  className="input-base w-64 pl-12 h-12 bg-white/50 focus:bg-white font-bold"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 bg-bg/30 p-1.5 rounded-2xl border border-border/10">
                {['Vacant', 'Occupied', 'Maintenance', 'Reserved'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(prev =>
                        prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
                      );
                    }}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      statusFilter.includes(status)
                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                        : "text-muted hover:text-primary hover:bg-white/50"
                    )}
                  >
                    {t(`status.${status}`)}
                  </button>
                ))}
              </div>
           </div>

           <div className="flex items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                 <div className={cn(
                   "w-12 h-6 rounded-full transition-all relative p-1",
                   hasMeter ? "bg-primary" : "bg-slate-300"
                 )}>
                    <div className={cn(
                      "w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                      hasMeter ? "ml-6" : "ml-0"
                    )}></div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={hasMeter === true}
                      onChange={(e) => setHasMeter(e.target.checked ? true : undefined)}
                    />
                 </div>
                 <span className="text-[10px] font-black uppercase text-muted group-hover:text-primary transition-colors tracking-widest">{t('pages.rooms.hasMeters')}</span>
              </label>

              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter([]);
                  setTypeFilter('');
                  setMinPrice(undefined);
                  setMaxPrice(undefined);
                  setMinFloor(undefined);
                  setMaxFloor(undefined);
                  setMinArea(undefined);
                  setMaxArea(undefined);
                  setHasMeter(undefined);
                }}
                className="text-[10px] font-black text-danger uppercase tracking-widest hover:underline flex items-center gap-2"
              >
                <Trash2 size={14} /> {t('pages.rooms.clearFilters')}
              </button>
           </div>
        </div>
      </div>

      {isError && <ErrorBanner message={t('toasts.error.generic')} onRetry={() => refetch()} />}

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
          <p className="text-small text-muted font-black uppercase tracking-[4px] animate-pulse">{t('pages.rooms.loading')}</p>
        </div>
      ) : viewMode === 'Grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {rooms?.map((room) => (
            <div 
              key={room.id}
              onClick={() => navigate(`/rooms/${room.id}`)}
              className="group card-container p-0 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer border-none shadow-xl shadow-primary/5 bg-white/40 backdrop-blur-md"
            >
              <div className="relative h-56 overflow-hidden bg-slate-100">
                <img 
                  src={room.thumbnailUrl || 'https://images.unsplash.com/photo-1513584684374-8bdb7489fe92?w=500'} 
                  alt={room.roomCode}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                />
                <div className="absolute top-4 right-4">
                  <StatusBadge status={room.status} size="sm" className="shadow-2xl backdrop-blur-md" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                  <p className="text-white font-black text-[24px] tracking-tighter leading-none mb-1 font-mono uppercase">{room.roomCode}</p>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-[2px]">{room.buildingName}</p>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4 text-[11px] font-black text-muted uppercase tracking-widest">
                      <span className="flex items-center gap-1.5 bg-bg/50 px-3 py-1.5 rounded-lg border border-border/5 text-primary font-bold"><MapPin size={12} /> Tầng {room.floorNumber}</span>
                      <span className="flex items-center gap-1.5 bg-bg/50 px-3 py-1.5 rounded-lg border border-border/5 text-primary font-bold"><Maximize size={12} /> {room.areaSqm} m2</span>
                   </div>
                   <span className="px-2.5 py-1 bg-primary/5 text-primary text-[9px] font-black rounded-lg uppercase tracking-widest border border-primary/10">{room.roomType}</span>
                </div>
                
                <div className="flex items-center justify-between border-t border-dashed border-border/20 pt-5">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted font-black uppercase tracking-widest">{t('pages.rooms.baseRent')}</p>
                    <p className="text-h3 font-black text-primary tracking-tight">{formatVND(room.baseRentPrice)}</p>
                  </div>
                  <div className="flex -space-x-2.5">
                    {room.tenantNames?.map((name, i) => (
                      <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-slate-900 flex items-center justify-center text-[11px] font-black text-white shadow-xl">
                        {name.charAt(0)}
                      </div>
                    ))}
                    {!room.tenantNames && (
                       <div className="w-9 h-9 rounded-full border-2 border-white bg-bg flex items-center justify-center text-muted border-dashed">
                         <Home size={14} />
                       </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate(`/rooms/${room.id}`); }}
                      className="flex-1 h-12 bg-bg text-muted group-hover:bg-primary group-hover:text-white transition-all rounded-xl text-[10px] font-black uppercase tracking-[3px] shadow-sm active:scale-95"
                    >
                       {t('pages.rooms.roomDetail')}
                    </button>
                    {canManage && (
                      <button 
                        onClick={(e) => handleEditRoom(room, e)}
                        className="w-12 h-12 bg-white border border-border/10 flex items-center justify-center rounded-xl text-muted hover:text-primary hover:shadow-xl hover:border-primary/20 transition-all active:scale-90"
                      >
                         <Edit size={18} />
                      </button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-container overflow-hidden p-0 border-none shadow-2xl shadow-primary/5 bg-white/40 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-black uppercase tracking-[3px] text-[10px]">
                  <th className="px-8 py-6 w-[80px]">{t('pages.rooms.table.thumb')}</th>
                  <th className="px-6 py-6 border-l border-white/5 min-w-[120px]">{t('pages.rooms.table.roomCode')}</th>
                  <th className="px-6 py-6 border-l border-white/5">{t('pages.rooms.table.building')}</th>
                  <th className="px-6 py-6 border-l border-white/5">{t('pages.rooms.table.area')}</th>
                  <th className="px-6 py-6 border-l border-white/5">{t('pages.rooms.table.type')}</th>
                  <th className="px-6 py-6 border-l border-white/5 text-center">{t('pages.rooms.table.status')}</th>
                  <th className="px-6 py-6 border-l border-white/5 text-right">{t('pages.rooms.table.baseRentPrice')}</th>
                  <th className="px-6 py-6 border-l border-white/5 text-center">{t('pages.rooms.table.tenants')}</th>
                  <th className="px-8 py-6 border-l border-white/5 text-right">{t('pages.rooms.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {rooms?.map((room) => (
                  <tr 
                    key={room.id} 
                    className="group hover:bg-white/80 cursor-pointer transition-all"
                    onClick={() => navigate(`/rooms/${room.id}`)}
                  >
                    <td className="px-8 py-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md border-2 border-white group-hover:scale-110 transition-transform bg-slate-100">
                        <img 
                          src={room.thumbnailUrl || 'https://via.placeholder.com/48'} 
                          className="w-full h-full object-cover" 
                          alt=""
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[15px] font-black text-primary font-mono tracking-tighter uppercase">{room.roomCode}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] font-black text-slate-800 uppercase tracking-tighter truncate max-w-[120px]">{room.buildingName}</p>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-bold text-muted">Tầng {room.floorNumber}</td>
                    <td className="px-6 py-4 text-[13px] font-black text-slate-700">{room.areaSqm} m2</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1.5 bg-primary/5 text-primary text-[9px] font-black rounded-lg uppercase tracking-widest border border-primary/5">{room.roomType}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={room.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="text-[14px] font-black text-secondary tracking-tight">{formatVND(room.baseRentPrice)}</span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex -space-x-2 justify-center">
                          {room.tenantNames?.map((name, i) => (
                             <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-900 flex items-center justify-center text-[10px] font-black text-white shadow-md" title={name}>
                                {name.charAt(0)}
                             </div>
                          ))}
                       </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canManage && (
                          <button 
                            onClick={(e) => handleEditRoom(room, e)}
                            className="w-10 h-10 bg-bg text-muted hover:bg-white hover:text-primary hover:shadow-lg rounded-xl flex items-center justify-center transition-all"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        <button className="w-10 h-10 bg-bg text-muted hover:bg-white hover:shadow-lg rounded-xl flex items-center justify-center transition-all" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical size={16} />
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

      <RoomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        room={selectedRoom}
      />
    </div>
  );
};

export default RoomList;
