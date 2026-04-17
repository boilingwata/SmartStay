import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  CalendarClock,
  FileSpreadsheet,
  PenSquare,
  ShieldAlert,
  User,
  Waves,
  Zap,
  BookOpen,
  LayoutDashboard,
  CheckCircle2
} from 'lucide-react';
import utilityAdminService from '@/services/utilityAdminService';
import { ErrorBanner } from '@/components/ui/StatusStates';
import { formatDate, formatVND } from '@/utils';

const pageFontStyle: React.CSSProperties = {
  fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif',
};

const numericStyle: React.CSSProperties = {
  fontFamily: '"IBM Plex Mono", "JetBrains Mono", monospace',
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"tnum"',
};

const priorityFlow = [
  {
    title: '1. Ghi đè kỳ hóa đơn',
    description: 'Chỉ tác động đúng một kỳ thanh toán. Dùng khi cần sửa tay cho một tháng cụ thể.',
  },
  {
    title: '2. Policy hợp đồng',
    description: 'Khóa riêng cho một hợp đồng, ví dụ hợp đồng thương lượng mức điện cơ bản riêng.',
  },
  {
    title: '3. Policy phòng',
    description: 'Chuẩn của phòng đó, thường phản ánh loại phòng và thiết bị mạnh đi kèm.',
  },
  {
    title: '4. Policy tòa nhà',
    description: 'Mặc định theo vị trí hoặc phân khúc tòa nhà.',
  },
  {
    title: '5. Policy hệ thống',
    description: 'Fallback cuối cùng để hệ thống vẫn tính được nếu thiếu cấu hình ở lớp dưới.',
  },
];

const sourceMap = {
  contract: 'Hợp đồng',
  room: 'Phòng',
  building: 'Tòa nhà',
  system: 'Hệ thống',
  invoice_override: 'Ghi đè kỳ hóa đơn',
} as const;

function getRunStatusLabel(status: string) {
  switch (status.toLowerCase()) {
    case 'running':
      return 'Đang chạy';
    case 'completed':
      return 'Hoàn thành';
    case 'failed':
      return 'Thất bại';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return status;
  }
}

