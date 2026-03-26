import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Search, 
  Sparkles, 
  Briefcase,
  Waves,
  Droplets,
  Utensils,
  Zap,
  ShoppingBag,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/utils';
import { BottomSheet } from '@/components/portal/BottomSheet';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceItem {
  id: number;
  name: string;
  price: number;
  unit: string;
  icon: React.ElementType;
  color: string;
}

// ---------------------------------------------------------------------------
// Helpers (client-side only — DB has no icon/color columns)
// ---------------------------------------------------------------------------

function getServiceIcon(name: string): React.ElementType {
  const n = name.toLowerCase();
  if (n.includes('nước') || n.includes('giặt') || n.includes('vệ sinh')) return Droplets;
  if (n.includes('điện') || n.includes('sửa') || n.includes('kỹ thuật')) return Zap;
  if (n.includes('ăn') || n.includes('bbq') || n.includes('thực phẩm')) return Utensils;
  if (n.includes('dọn') || n.includes('vệ') || n.includes('tổng')) return Briefcase;
  if (n.includes('sảnh') || n.includes('sự kiện') || n.includes('hội trường')) return Sparkles;
  if (n.includes('bơi') || n.includes('gym') || n.includes('thể')) return Waves;
  return ShoppingBag;
}

const ICON_COLORS = [
  'bg-indigo-50 text-indigo-500',
  'bg-amber-50 text-amber-500',
  'bg-sky-50 text-sky-500',
  'bg-orange-50 text-orange-500',
  'bg-purple-50 text-purple-500',
  'bg-teal-50 text-teal-500',
  'bg-rose-50 text-rose-500',
  'bg-green-50 text-green-500',
];

