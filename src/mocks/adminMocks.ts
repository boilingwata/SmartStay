import { Room, RoomDetail } from '@/models/Room';
import { Asset } from '@/models/Asset';
import { BuildingSummary, BuildingDetail } from '@/models/Building';
import { User, RolePermissionMatrix } from '@/types';
import { TenantBalance, TenantBalanceTransaction } from '@/models/TenantBalance';
import { ContractDetail } from '@/models/Contract';

export const MOCK_USERS: User[] = [
  { 
    id: '1',
    fullName: "Nguyễn Văn Admin", 
    username: "admin",
    email: "admin@smartstay.vn", 
    role: "Admin", 
    isActive: true,
    isTwoFactorEnabled: true, 
    forceChangePassword: false,
    lastLoginAt: new Date().toISOString(), 
    buildingsAccess: [],
    createdAt: "2024-01-01" 
  },
  { 
    id: '2',
    fullName: "Trần Thị Staff", 
    username: "staff01",
    email: "staff01@smartstay.vn", 
    phone: "0901234567",
    role: "Staff", 
    isActive: true, 
    isTwoFactorEnabled: false,
    forceChangePassword: false,
    lastLoginAt: new Date(Date.now() - 3600000).toISOString(),
    buildingsAccess: ["B1"],
    createdAt: "2024-03-01" 
  },
  { 
    id: '3', 
    fullName: "Lê Văn Viewer", 
    username: "viewer01",
    email: "viewer01@smartstay.vn", 
    role: "Viewer",
    isActive: false, 
    isTwoFactorEnabled: false,
    forceChangePassword: true,
    lastLoginAt: undefined, 
    buildingsAccess: [],
    createdAt: "2024-06-01" 
  },
];

export const MOCK_ROLE_PERMISSIONS: RolePermissionMatrix = {
  permissions: [
    { permissionKey: "contract.view", module: "Contracts", description: "Xem hợp đồng" },
    { permissionKey: "contract.create", module: "Contracts", description: "Tạo hợp đồng" },
    { permissionKey: "contract.delete", module: "Contracts", description: "Xóa hợp đồng" },
    { permissionKey: "invoice.view", module: "Invoices", description: "Xem hóa đơn" },
    { permissionKey: "invoice.create", module: "Invoices", description: "Tạo hóa đơn" },
    { permissionKey: "payment.view", module: "Payments", description: "Xem thanh toán" },
    { permissionKey: "payment.approve", module: "Payments", description: "Duyệt thanh toán" },
    { permissionKey: "room.view", module: "Rooms", description: "Xem phòng" },
    { permissionKey: "ticket.view", module: "Tickets", description: "Xem ticket" },
    { permissionKey: "ticket.view.all", module: "Tickets", description: "Xem tất cả ticket" },
    { permissionKey: "meter.entry", module: "Meters", description: "Nhập đồng hồ" },
    { permissionKey: "building.view", module: "Buildings", description: "Xem tòa nhà" },
    { permissionKey: "building.manage", module: "Buildings", description: "Quản lý tòa nhà" },
    { permissionKey: "tenant.view", module: "Tenants", description: "Xem cư dân" },
    { permissionKey: "tenant.manage", module: "Tenants", description: "Quản lý cư dân" },
    { permissionKey: "report.view", module: "Reports", description: "Xem báo cáo" },
    { permissionKey: "service.manage", module: "Services", description: "Quản lý dịch vụ" },
    { permissionKey: "pii.view", module: "Users", description: "Xem CCCD/SĐT" },
    { permissionKey: "system.config", module: "System", description: "Cấu hình hệ thống" },
  ],
  roleMap: {
    Admin: ["contract.view","contract.create","contract.delete",
            "invoice.view","invoice.create","payment.view",
            "payment.approve","room.view","ticket.view",
            "ticket.view.all","meter.entry","report.view",
            "service.manage","pii.view","system.config"],
    Staff: ["contract.view","invoice.view","payment.view",
            "room.view","ticket.view","meter.entry","pii.view"],
    Viewer: ["contract.view","invoice.view","room.view","ticket.view"],
    Tenant: [],
  }
};

