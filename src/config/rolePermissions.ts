/**
 * Static Role Permission Fallback
 *
 * PRM-01 / ROL-01 FIX:
 * This file contains the role permission definitions as a proper static
 * configuration module. The data lives in the correct location (config/)
 * to ensure production stability and logical separation from dynamic data.
 *
 * Fallback assumptions:
 *  1. DB-backed `role_permissions` exists; this file is a fallback only.
 *  2. The application uses a fixed canonical role hierarchy (super admin / owner / staff / tenant).
 *  3. Live permissions should be changed in the RBAC tables; this file keeps the
 *     UI usable if those tables are temporarily unavailable.
 *
 * `permissionService` reads DB-backed RBAC first and uses these values only if
 * the UI cannot load the live tables.
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
    { permissionKey: 'contract.view',    module: 'Hợp đồng', description: 'Xem hợp đồng' },
    { permissionKey: 'contract.create',  module: 'Hợp đồng', description: 'Tạo hợp đồng' },
    { permissionKey: 'contract.delete',  module: 'Hợp đồng', description: 'Xóa hợp đồng' },
    { permissionKey: 'invoice.view',     module: 'Hóa đơn', description: 'Xem hóa đơn' },
    { permissionKey: 'invoice.create',   module: 'Hóa đơn', description: 'Tạo hóa đơn' },
    { permissionKey: 'payment.view',     module: 'Thanh toán', description: 'Xem thanh toán' },
    { permissionKey: 'payment.approve',  module: 'Thanh toán', description: 'Duyệt thanh toán' },
    { permissionKey: 'room.view',        module: 'Phòng', description: 'Xem phòng' },
    { permissionKey: 'ticket.view',      module: 'Yêu cầu', description: 'Xem yêu cầu' },
    { permissionKey: 'ticket.view.all',  module: 'Yêu cầu', description: 'Xem tất cả yêu cầu' },
    { permissionKey: 'building.view',    module: 'Tòa nhà', description: 'Xem tòa nhà' },
    { permissionKey: 'building.manage',  module: 'Tòa nhà', description: 'Quản lý tòa nhà' },
    { permissionKey: 'tenant.view',      module: 'Cư dân', description: 'Xem cư dân' },
    { permissionKey: 'tenant.manage',    module: 'Cư dân', description: 'Quản lý cư dân' },
    { permissionKey: 'report.view',      module: 'Báo cáo', description: 'Xem báo cáo' },
    { permissionKey: 'service.manage',   module: 'Dịch vụ', description: 'Quản lý dịch vụ' },
    { permissionKey: 'pii.view',         module: 'Người dùng', description: 'Xem CCCD/SĐT' },
    { permissionKey: 'system.config',    module: 'Hệ thống', description: 'Cấu hình hệ thống' },
  ],
  roleMap: {
    SuperAdmin: [
      'contract.view', 'contract.create', 'contract.delete',
      'invoice.view', 'invoice.create', 'payment.view',
      'payment.approve', 'room.view', 'ticket.view',
      'ticket.view.all', 'report.view',
      'building.view', 'building.manage', 'tenant.view', 'tenant.manage',
      'service.manage', 'pii.view', 'system.config',
    ],
    Owner: [
      'contract.view', 'contract.create', 'contract.delete',
      'invoice.view', 'invoice.create', 'payment.view',
      'payment.approve', 'room.view', 'ticket.view',
      'ticket.view.all', 'report.view',
      'building.view', 'building.manage', 'tenant.view', 'tenant.manage',
      'service.manage', 'pii.view', 'system.config',
    ],
    Staff: [
      'contract.view', 'invoice.view', 'payment.view',
      'room.view', 'ticket.view', 'pii.view',
      'tenant.view', 'building.view',
    ],
    Tenant: [],
  },
};
