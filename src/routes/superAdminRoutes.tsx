import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Dashboard = lazy(() => import('@/views/super-admin/Dashboard'))

const Placeholder = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-white">
    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">Scaffold</p>
    <h1 className="text-3xl font-black tracking-tight mt-3">{title}</h1>
    <p className="text-white/70 mt-4 max-w-2xl">{description}</p>
  </div>
)

export const superAdminRoutes: RouteObject[] = [
  { path: 'dashboard', element: <Dashboard /> },
  {
    path: 'organizations',
    element: <Placeholder title="Organizations" description="Khung quản lý tenant organizations sẽ được nối vào schema `organizations` ở phase migration Supabase." />,
  },
  {
    path: 'owners',
    element: <Placeholder title="Owners" description="Danh sách owner accounts, portfolio mapping và onboarding sẽ nằm ở đây." />,
  },
  {
    path: 'audit',
    element: <Placeholder title="Risk & Audit" description="Khung audit, support impersonation và risk monitoring cho toàn nền tảng." />,
  },
  {
    path: 'settings',
    element: <Placeholder title="Platform Settings" description="Thiết lập platform-level như pricing, subscription hooks, feature flags và usage metering." />,
  },
]

export default superAdminRoutes
