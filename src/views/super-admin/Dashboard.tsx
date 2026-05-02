import React from 'react'
import { Activity, BadgeDollarSign, Building2, ShieldAlert, Users, ArrowRight, Layers, TrendingUp } from 'lucide-react'

const stats = [
  { label: 'Tổ chức mục tiêu', value: '02', icon: Building2, tone: 'bg-cyan-500/10 text-cyan-300', sub: 'Đang hoạt động' },
  { label: 'Không gian chủ nhà', value: '01', icon: Users, tone: 'bg-emerald-500/10 text-emerald-300', sub: 'Đã kích hoạt' },
  { label: 'Nhân sự mẫu', value: '01', icon: Activity, tone: 'bg-amber-500/10 text-amber-300', sub: 'Đang vận hành' },
  { label: 'Thanh toán & SaaS', value: 'Sẵn sàng', icon: BadgeDollarSign, tone: 'bg-fuchsia-500/10 text-fuchsia-300', sub: 'Cần kết nối' },
]

const frameworkSteps = [
  'Quản lý tổ chức và tiến trình giới thiệu dịch vụ.',
  'Quản lý tài khoản chủ nhà và danh mục tòa nhà tương ứng.',
  'Trung tâm kiểm toán, hỗ trợ và giám sát rủi ro toàn hệ thống.',
  'Điểm kết nối thanh toán SaaS, gói dịch vụ và đo lường sử dụng ở giai đoạn tiếp theo.',
]

const SuperAdminDashboard: React.FC = () => {
  return (
    <div className="space-y-8 text-white">
      {/* Hero Section */}
      <section className="rounded-[32px] bg-gradient-to-br from-cyan-500/15 to-indigo-500/10 border border-white/10 p-8">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-300">
          Giai đoạn 1 — Quản trị nền tảng
        </p>
        <h1 className="text-4xl font-display font-black tracking-tight mt-3">
          Không gian Quản trị Tối cao
        </h1>
        <p className="text-white/70 max-w-3xl mt-4 text-lg leading-relaxed">
          Đây là không gian frontend riêng cho vai trò Quản trị Tối cao trong kiến trúc SaaS đa tổ chức. Phần này
          tách biệt khỏi Chủ nhà / Nhân sự / Cư dân để quản trị toàn bộ hạ tầng nền tảng.
        </p>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[28px] border border-white/10 bg-white/5 p-6 flex flex-col gap-4 hover:bg-white/8 transition-colors">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.tone}`}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.2em]">{stat.label}</p>
              <p className="text-4xl font-black tracking-tight mt-1">{stat.value}</p>
              <p className="text-white/30 text-[10px] font-medium mt-1">{stat.sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Main Content */}
      <section className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-6">
        {/* Framework card */}
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-300 flex items-center justify-center">
              <Layers size={20} />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Khung quản trị nền tảng</h2>
          </div>
          <div className="space-y-3">
            {frameworkSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-3 group">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-black text-white/70 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 transition-colors">
                  {i + 1}
                </span>
                <p className="text-white/75 leading-relaxed text-sm pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Status card */}
        <div className="rounded-[28px] border border-amber-400/20 bg-amber-500/8 p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/15 text-amber-300 flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-300">Chế độ hiện tại</p>
              <h2 className="text-xl font-black tracking-tight">Giao diện trước, dữ liệu sau</h2>
            </div>
          </div>
          <p className="text-white/75 leading-relaxed text-sm flex-1">
            Đăng nhập Quản trị Tối cao hiện đang chạy ở chế độ demo cục bộ để không tác động vào cơ sở dữ liệu
            hiện có. Bước tiếp theo sẽ là thêm bảng <code className="text-amber-300 font-mono">tổ_chức</code>,{' '}
            <code className="text-amber-300 font-mono">thành_viên_tổ_chức</code> và phân quyền hàng đa tổ chức thực
            sự trong Supabase.
          </p>
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
            <TrendingUp size={14} />
            <span>Giai đoạn tiếp theo: Kết nối Supabase đa tổ chức</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </section>
    </div>
  )
}

export default SuperAdminDashboard
