import React from 'react'
import { Activity, BadgeDollarSign, Building2, ShieldAlert, Users } from 'lucide-react'

const stats = [
  { label: 'Organizations mục tiêu', value: '02', icon: Building2, tone: 'bg-cyan-500/10 text-cyan-300' },
  { label: 'Owner workspace', value: '01', icon: Users, tone: 'bg-emerald-500/10 text-emerald-300' },
  { label: 'Staff mẫu', value: '01', icon: Activity, tone: 'bg-amber-500/10 text-amber-300' },
  { label: 'Billing / SaaS hooks', value: 'Ready', icon: BadgeDollarSign, tone: 'bg-fuchsia-500/10 text-fuchsia-300' },
]

const SuperAdminDashboard: React.FC = () => {
  return (
    <div className="space-y-8 text-white">
      <section className="rounded-[32px] bg-gradient-to-br from-cyan-500/15 to-indigo-500/10 border border-white/10 p-8">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-300">Phase 1</p>
        <h1 className="text-4xl font-display font-black tracking-tight mt-3">Super Admin Workspace</h1>
        <p className="text-white/70 max-w-3xl mt-4 text-lg leading-relaxed">
          Đây là khung frontend riêng cho vai trò Super Admin trong kiến trúc SaaS đa tenant. Phần này tách khỏi Owner/Staff/Tenant để quản trị tổ chức, rủi ro và hạ tầng.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.tone}`}>
              <stat.icon size={22} />
            </div>
            <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.2em] mt-5">{stat.label}</p>
            <p className="text-4xl font-black tracking-tight mt-2">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-6">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 space-y-5">
          <h2 className="text-2xl font-black tracking-tight">Khung quản trị nền tảng</h2>
          <div className="space-y-4 text-white/75 leading-relaxed">
            <p>1. Quản lý Organizations và trạng thái onboarding.</p>
            <p>2. Quản lý owner accounts và mapping portfolio tòa nhà.</p>
            <p>3. Audit / support / risk center cho toàn hệ thống.</p>
            <p>4. Điểm nối billing SaaS, subscription và usage-based metering ở phase sau.</p>
          </div>
        </div>

        <div className="rounded-[28px] border border-amber-400/20 bg-amber-500/8 p-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/15 text-amber-300 flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-300">Current Mode</p>
              <h2 className="text-2xl font-black tracking-tight">Frontend First</h2>
            </div>
          </div>
          <p className="text-white/75 mt-5 leading-relaxed">
            Đăng nhập Super Admin hiện đang chạy local demo mode để không đụng DB cũ. Bước tiếp theo sẽ là thêm `organizations`, `org_members` và RLS multi-tenant thực sự trong Supabase.
          </p>
        </div>
      </section>
    </div>
  )
}

export default SuperAdminDashboard
