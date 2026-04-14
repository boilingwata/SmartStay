import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const StaffDashboard = lazy(() => import('@/views/admin/staff/StaffDashboard'))
const StaffMyTickets = lazy(() => import('@/views/admin/staff/StaffMyTickets'))
const VisitorCheckin = lazy(() => import('@/views/admin/staff/VisitorCheckin'))
const AmenityCheckin = lazy(() => import('@/views/admin/staff/AmenityCheckin'))
const TicketDetail = lazy(() => import('@/views/admin/tickets/TicketDetail'))

export const staffRoutes: RouteObject[] = [
  { path: 'dashboard', element: <StaffDashboard /> },
  { path: 'my-tickets', element: <StaffMyTickets /> },
  { path: 'tickets/:id', element: <TicketDetail /> },
  { path: 'visitor-checkin', element: <VisitorCheckin /> },
  { path: 'amenity-checkin', element: <AmenityCheckin /> },
]

export default staffRoutes
