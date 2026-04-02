-- 1. Create RBAC Tables in smartstay schema
CREATE TABLE IF NOT EXISTS smartstay.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS smartstay.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    group_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS smartstay.role_permissions (
    role_id UUID REFERENCES smartstay.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES smartstay.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 2. Seed Default Roles
INSERT INTO smartstay.roles (name, description, is_system)
VALUES 
    ('Admin', 'Quyền quản trị toàn hệ thống', TRUE),
    ('Manager', 'Quản lý vận hành cấp cao', TRUE),
    ('Staff', 'Nhân viên vận hành', TRUE),
    ('Landlord', 'Chủ sở hữu tòa nhà', TRUE),
    ('Tenant', 'Cư dân thuê phòng', TRUE)
ON CONFLICT (name) DO NOTHING;

-- 3. Upgrade profiles table with Professional Identity fields
ALTER TABLE smartstay.profiles 
    ADD COLUMN IF NOT EXISTS identity_number VARCHAR(20),
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS gender smartstay.gender_type,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES smartstay.roles(id);

-- 4. Create Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON smartstay.profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_identity_number ON smartstay.profiles(identity_number);

-- 5. Data Migration: Map existing role Enum to new roles Table
UPDATE smartstay.profiles p
SET role_id = r.id
FROM smartstay.roles r
WHERE LOWER(p.role::text) = LOWER(r.name)
AND p.role_id IS NULL;

-- 6. Data Migration: Sync Identity Data from Tenants to Profiles
-- Lấy dữ liệu CCCD, Ngày sinh, Giới tính từ bảng Tenants (nguồn chuẩn) đổ vào Profiles
UPDATE smartstay.profiles p
SET 
    identity_number = t.id_number,
    date_of_birth = t.date_of_birth,
    gender = t.gender,
    address = t.permanent_address
FROM smartstay.tenants t
WHERE t.profile_id = p.id
AND p.identity_number IS NULL;

-- 7. Add Comment to Schema for future reference
COMMENT ON COLUMN smartstay.profiles.identity_number IS 'Số định danh cá nhân (CCCD/CMND)';
COMMENT ON COLUMN smartstay.profiles.role_id IS 'Khóa liên kết với hệ thống phân quyền động Roles';
