import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Dashboard = lazy(() => import('@/views/super-admin/Dashboard'))

const renderPlaceholder = (title: string, description: string) => (
  <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-white">
    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">Scaffold</p>
    <h1 className="mt-3 text-3xl font-black tracking-tight">{title}</h1>
    <p className="mt-4 max-w-2xl text-white/70">{description}</p>
  </div>
)

export const superAdminRoutes: RouteObject[] = [
  { path: 'dashboard', element: <Dashboard /> },
  {
    path: 'organizations',
    element: renderPlaceholder('Organizations', 'Khung quan ly tenant organizations se duoc noi vao schema organizations o phase migration Supabase.'),
  },
  {
    path: 'audit',
    element: renderPlaceholder('Risk & Audit', 'Khung audit, support impersonation va risk monitoring cho toan nen tang.'),
  },
  {
    path: 'settings',
    element: renderPlaceholder('Platform Settings', 'Thiet lap platform-level nhu pricing, subscription hooks, feature flags va usage metering.'),
  },
]

export default superAdminRoutes