export default function UtilityHubPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'docs'>('overview');

  const policiesQuery = useQuery({
    queryKey: ['utility-policies'],
    queryFn: () => utilityAdminService.listPolicies(),
  });

  const overridesQuery = useQuery({
    queryKey: ['utility-overrides'],
    queryFn: () => utilityAdminService.listOverrides(),
  });

  const runsQuery = useQuery({
    queryKey: ['billing-runs'],
    queryFn: () => utilityAdminService.listBillingRuns(),
  });

  const isLoading = policiesQuery.isLoading || overridesQuery.isLoading || runsQuery.isLoading;
  const isError = policiesQuery.isError || overridesQuery.isError || runsQuery.isError;

  const activePolicies = useMemo(
    () => (policiesQuery.data ?? []).filter((policy) => policy.isActive),
    [policiesQuery.data],
  );
  const latestRun = runsQuery.data?.[0] ?? null;
  const recentOverrides = (overridesQuery.data ?? []).slice(0, 4);
  const recentPolicies = activePolicies.slice(0, 4);

  const policyBuckets = useMemo(() => {
    return activePolicies.reduce(
      (acc, policy) => {
        acc[policy.scopeType] += 1;
        return acc;
      },
      { system: 0, building: 0, room: 0, contract: 0 },
    );
  }, [activePolicies]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 pb-20 md:px-6" style={pageFontStyle}>
      {/* HEADER SECTION */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_34%),linear-gradient(135deg,_#fffaf0_0%,_#ffffff_52%,_#f8fafc_100%)] p-6 shadow-2xl shadow-slate-900/5 md:p-8 transition-all duration-500 hover:shadow-slate-900/10">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-amber-700 shadow-sm">
              <Zap size={14} />
              Trung tâm điện nước
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-900 md:text-5xl">
                Tổ hợp nghiệp vụ tính cước Điện & Nước.
              </h1>
              <p className="max-w-3xl text-sm font-medium leading-relaxed text-slate-600 md:text-base">
                Trong dự án này, <strong>Điện nước</strong> không phải tiện ích đặt chỗ (Amenity). Đây là quy trình tính phi <strong>Policy-based</strong>, 
                được quy định bởi hệ số, phụ thu, prorate theo ngày ở và cho phép ghi đè hoàn toàn theo từng kỳ hóa đơn cụ thể.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/owner/settings/utility-policies"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 font-black text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg focus:ring-4 focus:ring-slate-900/20"
              >
                Chính sách (Policies)
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/owner/settings/utility-overrides"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-6 font-black text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
              >
                Ghi đè (Overrides)
              </Link>
              <Link
                to="/owner/settings/billing-runs"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-emerald-50 px-6 font-black text-emerald-800 shadow-sm transition hover:bg-emerald-100 hover:border-emerald-300"
              >
                Kỳ tính hóa đơn
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard
              icon={Zap}
              title="Policy điện nước"
              value={String(activePolicies.length)}
              note={`${policyBuckets.system} hệ thống • ${policyBuckets.building} tòa • ${policyBuckets.room} phòng`}
              accent="slate"
            />
            <MetricCard
              icon={PenSquare}
              title="Ghi đè đã lưu"
              value={String(overridesQuery.data?.length ?? 0)}
              note="Tác động theo từng kỳ hóa đơn"
              accent="rose"
            />
            <MetricCard
              icon={CalendarClock}
              title="Kỳ hóa đơn"
              value={latestRun?.billingPeriod ?? '--'}
              note={latestRun ? getRunStatusLabel(latestRun.status) : 'Chưa có'}
              accent="sky"
            />
            <MetricCard
              icon={ShieldAlert}
              title="Logic lõi"
              value="Tự động"
              note="Không cần nhập chỉ số tay"
              accent="emerald"
            />
          </div>
        </div>
      </section>

      {/* TABS NAVIGATION */}
      <div className="flex space-x-2 overflow-x-auto rounded-3xl bg-slate-900/5 p-1.5 shadow-inner backdrop-blur-xl">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-[20px] px-6 py-3.5 text-sm font-bold transition-all duration-300 md:flex-none ${
            activeTab === 'overview'
              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5'
              : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard size={18} />
          Tổng Quan Hoạt Động
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-[20px] px-6 py-3.5 text-sm font-bold transition-all duration-300 md:flex-none ${
            activeTab === 'docs'
              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5'
              : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
          }`}
        >
          <BookOpen size={18} />
          Tài Liệu & Công Thức
        </button>
      </div>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-[32px] border border-slate-100 bg-slate-50" />
      ) : isError ? (
        <ErrorBanner
          message="Không tải được dữ liệu điện nước tổng quan."
          onRetry={() => {
            policiesQuery.refetch();
            overridesQuery.refetch();
            runsQuery.refetch();
          }}
        />
      ) : (
        <>
          {/* TAB CONTENT: TỔNG QUAN HOẠT ĐỘNG */}
          {activeTab === 'overview' && (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
              <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                {/* ACTIVE POLICIES */}
                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 transition-all hover:shadow-slate-900/10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                      <User size={14} />
                      Policy đang active
                    </div>
                    <Link
                      to="/owner/settings/utility-policies"
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 px-3 py-1 rounded-full border border-slate-200"
                    >
                      Xem tất cả
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {recentPolicies.length === 0 ? (
                      <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-500">
                        Chưa có policy nào đang hoạt động.
                      </div>
                    ) : (
                      recentPolicies.map((policy) => (
                        <div key={policy.id} className="group rounded-[24px] border border-slate-200 bg-white hover:bg-slate-50 transition-colors p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-black text-slate-900">{policy.name}</p>
                              <span className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {sourceMap[policy.scopeType]} {policy.scopeId != null ? `#${policy.scopeId}` : ''}
                              </span>
                            </div>
                            <div className="text-right text-xs font-bold text-slate-500 space-y-1" style={numericStyle}>
                              <div className="flex justify-end items-center gap-2">
                                <span className="text-[10px] uppercase text-amber-500 font-bold">Điện</span>
                                <span className="text-slate-900">{formatVND(policy.electricBaseAmount)}</span>
                              </div>
                              <div className="flex justify-end items-center gap-2">
                                <span className="text-[10px] uppercase text-sky-500 font-bold">Nước</span>
                                <span className="text-slate-900">{formatVND(policy.waterBaseAmount)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* RECENT OVERRIDES */}
                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 transition-all hover:shadow-slate-900/10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                      <PenSquare size={14} />
                      Ghi đè gần đây
                    </div>
                    <Link
                      to="/owner/settings/utility-overrides"
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 px-3 py-1 rounded-full border border-slate-200"
                    >
                      Xem tất cả
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {recentOverrides.length === 0 ? (
                      <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-500">
                        Chưa có ghi đè điện nước theo kỳ hóa đơn.
                      </div>
                    ) : (
                      recentOverrides.map((override) => (
                        <div key={override.id} className="group rounded-[24px] border border-slate-200 bg-white hover:bg-slate-50 transition-colors p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-black text-rose-900">{override.contractCode}</p>
                              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 flex gap-2">
                                <span className="bg-slate-100 px-2 py-0.5 rounded-full">{override.billingPeriod}</span>
                                <span className="bg-slate-100 px-2 py-0.5 rounded-full">{override.roomCode}</span>
                              </p>
                              <p className="mt-2 text-xs leading-5 font-medium text-slate-500 line-clamp-1">{override.reason}</p>
                            </div>
                            <div className="text-right text-[11px] font-bold text-slate-600 space-y-1" style={numericStyle}>
                              <div className="flex justify-end items-center gap-2">
                                <span className="text-[9px] uppercase text-amber-500 font-bold">Điện</span>
                                <span>
                                  {override.electricFinalOverride != null
                                    ? <span className="text-rose-600 font-black">{formatVND(override.electricFinalOverride)} (Chốt)</span>
                                    : override.electricBaseOverride != null
                                      ? `${formatVND(override.electricBaseOverride)} (Base)`
                                      : '--'}
                                </span>
                              </div>
                              <div className="flex justify-end items-center gap-2">
                                <span className="text-[9px] uppercase text-sky-500 font-bold">Nước</span>
                                <span>
                                  {override.waterFinalOverride != null
                                    ? <span className="text-rose-600 font-black">{formatVND(override.waterFinalOverride)} (Chốt)</span>
                                    : override.waterBaseOverride != null
                                      ? `${formatVND(override.waterBaseOverride)} (Base)`
                                      : '--'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* LATEST BILLING RUN */}
              <div className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-6 shadow-xl shadow-slate-900/5">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-600">
                      <CalendarClock size={14} />
                      Billing run gần nhất
                    </div>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Chi tiết đợt xuất hóa đơn</h2>
                  </div>
                  <Link
                    to="/owner/settings/billing-runs"
                    className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white shadow-sm px-5 font-black text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
                  >
                    Quản lý các đợt 
                    <ArrowRight size={16} />
                  </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <MiniMetric title="Kỳ" value={latestRun?.billingPeriod ?? '--'} />
                  <MiniMetric title="Trạng thái" value={latestRun ? getRunStatusLabel(latestRun.status) : '--'} accent={latestRun?.status === 'completed' ? 'emerald' : 'slate'} />
                  <MiniMetric title="Bắt đầu lúc" value={latestRun?.startedAt ? formatDate(latestRun.startedAt) : '--'} />
                  <MiniMetric title="Hoành thành" value={latestRun?.completedAt ? formatDate(latestRun.completedAt) : '--'} />
                </div>

                <div className="mt-5 rounded-[20px] border border-slate-200 bg-white/60 backdrop-blur-sm px-5 py-4 text-sm font-medium leading-relaxed text-slate-600 shadow-sm flex items-start gap-4">
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <p>
                    Một <strong>Billing Run</strong> chuẩn sẽ trải qua các bước: chọn hợp đồng đủ điều kiện $\rightarrow$ resolve đúng Policy 
                    $\rightarrow$ tính tiền điện nước $\rightarrow$ tạo invoice item $\rightarrow$ lưu snapshot. <br/>
                    Việc lưu snapshot giúp bạn có thể <strong>audit lại công thức</strong> đã sử dụng tại thời điểm xuất hóa đơn đó sau này.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* TAB CONTENT: TÀI LIỆU & CÔNG THỨC */}
          {activeTab === 'docs' && (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                {/* 4 LỚP DỮ LIỆU */}
                <div className="rounded-[32px] border border-slate-200 bg-white p-6 md:p-8 shadow-xl shadow-slate-900/5">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    <FileSpreadsheet size={14} />
                    Kiến Trúc Hoạt Động
                  </div>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 mb-6">4 Lớp dữ liệu của quy trình tính tiền</h2>

                  <div className="grid gap-4 md:grid-cols-2">
                    <StepCard
                      icon={Building2}
                      title="1. Dữ liệu nền"
                      description="Tòa nhà, phòng, thiết bị phòng, số người tính phí và ngày hiệu lực hợp đồng là đầu vào bắt buộc."
                    />
                    <StepCard
                      icon={Zap}
                      title="2. Resolve policy"
                      description="Hệ thống tự động rà soát từ hợp đồng xuống hệ thống lấy policy; nhận diện phụ thu & hệ số."
                    />
                    <StepCard
                      icon={Waves}
                      title="3. Tính điện nước"
                      description="Điện = Base + Phụ thu thiết bị. Nước = Base + Đầu người. Luôn tự tính Prorate theo tỷ lệ ngày ở."
                    />
                    <StepCard
                      icon={PenSquare}
                      title="4. Chốt số & Audit"
                      description="Sau khi ra bill, mọi công số, policy, hệ số được lưu vĩnh viễn bằng Snapshot bảo toàn lịch sử truy vết."
                    />
                  </div>
                </div>

                {/* THỨ TỰ ƯU TIÊN */}
                <div className="rounded-[32px] border border-slate-200 bg-white p-6 md:p-8 shadow-xl shadow-slate-900/5 flex flex-col">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    <ArrowRight size={14} />
                    Luồng Ưu Tiên (Resolve)
                  </div>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 mb-6">Policy được áp dụng theo mức độ</h2>

                  <div className="space-y-3 flex-1 flex flex-col justify-center">
                    {priorityFlow.map((item, index) => (
                      <div key={item.title} className="group flex gap-4 items-center">
                        <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-slate-100 font-black text-slate-600 text-sm border border-slate-200 shadow-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 rounded-[20px] border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors px-5 py-3">
                          <p className="text-sm font-black text-slate-900">{item.title.substring(3)}</p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* FORMULAS */}
              <div className="grid gap-6 xl:grid-cols-2">
                <GuideCard
                  icon={Zap}
                  title="Hướng dẫn tính Tiền Điện"
                  accentClass="text-amber-700 bg-amber-100"
                  bgClass="bg-amber-50"
                  borderClass="border-amber-200"
                  steps={[
                    {
                      name: "Bước 1: Tính phí cơ sở (Subtotal)",
                      desc: "Cộng Giá Điện Cơ Bản và Phụ thu của các thiết bị có trong phòng.",
                      example: "Ví dụ: Điện cơ bản 200,000đ + Phụ thu máy lạnh 50,000đ = 250,000đ"
                    },
                    {
                      name: "Bước 2: Áp dụng hệ số Mùa & Vị trí",
                      desc: "Nhân phí cơ sở với Hệ số mùa nóng (nếu tháng đó là mùa nóng) và Hệ số vị trí.",
                      example: "Ví dụ: 250,000đ × 1.15 (Hệ số mùa nóng) × 1.0 (Vị trí) = 287,500đ"
                    },
                    {
                      name: "Bước 3: Tính theo số ngày ở thực tế (Prorate)",
                      desc: "Nhân số tiền ở Bước 2 với tỷ lệ: (Số ngày khách ở / Tổng số ngày trong tháng).",
                      example: "Ví dụ khách ở 15 ngày trong tháng 30 ngày: 287,500đ × (15 / 30) = 143,750đ"
                    },
                    {
                      name: "Bước 4: So sánh Mức Sàn & Làm tròn",
                      desc: "So sánh kết quả với Mức Sàn (Mức tối thiểu phải đóng). Lấy số lớn hơn rồi Làm tròn.",
                      example: "Ví dụ Mức sàn là 100,000đ. Do 143,750đ > 100,000đ nên thu 143,750đ. Làm tròn tới 1,000đ -> 144,000đ"
                    }
                  ]}
                />
                <GuideCard
                  icon={Waves}
                  title="Hướng dẫn tính Tiền Nước"
                  accentClass="text-sky-700 bg-sky-100"
                  bgClass="bg-sky-50"
                  borderClass="border-sky-200"
                  steps={[
                    {
                      name: "Bước 1: Tính phí cơ sở theo đầu người và phòng",
                      desc: "Cộng Giá Nước Cố Định Của Phòng với (Giá Nước / Người × Số người ở).",
                      example: "Ví dụ: Cố định 0đ + (50,000đ/người × 2 người) = 100,000đ"
                    },
                    {
                      name: "Bước 2: Áp dụng hệ số Vị trí",
                      desc: "Nhân phí cơ sở với Hệ số vị trí (Thường tiền nước không có hệ số mùa nóng).",
                      example: "Ví dụ: 100,000đ × 1.0 (Vị trí) = 100,000đ"
                    },
                    {
                      name: "Bước 3: Tính theo số ngày ở thực tế (Prorate)",
                      desc: "Nhân số tiền ở Bước 2 với tỷ lệ: (Số ngày khách ở / Tổng số ngày trong tháng).",
                      example: "Ví dụ khách ở 15 ngày trong tháng 30 ngày: 100,000đ × (15 / 30) = 50,000đ"
                    },
                    {
                      name: "Bước 4: So sánh Mức Sàn & Làm tròn",
                      desc: "So sánh kết quả với Mức Sàn. Lấy số lớn hơn rồi Làm tròn theo Bước làm tròn.",
                      example: "Ví dụ Mức sàn là 60,000đ. Do 50,000đ < 60,000đ nên thu mức sàn 60,000đ."
                    }
                  ]}
                />
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  note,
  accent = 'slate'
}: {
  icon: typeof Zap;
  title: string;
  value: string;
  note: string;
  accent?: 'slate' | 'amber' | 'emerald' | 'sky' | 'rose';
}) {
  const accentClasses = {
    slate: 'bg-slate-100 text-slate-600',
    amber: 'bg-amber-100 text-amber-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    sky: 'bg-sky-100 text-sky-600',
    rose: 'bg-rose-100 text-rose-600',
  };

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 transition-all hover:shadow-slate-900/10">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
        <div className={`rounded-2xl p-3 shadow-sm ${accentClasses[accent]}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-5 text-4xl font-black tracking-tight text-slate-900" style={numericStyle}>{value}</p>
      <p className="mt-3 text-xs font-medium leading-relaxed text-slate-500 line-clamp-2">{note}</p>
    </div>
  );
}

function StepCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-slate-50 hover:bg-white p-5 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="rounded-[16px] bg-white border border-slate-100 p-3 text-slate-600 shadow-sm group-hover:text-emerald-600 transition-colors">
          <Icon size={18} />
        </div>
        <h3 className="text-sm font-black text-slate-900">{title}</h3>
      </div>
      <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">{description}</p>
    </article>
  );
}

function GuideCard({
  icon: Icon,
  title,
  steps,
  accentClass,
  bgClass,
  borderClass,
}: {
  icon: typeof Zap;
  title: string;
  steps: { name: string; desc: string; example: string }[];
  accentClass: string;
  bgClass: string;
  borderClass: string;
}) {
  return (
    <article className={`rounded-[32px] border ${borderClass} bg-white p-6 md:p-8 shadow-xl shadow-slate-900/5`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`rounded-[18px] p-3 shadow-sm ${accentClass}`}>
          <Icon size={20} className="stroke-[2.5]" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900">{title}</h2>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className={`rounded-[20px] border border-slate-200 p-4 shadow-sm ${bgClass}`}>
            <h3 className="text-sm font-black text-slate-800 mb-1">{step.name}</h3>
            <p className="text-sm font-medium text-slate-600 mb-2 leading-relaxed">{step.desc}</p>
            <div className="bg-white/80 p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700" style={numericStyle}>
              💡 {step.example}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function MiniMetric({ title, value, accent = 'slate' }: { title: string; value: string, accent?: 'slate' | 'emerald' }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className={`mt-3 text-lg font-black ${accent === 'emerald' ? 'text-emerald-600' : 'text-slate-900'}`} style={numericStyle}>{value}</p>
    </div>
  );
}