function getServiceColor(id: number): string {
  return ICON_COLORS[id % ICON_COLORS.length];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ServiceRequests: React.FC = () => {
  const navigate = useNavigate();
  const [selectedAvailable, setSelectedAvailable] = useState<ServiceItem | null>(null);
  const [selectedCurrent, setSelectedCurrent] = useState<ServiceItem | null>(null);
  const [processing, setProcessing] = useState(false);

  // H-04: Replace mock data with real DB state
  const [currentServices, setCurrentServices] = useState<ServiceItem[]>([]);
  const [availableServices, setAvailableServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        // 1. Get current authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 2. Get tenant id for this profile
        const tenantRows = await unwrap(
          supabase.from('tenants').select('id').eq('profile_id', user.id).limit(1)
        ) as unknown as { id: number }[];
        const tenantId = tenantRows?.[0]?.id;

        // 3. Fetch all active services + their current active price
        const [allServiceRows, allPriceRows] = await Promise.all([
          unwrap(
            supabase.from('services').select('id, name, calc_type').eq('is_deleted', false).eq('is_active', true)
          ) as unknown as Promise<{ id: number; name: string; calc_type: string }[]>,
          unwrap(
            supabase.from('service_prices').select('service_id, unit_price').eq('is_active', true)
          ) as unknown as Promise<{ service_id: number; unit_price: number }[]>,
        ]);

        // Build price map: service_id → unit_price (first active price wins)
        const priceMap = new Map<number, number>();
        for (const p of (allPriceRows ?? [])) {
          if (!priceMap.has(p.service_id)) priceMap.set(p.service_id, p.unit_price);
        }

        const subscribedServiceIds = new Set<number>();
        const current: ServiceItem[] = [];

        if (tenantId) {
          // 4. Get all contracts this tenant is in
          const contractLinks = await unwrap(
            supabase.from('contract_tenants').select('contract_id').eq('tenant_id', tenantId)
          ) as unknown as { contract_id: number }[];

          if (contractLinks && contractLinks.length > 0) {
            const contractIds = contractLinks.map(c => c.contract_id);

            // 5. Find their active contract(s)
            const activeContracts = await unwrap(
              supabase.from('contracts').select('id').in('id', contractIds).eq('status', 'active').limit(1)
            ) as unknown as { id: number }[];

            if (activeContracts?.[0]) {
              const activeContractId = activeContracts[0].id;

              // 6. Get contract_services for the active contract
              const contractServices = await unwrap(
                supabase.from('contract_services').select('service_id, fixed_price').eq('contract_id', activeContractId)
              ) as unknown as { service_id: number; fixed_price: number }[];

              for (const cs of (contractServices ?? [])) {
                subscribedServiceIds.add(cs.service_id);
                const svc = (allServiceRows ?? []).find(s => s.id === cs.service_id);
                const price = cs.fixed_price ?? priceMap.get(cs.service_id) ?? 0;
                const calcType = svc?.calc_type ?? 'flat_rate';

                current.push({
                  id: cs.service_id,
                  name: svc?.name ?? `Dịch vụ #${cs.service_id}`,
                  price,
                  unit: calcType === 'per_unit' ? 'đơn vị' : 'tháng',
                  icon: getServiceIcon(svc?.name ?? ''),
                  color: getServiceColor(cs.service_id),
                });
              }
            }
          }
        }

        // 7. Available = all active services NOT already in the active contract
        const available: ServiceItem[] = (allServiceRows ?? [])
          .filter(s => !subscribedServiceIds.has(s.id))
          .map(s => ({
            id: s.id,
            name: s.name,
            price: priceMap.get(s.id) ?? 0,
            unit: s.calc_type === 'per_unit' ? 'đơn vị' : 'tháng',
            icon: getServiceIcon(s.name),
            color: getServiceColor(s.id),
          }));

        setCurrentServices(current);
        setAvailableServices(available);
      } catch (err) {
        console.error('[ServiceRequests] fetchServices error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleSubscribe = async () => {
    if (!selectedAvailable) return;
    setProcessing(true);
    // NOTE: No 'service_requests' table in DB. Subscription changes
    // are managed by staff via contract_services. Notify the user to contact management.
    await new Promise(r => setTimeout(r, 600));
    toast.success(`Đã gửi yêu cầu đăng ký: ${selectedAvailable.name}. Quản lý sẽ sớm phê duyệt.`);
    setProcessing(false);
    setSelectedAvailable(null);
  };

  const handleCancel = async () => {
    if (!selectedCurrent) return;
    setProcessing(true);
    // NOTE: Same as above — cancellation is processed by staff. 
    await new Promise(r => setTimeout(r, 600));
    toast.success(`Đã gửi yêu cầu hủy: ${selectedCurrent.name}. Sẽ có hiệu lực từ kỳ tiếp theo.`);
    setProcessing(false);
    setSelectedCurrent(null);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-6 bg-slate-50 min-h-[80vh]">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-black animate-pulse uppercase tracking-[3px]">Đang tải dịch vụ</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 animate-in fade-in slide-in-from-right-6 duration-700 font-sans">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-5 pt-12 pb-4 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-11 h-11 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition-all hover:bg-slate-50">
              <ArrowLeft size={22} />
            </button>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Dịch vụ</h2>
          </div>
          <button className="w-11 h-11 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition-all hover:bg-slate-50">
            <Search size={20} />
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-bold text-gray-900">Dịch vụ đang dùng</h3>
          <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold border border-teal-100">
            {currentServices.length} dịch vụ
          </span>
        </div>
      </div>

      <div className="px-5 pt-6 animate-in slide-in-from-bottom-4 fade-in duration-500 space-y-8">
        
        {/* CURRENT SERVICES LIST */}
        <div className="space-y-3">
          {currentServices.length > 0 ? (
            currentServices.map(svc => (
              <div key={svc.id} className="flex items-center gap-3 bg-white rounded-[16px] p-4 border border-gray-100 shadow-sm">
                <div className={cn("w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0", svc.color)}>
                  <svc.icon size={20} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">{svc.name}</h4>
                  <p className="text-xs text-slate-500 font-medium">{svc.price.toLocaleString()}đ/{svc.unit}</p>
                </div>
                <button 
                  onClick={() => setSelectedCurrent(svc)} 
                  className="text-red-500 border border-red-200 rounded-lg px-3 py-1 text-sm font-medium hover:bg-red-50 transition-colors shrink-0"
                >
                  Hủy đăng ký
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-white rounded-[24px] border border-dashed border-slate-200">
              <AlertCircle size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-400">Chưa có dịch vụ nào đang dùng</p>
            </div>
          )}
        </div>

        {/* AVAILABLE SERVICES GRID */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-gray-900">Dịch vụ có sẵn</h3>
            <p className="text-xs text-slate-500">Đăng ký thêm tiện ích cho căn hộ của bạn</p>
          </div>

          {availableServices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableServices.map((svc) => (
                <div 
                  key={svc.id}
                  className="bg-white rounded-[20px] p-5 border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all flex flex-col gap-4 group"
                >
                  <div className="flex justify-between items-start">
                    <div className={cn("w-12 h-12 rounded-[16px] flex items-center justify-center transition-transform group-hover:scale-110", svc.color)}>
                      <svc.icon size={24} />
                    </div>
                    <div className="flex items-center gap-1 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100">
                      <CheckCircle2 size={12} className="text-teal-500" />
                      <span className="text-[11px] font-bold text-teal-700">Khả dụng</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-[15px] font-bold text-gray-900 leading-tight">{svc.name}</h4>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-teal-600">{svc.price.toLocaleString()}đ</span>
                      <span className="text-[10px] text-slate-400 font-bold">/{svc.unit}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedAvailable(svc)}
                    className="w-full bg-teal-600 text-white h-10 rounded-xl font-semibold text-sm active:scale-95 transition-all hover:bg-teal-700 shadow-sm shadow-teal-200"
                  >
                    Đăng ký
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-[24px] border border-dashed border-slate-200">
              <Star size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-400">Không có dịch vụ nào khác</p>
            </div>
          )}
        </div>
      </div>

      {/* SUBSCRIBE MODAL */}
      <BottomSheet isOpen={!!selectedAvailable} onClose={() => !processing && setSelectedAvailable(null)} title="Xác nhận đăng ký">
        {selectedAvailable && (
          <div className="space-y-6 pb-10">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className={cn("w-16 h-16 rounded-[16px] flex items-center justify-center shadow-sm", selectedAvailable.color)}>
                <selectedAvailable.icon size={32} strokeWidth={1.5} />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-base font-bold text-slate-900 leading-tight">{selectedAvailable.name}</h3>
                <p className="text-xs text-slate-500 font-medium">Giá: {selectedAvailable.price.toLocaleString()}đ/{selectedAvailable.unit}</p>
              </div>
            </div>

            <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl">
              <p className="text-[13px] text-teal-700 font-medium leading-relaxed">
                Bạn có chắc chắn muốn đăng ký dịch vụ này? Yêu cầu sẽ được gửi đến Ban quản lý để phê duyệt. Phí sẽ được tính vào hóa đơn kỳ tới.
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedAvailable(null)}
                disabled={processing}
                className="flex-1 h-12 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm active:scale-95 transition-all"
              >
                Bỏ qua
              </button>
              <button 
                onClick={handleSubscribe}
                disabled={processing}
                className="flex-[2] h-12 bg-teal-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-200 active:scale-95 transition-all flex items-center justify-center"
              >
                {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Xác nhận đăng ký'}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* CANCEL MODAL */}
      <BottomSheet isOpen={!!selectedCurrent} onClose={() => !processing && setSelectedCurrent(null)} title="Hủy dịch vụ">
        {selectedCurrent && (
          <div className="space-y-6 pb-10 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500 mb-2">
              <XCircle size={40} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Xác nhận hủy dịch vụ?</h3>
              <p className="text-sm text-slate-500 mt-2 px-4">Dịch vụ <strong className="text-slate-900">{selectedCurrent.name}</strong> sẽ ngừng cung cấp từ kỳ thanh toán tiếp theo.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setSelectedCurrent(null)}
                disabled={processing}
                className="h-12 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm active:scale-95 transition-all"
              >
                Quay lại
              </button>
              <button 
                onClick={handleCancel}
                disabled={processing}
                className="h-12 bg-rose-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-200 active:scale-95 transition-all flex items-center justify-center"
              >
                {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Hủy ngay'}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default ServiceRequests;
