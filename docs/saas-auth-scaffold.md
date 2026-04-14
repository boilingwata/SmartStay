# SaaS Auth Scaffold

## 4 cổng đăng nhập

- `Super Admin`: `/super-admin/login`
- `Owner`: `/owner/login`
- `Staff`: `/staff/login`
- `Tenant`: `/portal/login`

## Logic role hiện tại

- Tài khoản `admin` hiện tại được hiểu là workspace `Owner`.
- `Staff` và `Tenant` tiếp tục đi qua `profiles.role` trong schema `smartstay`.
- `SuperAdmin` đi qua `Supabase Auth` thật, tách riêng bằng `auth.users.raw_app_meta_data.workspace_role = 'super_admin'`.
- Khi đăng nhập, mỗi tài khoản sẽ được điều hướng thẳng vào layout đúng namespace:
  - `SuperAdmin` -> `/super-admin/dashboard`
  - `Owner` -> `/owner/dashboard`
  - `Staff` -> `/staff/dashboard`
  - `Tenant` -> `/portal/dashboard` hoặc flow tenant tương ứng

## Preview credentials

- Super Admin
  - Email: `superadmin@smartstay.vn`
  - Password: `SuperAdmin@123456`
- Owner
  - Email: `admin@smartstay.vn`
  - Password: `Admin@123456`
- Staff
  - Email: `staff@smartstay.vn`
  - Password: `Staff@123456`
- Tenant
  - Email: `tenant@smartstay.vn`
  - Password: `Tenant@123456`

## Ghi chú triển khai

- Edge Function `create-user` đã hỗ trợ tạo `super_admin`, `owner/admin`, `staff`, `tenant`.
- `create-user` đang để `verify_jwt = false` ở gateway và tự kiểm tra bearer token bên trong function bằng `requireAdminRole`.
- Cả 4 tài khoản trên đã được kiểm tra đăng nhập thành công trên project Supabase `yinmexhcbioiufienekk`.
