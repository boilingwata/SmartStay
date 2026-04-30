import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Filter, 
  RotateCcw, 
  LayoutGrid, 
  Edit3, 
  History, 
  ShieldAlert,
  ChevronDown
} from "lucide-react";

import { 
  getServices, 
  toggleServiceActive 
} from "@/services/serviceService";
import { 
  Service, 
  ServiceFilter, 
  ServiceType 
} from "@/types/service";
import { 
  SERVICE_TYPE_LABELS, 
  SERVICE_TYPE_COLORS, 
  formatVND 
} from "@/utils/serviceHelpers";
import { 
  DataTable, 
  RowAction
} from "@/components/shared";
import { useConfirm } from "@/hooks/useConfirm";
import { cn } from "@/utils";
import ServiceDetailModal from "@/components/services/ServiceDetailModal";
import UpdatePriceModal from "@/components/services/UpdatePriceModal";
import { ErrorBanner } from "@/components/ui/StatusStates";
import { QuickFilterChips } from "@/components/ui/QuickFilterChips";
import { MobileSortDropdown } from "@/components/ui/MobileSortDropdown";

const ServiceCatalog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

  // Modal states
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "view" | "edit" | null>(null);
  const [showUpdatePrice, setShowUpdatePrice] = useState(false);
  const [targetService, setTargetService] = useState<Service | null>(null);

  // Unified Filter State from URL
  const filters: ServiceFilter = useMemo(() => {
    return {
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 10,
      search: searchParams.get("search") || "",
      serviceType: (searchParams.get("serviceType") as ServiceType) || undefined,
      isActive: searchParams.get("status") === "active" ? true : 
                searchParams.get("status") === "inactive" ? false : undefined,
      sortBy: searchParams.get("sortBy") || "serviceName",
      sortDir: (searchParams.get("sortDir") as "asc" | "desc") || "asc",
    };
  }, [searchParams]);

  // Derived status for UI
  const currentStatus = searchParams.get("status") || "all";

  // Main Query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["services", filters],
    queryFn: () => getServices(filters),
  });

  // Toggle Active Mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => 
      toggleServiceActive(id, isActive),
    onSuccess: (_, variables) => {
      toast.success(`Đã ${variables.isActive ? "kích hoạt" : "vô hiệu hóa"} dịch vụ tính tiền`);
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: () => {
      toast.error("Không thể thay đổi trạng thái dịch vụ tính tiền");
    }
  });

  const handleToggleActive = async (service: Service) => {
    const newStatus = !service.isActive;
    if (!newStatus) {
      const isConfirmed = await confirm({
        title: "Vô hiệu hóa dịch vụ tính tiền?",
        description: `Dịch vụ '${service.serviceName}' (${service.serviceCode}) sẽ không thể chọn khi tạo hợp đồng mới.`,
        variant: "danger",
        confirmLabel: "Vô hiệu hóa",
      });
      if (!isConfirmed) return;
    }
    toggleMutation.mutate({ id: service.serviceId, isActive: newStatus });
  };

  // Unified Filter Change
  const updateFilters = (newValues: Record<string, string | number | boolean | null | undefined>) => {
    const params = new URLSearchParams(searchParams);
    if (!newValues.page) params.set("page", "1"); // Reset pagination on non-page changes
    
    Object.entries(newValues).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchParams({ page: "1", limit: "10", status: "all" });
  };

  const columns = [
    {
      id: "serviceName",
      header: "Dịch vụ tính tiền",
      accessorKey: "serviceName",
      cell: ({ row }: { row: { original: Service } }) => (
        <div className="flex flex-col">
            <span className="font-bold text-slate-900 group-hover:text-primary transition-colors">
            {row.original.serviceName}
            </span>
            <span className="text-[10px] text-slate-400 font-mono uppercase">
                {row.original.serviceCode}
            </span>
        </div>
      )
    },
    {
      id: "serviceType",
      header: "Loại hình",
      accessorKey: "serviceType",
      cell: ({ row }: { row: { original: Service } }) => (
        <span className={cn(
          "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
          SERVICE_TYPE_COLORS[row.original.serviceType] || "bg-slate-100 text-slate-600 shadow-sm"
        )}>
          {SERVICE_TYPE_LABELS[row.original.serviceType] || "Khác"}
        </span>
      )
    },
    {
      id: "currentPrice",
      header: "Giá hiện tại",
      accessorKey: "currentPrice",
      cell: ({ row }: { row: { original: Service } }) => (
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-sm font-black text-slate-900 tabular-nums">
            {formatVND(row.original.currentPrice)}
          </span>
          <span className="text-[10px] text-slate-400 italic">
            / {row.original.unit}
          </span>
        </div>
      )
    },
    {
      id: "isActive",
      header: "Trạng thái",
      accessorKey: "isActive",
      cell: ({ row }: { row: { original: Service } }) => (
        <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleActive(row.original);
            }}
            className={cn(
                "w-10 h-5 rounded-full relative transition-all p-0.5",
                row.original.isActive ? "bg-green-500" : "bg-slate-200"
            )}
        >
            <div className={cn(
                "w-4 h-4 bg-white rounded-full shadow-sm transition-all",
                row.original.isActive ? "translate-x-5" : "translate-x-0"
            )} />
        </button>
      )
    }
  ];

  const rowActions: RowAction<Service>[] = [
    {
      label: "Xem & Sửa",
      icon: <Edit3 size={16} />,
      onClick: (service: Service) => {
        setSelectedServiceId(service.serviceId);
        setModalMode("edit");
      }
    },
    {
      label: "Cập nhật giá",
      icon: <History size={16} />,
      onClick: (service: Service) => {
        setTargetService(service);
        setShowUpdatePrice(true);
      }
    },
    { type: 'divider' as const },
    {
      label: (service) => service.isActive ? "Vô hiệu hóa" : "Kích hoạt",
      icon: <ShieldAlert size={16} />,
      variant: 'danger' as const,
      onClick: (service: Service) => handleToggleActive(service)
    }
  ];

  return (
    <div className="w-full min-w-0 space-y-6 pb-20 md:space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
           <div className="hidden sm:flex w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-[28px] items-center justify-center text-white shadow-2xl shadow-primary/30 rotate-3 hover:rotate-0 transition-transform duration-500">
              <LayoutGrid size={32} />
           </div>
           <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                    Dịch vụ tính tiền
                </h1>
                <span className="hidden sm:inline-block bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[2px] border border-primary/20">
                    {data?.total || 0} mục
                </span>
              </div>
              <p className="text-slate-500 text-sm font-medium mt-1">
                Chỉ quản lý các khoản thu cố định theo hợp đồng. Điện nước và tiện ích đặt chỗ đã được tách sang màn hình riêng.
              </p>
           </div>
        </div>

        <button
          onClick={() => {
            setModalMode("create");
            setSelectedServiceId(null);
          }}
          className="w-full md:w-auto group relative px-8 h-14 bg-slate-900 text-white rounded-[22px] font-black text-[11px] uppercase tracking-[2px] overflow-hidden hover:translate-y-[-2px] transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center justify-center gap-3">
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
            Thêm dịch vụ tính tiền
          </div>
        </button>
      </div>

      {/* FILTER ARCHITECTURE */}
      <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6 lg:col-span-8 relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-slate-100 rounded-xl group-focus-within:bg-primary/10 transition-colors">
                    <Search size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input 
                    type="text"
                    placeholder="Tìm theo tên dịch vụ tính tiền hoặc mã..."
                    value={filters.search}
                    onChange={(e) => updateFilters({ search: e.target.value })}
                    className="w-full h-14 pl-16 pr-6 bg-white border border-slate-100 rounded-2xl outline-none focus:border-primary shadow-sm hover:shadow-md focus:shadow-xl focus:shadow-primary/5 transition-all text-sm font-bold text-slate-800"
                  />
              </div>

              <div className="md:col-span-3 lg:col-span-2 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
                     <Filter size={14} />
                  </div>
                  <select
                    value={filters.serviceType || ""}
                    onChange={(e) => updateFilters({ serviceType: e.target.value })}
                    className="w-full h-14 pl-10 pr-4 bg-white border border-slate-100 rounded-2xl outline-none focus:border-primary shadow-sm text-xs font-black uppercase tracking-widest text-slate-600 appearance-none transition-all cursor-pointer hover:bg-slate-50"
                  >
                    <option value="">Tất cả loại</option>
                    {Object.entries(SERVICE_TYPE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
              </div>

              <MobileSortDropdown 
                className="md:col-span-3 lg:col-span-2"
                options={[
                    { label: 'Tên (A-Z)', value: 'serviceName', dir: 'asc' },
                    { label: 'Tên (Z-A)', value: 'serviceName', dir: 'desc' },
                    { label: 'Giá cao nhất', value: 'currentPrice', dir: 'desc' },
                    { label: 'Giá thấp nhất', value: 'currentPrice', dir: 'asc' },
                ]}
                currentValue={filters.sortBy || "serviceName"}
                currentDir={filters.sortDir || "asc"}
                onChange={(sortBy, sortDir) => updateFilters({ sortBy, sortDir })}
              />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <QuickFilterChips 
                value={currentStatus}
                onChange={(val) => updateFilters({ status: val })}
                options={[
                    { label: 'Tất cả', value: 'all' },
                    { label: 'Hoạt động', value: 'active', color: 'bg-green-500' },
                    { label: 'Tạm dừng', value: 'inactive', color: 'bg-red-500' },
                ]}
              />

              <button 
                onClick={handleReset}
                className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors pr-2"
              >
                  <RotateCcw size={14} />
                  Đặt lại bộ lọc
              </button>
          </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
             {[1,2,3,4,5].map(i => (
                <div key={i} className="h-16 w-full bg-slate-50 animate-pulse rounded-2xl" />
             ))}
          </div>
        ) : isError ? (
          <ErrorBanner message="Không thể tải danh sách dịch vụ tính tiền" onRetry={refetch} />
        ) : data?.data.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Search size={32} className="text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Không tìm thấy kết quả</h3>
              <p className="text-slate-500 text-sm max-w-xs mb-8">
                Hãy thử điều chỉnh lại bộ lọc hoặc tìm kiếm với từ khóa khác.
              </p>
              <button 
                onClick={handleReset}
                className="px-6 h-10 border-2 border-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all text-slate-900"
              >
                Xóa tất cả bộ lọc
              </button>
          </div>
        ) : (
          <DataTable 
            columns={columns}
            data={data?.data ?? []}
            total={data?.total ?? 0}
            pagination={{
                page: filters.page,
                limit: filters.limit,
                onChange: (p, l) => updateFilters({ page: p, limit: l })
            }}
            sorting={{
                sortBy: filters.sortBy || "serviceName",
                sortDir: filters.sortDir || "asc",
                onChange: (b, d) => updateFilters({ sortBy: b, sortDir: d })
            }}
            rowActions={rowActions}
            rowClassName={(row) => !row.isActive ? "bg-slate-50/50 grayscale-[0.5]" : ""}
          />
        )}
      </div>

      <ServiceDetailModal
        open={modalMode !== null}
        onClose={() => { setModalMode(null); setSelectedServiceId(null); }}
        serviceId={selectedServiceId}
        mode={modalMode || "view"}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["services"] })}
      />

      {targetService && (
        <UpdatePriceModal
            open={showUpdatePrice}
            onClose={() => { setShowUpdatePrice(false); setTargetService(null); }}
            service={targetService}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ["services"] })}
        />
      )}
    </div>
  );
};

export default ServiceCatalog;
