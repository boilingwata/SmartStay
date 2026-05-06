import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Dashboard = lazy(() => import('@/views/super-admin/Dashboard'))

/** Placeholder đồng bộ giao diện với không gian quản lý (card, biên, chữ). */
const renderPlaceholder = (title: string, description: string) => (
  <div className="rounded-[28px] border border-border/70 bg-card p-8 text-foreground shadow-[0_20px_60px_-42px_rgba(15,23,42,0.34)]">
    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-secondary">Đang phát triển</p>
    <h1 className="mt-3 text-3xl font-black tracking-tight">{title}</h1>
    <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">{description}</p>
  </div>
)

export const superAdminRoutes: RouteObject[] = [
  { path: 'dashboard', element: <Dashboard /> },
  {
    path: 'organizations',
    element: renderPlaceholder(
      'Quản lý Tổ chức',
      'Trang quản lý tổ chức và không gian làm việc sẽ được bổ sung tại đây.',
    ),
  },
  {
    path: 'audit',
    element: renderPlaceholder(
      'Rủi ro & Kiểm toán',
      'Trung tâm kiểm toán và giám sát rủi ro cho toàn hệ thống sẽ được bổ sung tại đây.',
    ),
  },
  {
    path: 'settings',
    element: renderPlaceholder(
      'Cấu hình Nền tảng',
      'Cấu hình chính sách, tích hợp và thông số vận hành cấp nền tảng sẽ được bổ sung tại đây.',
    ),
  },
]

export default superAdminRoutes
