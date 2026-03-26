/**
 * Static Role Permission Configuration
 *
 * MK-01 / PRM-01 / ROL-01 FIX:
 * This file extracts the role permission definitions from the mocks/ directory
 * into a proper static configuration module. The data is identical but lives
 * in the correct location (config/) rather than in mocks/ which implies
 * the data is only for development/testing.
 *
 * DESIGN DECISION: Permissions are statically defined because:
 *  1. No `role_permissions` table exists in the DB schema.
 *  2. The application uses a fixed role hierarchy (admin / staff / tenant / viewer).
 *  3. Changing permissions requires a code deploy (intentional — prevents accidental
 *     permission escalation via a UI bug).
 *
 * TO make permissions DB-backed in the future:
 *   1. Create a `role_permissions` table in a new migration.
 *   2. Re-generate src/types/supabase.ts.
 *   3. Replace the exports below with Supabase queries in permissionService.ts.
 */

export interface PermissionDefinition {
  permissionKey: string;
  module: string;
  description: string;
}

export interface RolePermissionConfig {
  permissions: PermissionDefinition[];
  roleMap: Record<string, string[]>;
}

export const ROLE_PERMISSION_CONFIG: RolePermissionConfig = {
  permissions: [
    { permissionKey: 'contract.view',    module: 'Contracts',  description: 'Xem hợp đồng' },
    { permissionKey: 'contract.create',  module: 'Contracts',  description: 'Tạo hợp đồng' },
    { permissionKey: 'contract.delete',  module: 'Contracts',  description: 'Xóa hợp đồng' },
    { permissionKey: 'invoice.view',     module: 'Invoices',   description: 'Xem hóa đơn' },
    { permissionKey: 'invoice.create',   module: 'Invoices',   description: 'Tạo hóa đơn' },
    { permissionKey: 'payment.view',     module: 'Payments',   description: 'Xem thanh toán' },
    { permissionKey: 'payment.approve',  module: 'Payments',   description: 'Duyệt thanh toán' },
    { permissionKey: 'room.view',        module: 'Rooms',      description: 'Xem phòng' },
    { permissionKey: 'ticket.view',      module: 'Tickets',    description: 'Xem ticket' },
    { permissionKey: 'ticket.view.all',  module: 'Tickets',    description: 'Xem tất cả ticket' },
    { permissionKey: 'meter.entry',      module: 'Meters',     description: 'Nhập đồng hồ' },
    { permissionKey: 'building.view',    module: 'Buildings',  description: 'Xem tòa nhà' },
    { permissionKey: 'building.manage',  module: 'Buildings',  description: 'Quản lý tòa nhà' },
    { permissionKey: 'tenant.view',      module: 'Tenants',    description: 'Xem cư dân' },
    { permissionKey: 'tenant.manage',    module: 'Tenants',    description: 'Quản lý cư dân' },
    { permissionKey: 'report.view',      module: 'Reports',    description: 'Xem báo cáo' },
    { permissionKey: 'service.manage',   module: 'Services',   description: 'Quản lý dịch vụ' },
    { permissionKey: 'pii.view',         module: 'Users',      description: 'Xem CCCD/SĐT' },
    { permissionKey: 'system.config',    module: 'System',     description: 'Cấu hình hệ thống' },
  ],
  roleMap: {
    Admin: [
      'contract.view', 'contract.create', 'contract.delete',
      'invoice.view', 'invoice.create', 'payment.view',
      'payment.approve', 'room.view', 'ticket.view',
      'ticket.view.all', 'meter.entry', 'report.view',
      'building.view', 'building.manage', 'tenant.view', 'tenant.manage',
      'service.manage', 'pii.view', 'system.config',
    ],
    Staff: [
      'contract.view', 'invoice.view', 'payment.view',
      'room.view', 'ticket.view', 'meter.entry', 'pii.view',
      'tenant.view', 'building.view',
    ],
    Viewer: ['contract.view', 'invoice.view', 'room.view', 'ticket.view', 'building.view'],
    Tenant: [],
  },
};
