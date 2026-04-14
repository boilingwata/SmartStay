import React from 'react'
import { ArrowRight, Building2, Shield, Users, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'

const portals = [
  {
    title: 'Super Admin',
    description: 'Giám sát nền tảng, tổ chức và vận hành SaaS.',
    href: '/super-admin/login',
    className: 'from-[#4338CA] to-[#0F172A]',
    icon: Shield,
  },
  {
    title: 'Owner',
    description: 'Quản lý portfolio tòa nhà, doanh thu và nhân sự.',
    href: '/owner/login',
    className: 'from-primary to-[#2E5D9F]',
    icon: Building2,
  },
  {
    title: 'Staff',
    description: 'Xử lý ticket, check-in, thao tác vận hành hàng ngày.',
    href: '/staff/login',
    className: 'from-secondary to-[#0F766E]',
    icon: Users,
  },
  {
    title: 'Tenant Portal',
    description: 'Thanh toán hóa đơn, gửi yêu cầu và theo dõi thông báo.',
    href: '/portal/login',
    className: 'from-[#0D8A8A] to-[#1B3A6B]',
    icon: Wallet,
  },
]

const AuthHubPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F6F4EF] px-6 py-16">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="space-y-3 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-primary">SmartStay SaaS</p>
          <h1 className="text-5xl font-display font-black tracking-tight text-slate-900">Chọn Cổng Đăng Nhập</h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            Hệ thống đã được tách thành 4 không gian riêng: Super Admin, Owner, Staff và Tenant.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {portals.map((portal) => (
            <Link
              key={portal.href}
              to={portal.href}
              className={`group rounded-[32px] p-8 text-white bg-gradient-to-br ${portal.className} shadow-xl min-h-[240px] flex flex-col justify-between`}
            >
              <div className="space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
                  <portal.icon size={28} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black tracking-tight">{portal.title}</h2>
                  <p className="text-white/75 leading-relaxed">{portal.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm font-black uppercase tracking-[0.18em]">
                <span>Vào cổng</span>
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AuthHubPage
