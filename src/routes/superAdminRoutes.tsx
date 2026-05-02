import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Dashboard = lazy(() => import('@/views/super-admin/Dashboard'))

/** Placeholder có style nhất quán với hệ thống */
const renderPlaceholder = (title: string, description: string) => (
  <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-white">
    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">Đang phát triển</p>
    <h1 className="mt-3 text-3xl font-black tracking-tight">{title}</h1>
    <p className="mt-4 max-w-2xl text-white/70 leading-relaxed">{description}</p>
  </div>
)

export const superAdminRoutes: RouteObject[] = [
  { path: 'dashboard', element: <Dashboard /> },
  {
    path: 'organizations',
    element: renderPlaceholder(
      'Quản lý Tổ chức',
      'Khung quản lý tổ chức thuê dịch vụ (tenant organizations) sẽ được kết nối vào schema tổ_chức sau khi hoàn thành migration Supabase đa tổ chức.',
    ),
  },
  {
    path: 'audit',
    element: renderPlaceholder(
      'Rủi ro & Kiểm toán',
      'Khung kiểm toán, hỗ trợ mạo danh và giám sát rủi ro cho toàn bộ nền tảng. Cho phép Quản trị Tối cao xem mọi hoạt động trên hệ thống.',
    ),
  },
  {
    path: 'settings',
    element: renderPlaceholder(
      'Cấu hình Nền tảng',
      'Thiết lập cấp độ nền tảng bao gồm bảng giá, móc kết nối gói dịch vụ, cờ tính năng và đo lường mức sử dụng.',
    ),
  },
]

export default superAdminRoutes
