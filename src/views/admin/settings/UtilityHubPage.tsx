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
import {
  formatUtilityBillingPeriod,
  formatUtilityDateTime,
  getUtilityRunStatusLabel,
  getUtilityScopeLabel,
} from '@/lib/utilityPresentation';
import utilityAdminService from '@/services/utilityAdminService';
import { ErrorBanner } from '@/components/ui/StatusStates';
import { formatVND } from '@/utils';

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
    title: '2. Chính sách hợp đồng',
    description: 'Áp riêng cho một hợp đồng khi hợp đồng đó có mức tính điện nước khác phần còn lại.',
  },
  {
    title: '3. Chính sách phòng',
    description: 'Chuẩn của phòng đó, thường phản ánh loại phòng và thiết bị mạnh đi kèm.',
  },
  {
    title: '4. Chính sách tòa nhà',
    description: 'Mặc định theo vị trí hoặc phân khúc tòa nhà.',
  },
  {
    title: '5. Chính sách toàn hệ thống',
    description: 'Lớp cuối cùng để hệ thống vẫn tính được nếu thiếu cấu hình ở phạm vi thấp hơn.',
  },
];

const workflowCards = [
  {
    title: 'Khi nào dùng chính sách',
    description: 'Dùng khi bạn muốn đặt mức điện nước nền cho nhiều kỳ hóa đơn về sau.',
  },
  {
    title: 'Khi nào dùng ghi đè',
    description: 'Dùng khi chỉ cần sửa riêng cho một hợp đồng trong đúng một kỳ hóa đơn.',
  },
  {
    title: 'Khi nào chạy đợt xuất hóa đơn',
    description: 'Chỉ chạy sau khi đã có chính sách nền, đã nhập đủ số người tính phí và đã xem trước danh sách hợp đồng đủ điều kiện.',
  },
] as const;

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
                Trung tâm điều phối điện nước
              </h1>
              <p className="max-w-3xl text-sm font-medium leading-relaxed text-slate-600 md:text-base">
                Trong phạm vi dự án hiện tại, điện nước được tính theo <strong>chính sách</strong>, có thể ghi đè theo từng kỳ hóa đơn và được chốt
                hàng loạt bằng đợt xuất hóa đơn tiện ích. Màn hình này giúp bạn hiểu đúng luồng thao tác trước khi sử dụng.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/owner/settings/utility-policies"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 font-black text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg focus:ring-4 focus:ring-slate-900/20"
              >
                Chính sách
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/owner/settings/utility-overrides"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-6 font-black text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
              >
                Ghi đè
              </Link>
              <Link
                to="/owner/settings/billing-runs"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-emerald-50 px-6 font-black text-emerald-800 shadow-sm transition hover:bg-emerald-100 hover:border-emerald-300"
              >
                Đợt xuất hóa đơn
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard
              icon={Zap}
              title="Chính sách đang bật"
              value={String(activePolicies.length)}
              note={`${policyBuckets.system} toàn hệ thống • ${policyBuckets.building} tòa nhà • ${policyBuckets.room} phòng • ${policyBuckets.contract} hợp đồng`}
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
              title="Đợt gần nhất"
              value={latestRun ? formatUtilityBillingPeriod(latestRun.billingPeriod) : '--'}
              note={latestRun ? getUtilityRunStatusLabel(latestRun.status) : 'Chưa có'}
              accent="sky"
            />
            <MetricCard
              icon={ShieldAlert}
              title="Nguyên tắc lõi"
              value="Đúng scope"
              note="Ghi đè một kỳ luôn ưu tiên cao hơn chính sách"
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
          Hướng Dẫn & Công Thức
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
              <div className="grid gap-4 md:grid-cols-3">
                {workflowCards.map((card) => (
                  <div key={card.title} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{card.title}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                {/* ACTIVE POLICIES */}
                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 transition-all hover:shadow-slate-900/10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                      <User size={14} />
                      Chính sách đang áp dụng
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
                        Chưa có chính sách nào đang hoạt động.
                      </div>
                    ) : (
                      recentPolicies.map((policy) => (
                        <div key={policy.id} className="group rounded-[24px] border border-slate-200 bg-white hover:bg-slate-50 transition-colors p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-black text-slate-900">{policy.name}</p>
                              <span className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {getUtilityScopeLabel(policy.scopeType)} {policy.scopeLabel ? `• ${policy.scopeLabel}` : ''}
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
                                <span className="bg-slate-100 px-2 py-0.5 rounded-full">{formatUtilityBillingPeriod(override.billingPeriod)}</span>
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
                                      ? `${formatVND(override.electricBaseOverride)} (Cơ sở)`
                                      : '--'}
                                </span>
                              </div>
                              <div className="flex justify-end items-center gap-2">
                                <span className="text-[9px] uppercase text-sky-500 font-bold">Nước</span>
                                <span>
                                  {override.waterFinalOverride != null
                                    ? <span className="text-rose-600 font-black">{formatVND(override.waterFinalOverride)} (Chốt)</span>
                                    : override.waterBaseOverride != null
                                      ? `${formatVND(override.waterBaseOverride)} (Cơ sở)`
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
                      Đợt chạy gần nhất
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
                  <MiniMetric title="Kỳ" value={latestRun ? formatUtilityBillingPeriod(latestRun.billingPeriod) : '--'} />
                  <MiniMetric title="Trạng thái" value={latestRun ? getUtilityRunStatusLabel(latestRun.status) : '--'} accent={latestRun?.status === 'completed' ? 'emerald' : 'slate'} />
                  <MiniMetric title="Bắt đầu lúc" value={latestRun?.startedAt ? formatUtilityDateTime(latestRun.startedAt) : '--'} />
                  <MiniMetric title="Hoàn thành" value={latestRun?.completedAt ? formatUtilityDateTime(latestRun.completedAt) : '--'} />
                </div>

                <div className="mt-5 rounded-[20px] border border-slate-200 bg-white/60 backdrop-blur-sm px-5 py-4 text-sm font-medium leading-relaxed text-slate-600 shadow-sm flex items-start gap-4">
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <p>
                    Một đợt xuất hóa đơn chuẩn sẽ đi theo 5 bước: chọn hợp đồng đủ điều kiện, xác định đúng chính sách,
                    tính tiền điện nước, tạo các dòng hóa đơn và lưu bản chụp công thức.
                    Bản chụp này giúp bạn đối soát lại cách tính của từng hóa đơn sau này.
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
                    Cách hệ thống hoạt động
                  </div>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 mb-6">4 lớp dữ liệu của quy trình tính tiền</h2>

                  <div className="grid gap-4 md:grid-cols-2">
                    <StepCard
                      icon={Building2}
                      title="1. Dữ liệu nền"
                      description="Tòa nhà, phòng, thiết bị phòng, số người tính phí và ngày hiệu lực hợp đồng là đầu vào bắt buộc."
                    />
                    <StepCard
                      icon={Zap}
                      title="2. Xác định chính sách"
                      description="Hệ thống tự động rà soát từ hợp đồng xuống toàn hệ thống để tìm đúng mức giá, hệ số và phụ phí."
                    />
                    <StepCard
                      icon={Waves}
                      title="3. Tính điện nước"
                      description="Điện = mức cơ sở + phụ phí thiết bị. Nước = mức cơ sở + phần theo đầu người. Hệ thống luôn tự phân bổ theo số ngày ở thực tế."
                    />
                    <StepCard
                      icon={PenSquare}
                      title="4. Chốt số & đối soát"
                      description="Sau khi tạo hóa đơn, hệ thống lưu bản chụp công thức để bạn có thể tra lại lịch sử tính tiền."
                    />
                  </div>
                </div>

                {/* THỨ TỰ ƯU TIÊN */}
                <div className="rounded-[32px] border border-slate-200 bg-white p-6 md:p-8 shadow-xl shadow-slate-900/5 flex flex-col">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    <ArrowRight size={14} />
                    Luồng ưu tiên
                  </div>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 mb-6">Mức ưu tiên khi xác định giá điện nước</h2>

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
                      desc: "Cộng giá điện cơ bản và phụ thu của các thiết bị có trong phòng.",
                      example: "Ví dụ: Điện cơ bản 200,000đ + Phụ thu máy lạnh 50,000đ = 250,000đ"
                    },
                    {
                      name: "Bước 2: Áp dụng hệ số Mùa & Vị trí",
                      desc: "Nhân phí cơ sở với Hệ số mùa nóng (nếu tháng đó là mùa nóng) và Hệ số vị trí.",
                      example: "Ví dụ: 250,000đ × 1.15 (Hệ số mùa nóng) × 1.0 (Vị trí) = 287,500đ"
                    },
                    {
                      name: "Bước 3: Phân bổ theo số ngày ở thực tế",
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
                      desc: "Cộng giá nước cố định của phòng với (giá nước / người × số người ở).",
                      example: "Ví dụ: Cố định 0đ + (50,000đ/người × 2 người) = 100,000đ"
                    },
                    {
                      name: "Bước 2: Áp dụng hệ số Vị trí",
                      desc: "Nhân phí cơ sở với hệ số vị trí. Thông thường tiền nước không dùng hệ số mùa nóng.",
                      example: "Ví dụ: 100,000đ × 1.0 (Vị trí) = 100,000đ"
                    },
                    {
                      name: "Bước 3: Phân bổ theo số ngày ở thực tế",
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
              Ví dụ: {step.example}
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