export const MOCK_BUILDINGS: BuildingSummary[] = [
  {
    id: 'B1',
    buildingCode: 'KN-LMD',
    buildingName: 'Keangnam Landmark',
    type: 'Apartment',
    address: 'Phạm Hùng, Mễ Trì, Nam Từ Liêm, Hà Nội',
    provinceId: '1',
    districtId: '101',
    wardId: '10101',
    yearBuilt: 2011,
    totalFloors: 72,
    managementPhone: '024 3333 3333',
    managementEmail: 'management@keangnam.com',
    latitude: 21.0173,
    longitude: 105.784,
    heroImageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    totalRooms: 1500,
    occupiedRooms: 1350,
    occupancyRate: 90,
    isDeleted: false
  },
  {
    id: 'B2',
    buildingCode: 'LT-CTR',
    buildingName: 'Lotte Center',
    type: 'Mixed',
    address: 'Liễu Giai, Ngọc Khánh, Ba Đình, Hà Nội',
    provinceId: '1',
    districtId: '102',
    wardId: '10201',
    yearBuilt: 2014,
    totalFloors: 65,
    managementPhone: '024 4444 4444',
    managementEmail: 'contact@lottehanoi.com',
    latitude: 21.034,
    longitude: 105.812,
    heroImageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80',
    totalRooms: 1200,
    occupiedRooms: 960,
    occupancyRate: 80,
    isDeleted: false
  },
  {
    id: 'B3',
    buildingCode: 'VN-PAR',
    buildingName: 'Vincom Park',
    type: 'Shophouse',
    address: 'Lê Thánh Tôn, Quận 1, TP. Hồ Chí Minh',
    provinceId: '79',
    districtId: '7901',
    wardId: '790101',
    yearBuilt: 2018,
    totalFloors: 45,
    managementPhone: '028 5555 5555',
    managementEmail: 'vincom@vinhomes.vn',
    latitude: 10.778,
    longitude: 106.702,
    heroImageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    totalRooms: 450,
    occupiedRooms: 315,
    occupancyRate: 70,
    isDeleted: false
  }
];

export const MOCK_ROOMS: Room[] = [
  {
    id: 'R001',
    roomCode: 'A-101',
    buildingId: 'B1',
    buildingName: 'Keangnam Landmark',
    floorNumber: 1,
    roomType: '2BR',
    areaSqm: 75.5,
    baseRentPrice: 15000000,
    status: 'Occupied',
    tenantNames: ['Nguyễn Văn A', 'Trần Thị B'],
    contractId: 'C001',
    hasMeter: true,
    thumbnailUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop'
  },
  {
    id: 'R002',
    roomCode: 'B-205',
    buildingId: 'B1',
    buildingName: 'Keangnam Landmark',
    floorNumber: 2,
    roomType: 'Studio',
    areaSqm: 35.0,
    baseRentPrice: 8500000,
    status: 'Vacant',
    hasMeter: true,
    thumbnailUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'
  },
  {
    id: 'R003',
    roomCode: 'C-309',
    buildingId: 'B1',
    buildingName: 'Keangnam Landmark',
    floorNumber: 3,
    roomType: '3BR',
    areaSqm: 110.0,
    baseRentPrice: 22000000,
    status: 'Maintenance',
    hasMeter: false,
    thumbnailUrl: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop'
  },
  {
    id: 'R004',
    roomCode: 'D-501',
    buildingId: 'B2',
    buildingName: 'Lotte Center',
    floorNumber: 5,
    roomType: 'Penthouse',
    areaSqm: 250.0,
    baseRentPrice: 55000000,
    status: 'Reserved',
    hasMeter: true,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop'
  }
];

export const MOCK_ASSETS: Asset[] = [
  { id: 'A1', assetName: 'Điều hòa Daikin', assetCode: 'AC-001', type: 'Appliance', condition: 'New', roomCode: 'A-101', purchaseDate: '2024-10-01', purchasePrice: 12000000, warrantyExpiry: '2026-10-01' },
  { id: 'A4', assetName: 'Máy giặt LG', assetCode: 'WM-001', type: 'Appliance', condition: 'Good', roomCode: 'B-205', purchaseDate: '2024-11-15', purchasePrice: 8500000, warrantyExpiry: '2025-11-15' },
  { id: 'A5', assetName: 'Quạt trần Panasonic', assetCode: 'CF-001', type: 'Fixture', condition: 'Good', purchaseDate: '2024-05-20', purchasePrice: 2500000, warrantyExpiry: '2025-05-20' },
];
