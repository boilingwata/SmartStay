# SmartStay System Activity Analysis

Ngày phân tích: 2026-04-18

## Phạm vi quét thực tế

- Quét live schema `smartstay` qua MCP Supabase.
- Quét live Edge Functions đang deploy trên project Supabase.
- Quét toàn bộ frontend trong `src/App.tsx`, `src/routes/*`, `src/views/*`, `src/components/*`, `src/services/*`, `src/stores/*`.
- Đối chiếu thêm các function local trong `supabase/functions/*` để xác nhận luồng backend thật đang được frontend gọi.

## Nguồn sự thật dùng để mô tả

- Database tables: `smartstay.*`
- Views: `smartstay.public_room_listings`, `smartstay.portal_payment_settings`
- Foreign keys, unique/check constraints, functions/RPC, triggers
- Edge Functions live: `create-owner`, `create-user`, `create-contract`, `create-utility-invoice`, `process-payment`, `adjust-balance`, `activate-resident`, `run-utility-billing`, `sepay-webhook`, `webhook-payment`
- Frontend routes, pages, forms, buttons, service calls

## Ghi chú rất quan trọng trước khi đọc activity diagram

- Hệ thống hiện không có backend server riêng. Backend thực tế là Supabase PostgREST + RPC + Edge Functions + Storage.
- Namespace admin thực tế đang mount ở `/owner/*`. Các đường dẫn `/admin/*`, `/rooms/*`, `/buildings/*` là redirect legacy.
- Module portal có rất nhiều màn hình và service thật, nhưng `src/App.tsx` hiện đang redirect toàn bộ `/portal/*` về `/listings`. Nghĩa là code portal tồn tại, nhưng runtime shell hiện tại chưa mount portal.
- Trong UI hiện có 2 khái niệm rất dễ nhầm:
- `Owner` trong workspace nội bộ tương ứng DB role `admin`.
- `Landlord` mới là hồ sơ chủ sở hữu bất động sản, lưu bằng `profiles.role='landlord'`.
- Tài liệu này mô tả đúng những gì đang có trong code và schema. Phần nào là stub, mock, route chưa mount, hoặc logic chưa hoàn tất đều được đánh dấu rõ.

## Bước 1: Tóm tắt quét hệ thống

### Actor thực tế

- Guest
- Tenant applicant
- Tenant resident
- Workspace Owner/Admin
- Staff
- SuperAdmin
- Landlord
- System
- Cron / Edge Function runner
- SePay
- MoMo

### Nhóm bảng chính đã xác nhận trong schema live

- Danh tính và phân quyền:
- `profiles`, `roles`, `permissions`, `role_permissions`, `notifications`, `audit_logs`, `system_settings`
- Bất động sản:
- `buildings`, `building_images`, `rooms`, `room_images`, `assets`, `room_assets`, `room_status_history`, `maintenance_logs`
- Khách thuê và hợp đồng:
- `tenants`, `rental_applications`, `contracts`, `contract_tenants`, `room_occupants`, `contract_services`, `contract_addendums`, `contract_renewals`, `contract_transfers`, `contract_terminations`
- Dịch vụ và tiện ích tính tiền:
- `services` (legacy), `service_catalog`, `service_prices`, `utility_policies`, `utility_policy_device_adjustments`
- Hóa đơn, thanh toán, công nợ:
- `invoices`, `invoice_items`, `invoice_utility_snapshots`, `invoice_utility_overrides`, `payments`, `payment_attempts`, `tenant_balances`, `balance_history`, `billing_runs`, `webhook_logs`
- Amenity:
- `amenity_catalog`, `amenity_policies`, `amenity_policy_versions`, `amenity_policy_notifications`, `amenity_booking_exceptions`, `amenity_bookings`, `amenity_booking_checkins`, `amenity_booking_charges`
- Hỗ trợ:
- `tickets`, `ticket_comments`

### Quan hệ dữ liệu quan trọng

- `buildings.owner_id -> profiles.id`
- `rooms.building_id -> buildings.id`
- `room_images.room_id -> rooms.id`
- `building_images.building_id -> buildings.id`
- `room_assets.asset_id -> assets.id`
- `room_assets.room_id -> rooms.id`
- `contracts.room_id -> rooms.id`
- `contracts.primary_tenant_id -> tenants.id`
- `contracts.utility_policy_id -> utility_policies.id`
- `contract_tenants.contract_id -> contracts.id`
- `contract_tenants.tenant_id -> tenants.id`
- `room_occupants.contract_id -> contracts.id`
- `room_occupants.tenant_id -> tenants.id`
- `contract_services.contract_id -> contracts.id`
- `contract_services.service_catalog_id -> service_catalog.id`
- `contract_addendums.contract_id -> contracts.id`
- `contract_transfers.old_contract_id/new_contract_id -> contracts.id`
- `invoices.contract_id -> contracts.id`
- `invoice_items.invoice_id -> invoices.id`
- `payments.invoice_id -> invoices.id`
- `payments.payment_attempt_id -> payment_attempts.id`
- `payment_attempts.invoice_id -> invoices.id`
- `tenant_balances.tenant_id -> tenants.id`
- `balance_history.tenant_id -> tenants.id`
- `balance_history.balance_id -> tenant_balances.id`
- `tickets.tenant_id -> tenants.id`
- `tickets.room_id -> rooms.id`
- `tickets.room_asset_id -> room_assets.id`
- `ticket_comments.ticket_id -> tickets.id`
- `amenity_bookings.tenant_id -> tenants.id`
- `amenity_bookings.amenity_id -> amenity_catalog.id`
- `amenity_booking_exceptions.policy_id -> amenity_policies.id`
- `amenity_policy_versions.policy_id -> amenity_policies.id`
- `amenity_policy_notifications.policy_id -> amenity_policies.id`

### Function / RPC live quan trọng

- `handle_new_user()`
- `create_contract_v2(...)`
- `add_contract_occupant(...)`
- `remove_contract_occupant(...)`
- `transfer_contract_representative(...)`
- `liquidate_contract(...)`
- `ensure_contract_tenant_balance()`
- `ensure_tenant_balance_record(...)`
- `adjust_balance(...)`
- `process_payment(...)`
- `approve_payment(...)`
- `apply_confirmed_payment(...)`
- `portal_record_invoice_payment(...)`
- `portal_mark_invoice_paid(...)`
- `portal_cancel_invoice(...)`
- `create_policy_utility_invoice(...)`
- `handle_sepay_webhook(...)`
- `handle_momo_ipn(...)`
- `create_room_asset_contract_addendum()`
- `sync_room_asset_billing_fields()`

### Trigger live quan trọng

- `auth.users` -> `smartstay.handle_new_user()`
- `contract_tenants` -> `ensure_contract_tenant_balance`
- `room_assets` -> `create_room_asset_contract_addendum`
- `room_assets` -> `sync_room_asset_billing_fields`
- nhiều trigger `trigger_set_updated_at` / `touch_*_updated_at` cho `profiles`, `buildings`, `rooms`, `contracts`, `invoices`, `utility_policies`, `amenity_*`, `tickets`, `payment_attempts`, `billing_runs`

### Màn hình đã quét nhưng không tách activity riêng

- Dashboard và report admin chỉ đọc dữ liệu: `MarketplaceDashboard`, `ReportsHub`, `OccupancyReport`, `FinancialReport`, `DebtReport`, `RoomLifecycleReport`, `NPSReport`, `StaffReport`, `AlertsReport`
- Các danh sách/detail đọc dữ liệu: `BuildingList`, `BuildingDetail`, `RoomList`, `RoomDetail`, `OwnerList`, `OwnerDetail`, `TenantList`, `TenantBalance`, `ContractList`, `ContractDetail` phần read-only, `InvoiceList`, `InvoiceDetail`, `PaymentList`, `PaymentDetail`, `WebhookLogs`, `AuditLogs`
- Portal read-only: dashboard tenant, balance detail, payment history, contract view, documents, FAQ, knowledge
- Các màn hình này vẫn được quét để rà logic, nhưng không tách activity riêng vì không tạo nghiệp vụ thay đổi trạng thái dữ liệu hoặc chỉ là tổng hợp truy vấn.

## PHẦN 1: DANH SÁCH ACTIVITY DIAGRAM

1. [AD-01] Đăng nhập workspace
2. [AD-02] Đăng xuất
3. [AD-03] Khám phá phòng public
4. [AD-04] Gửi quick inquiry cho phòng
5. [AD-05] Nộp đơn thuê phòng
6. [AD-06] Quản lý building
7. [AD-07] Quản lý ảnh building
8. [AD-08] Quản lý owner / landlord
9. [AD-09] Quản lý room
10. [AD-10] Quản lý ảnh room
11. [AD-11] Quản lý room asset
12. [AD-12] Quản lý service catalog và bảng giá
13. [AD-13] Quản lý tenant profile
14. [AD-14] Gửi notification trực tiếp cho profile
15. [AD-15] Quản lý user workspace
16. [AD-16] Gửi email reset password cho user
17. [AD-17] Quản lý role-permission matrix
18. [AD-18] Cập nhật system setting
19. [AD-19] Tạo hợp đồng
20. [AD-20] Thêm occupant vào hợp đồng
21. [AD-21] Xóa occupant khỏi hợp đồng
22. [AD-22] Chuyển người đại diện hợp đồng
23. [AD-23] Thanh lý hợp đồng
24. [AD-24] Tạo phụ lục hợp đồng thủ công
25. [AD-25] Tạo phụ lục hợp đồng tự động từ room asset
26. [AD-26] Quản lý utility policy
27. [AD-27] Quản lý utility override
28. [AD-28] Preview utility billing run
29. [AD-29] Chạy utility billing run
30. [AD-30] Tạo hóa đơn utility đơn lẻ
31. [AD-31] Tạo hóa đơn utility hàng loạt
32. [AD-32] Ghi nhận payment thủ công
33. [AD-33] Duyệt hoặc từ chối payment
34. [AD-34] Điều chỉnh số dư tenant
35. [AD-35] Xử lý webhook SePay
36. [AD-36] Xử lý webhook MoMo IPN
37. [AD-37] Tạo ticket
38. [AD-38] Bình luận / phân công / cập nhật ticket
39. [AD-39] Quản lý amenity policy
40. [AD-40] Duyệt amenity policy version
41. [AD-41] Tạo amenity exception
42. [AD-42] Queue amenity notification
43. [AD-43] Đặt chỗ tiện ích và hủy đặt chỗ
44. [AD-44] Đọc và đánh dấu notification
45. [AD-45] Cập nhật hồ sơ portal / avatar / mật khẩu / feedback
46. [AD-46] Kích hoạt resident onboarding
47. [AD-47] Gửi yêu cầu thanh toán hóa đơn từ tenant portal
48. [AD-48] Đánh dấu đã thanh toán hoặc hủy invoice

## PHẦN 2: CHI TIẾT TỪNG ACTIVITY DIAGRAM

### [TÊN ACTIVITY DIAGRAM]: [AD-01] Đăng nhập workspace

ACTOR:
- Guest
- Workspace Owner/Admin
- Staff
- SuperAdmin
- Tenant
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng nhập email và mật khẩu tại `/login`. (USER ACTION)
3. System gọi `supabase.auth.signInWithPassword({ email, password })`. (SYSTEM ACTION)
4. Nếu đăng nhập thành công, System xác định role:
- Nếu `workspace_role=super_admin` trong metadata -> dựng user từ metadata.
- Nếu không -> đọc `smartstay.profiles` theo `id = auth.user.id`.
5. Nếu user là tenant resident stage, System gọi thêm `portalOnboardingService.getStatusForProfile(userId)` để lấy `completionPercent`. (SYSTEM ACTION)
6. Zustand `authStore` lưu `user`, `role`, `isAuthenticated=true`. (SYSTEM ACTION)
7. Router xác định trang đích bằng `getAuthenticatedHomePath()`:
- `Owner|Staff|SuperAdmin` -> `/owner/dashboard`
- `Tenant` -> `/listings`
8. Kết thúc

X. System kiểm tra:
- Nếu `supabase.auth.signInWithPassword` trả lỗi -> dừng flow.
- Nếu không tìm thấy `profiles` cho non-super-admin -> dừng flow.
- Nếu form login có `allowedRoles` và `profile.role` không nằm trong danh sách -> System `signOut()` ngay và báo lỗi.

N. Nếu hợp lệ:
- System thực hiện:
- `SELECT smartstay.profiles`
- Có thể `SELECT smartstay.tenants`, `SELECT smartstay.contract_tenants`, `SELECT smartstay.contracts` gián tiếp qua `portalOnboardingService`
- Ghi local state vào `authStore`

Kết thúc:
- UI chuyển người dùng sang trang đích.
- Session được giữ bởi Supabase Auth.

LUỒNG PHỤ:
- A1. Sai email hoặc mật khẩu:
- Điều kiện lỗi: Supabase Auth trả lỗi.
- Hành động xử lý: UI hiện thông báo đăng nhập thất bại.
- Kết thúc
- A2. Người dùng không đúng workspace:
- Điều kiện lỗi: `allowedRoles` không chứa role thực tế.
- Hành động xử lý: System `signOut()` rồi hiện lỗi role không hợp lệ.
- Kết thúc

GHI CHÚ:
- Không có transaction DB do đây là flow xác thực.
- Trigger `auth.users -> handle_new_user()` không chạy ở bước login, chỉ chạy khi tạo user mới.

### [TÊN ACTIVITY DIAGRAM]: [AD-02] Đăng xuất

ACTOR:
- Workspace user
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng bấm nút logout. (USER ACTION)
3. System gọi `supabase.auth.signOut()`. (SYSTEM ACTION)
4. Zustand `authStore` xóa `user`, `role`, `isAuthenticated`, `authMode`. (SYSTEM ACTION)
5. System xóa `smartstay-auth-storage` khỏi `localStorage`. (SYSTEM ACTION)
6. Kết thúc

Kết thúc:
- UI trở về trạng thái chưa đăng nhập.

LUỒNG PHỤ:
- A1. `signOut()` lỗi:
- Điều kiện lỗi: Supabase Auth trả lỗi.
- Hành động xử lý: System vẫn clear local auth state ở `finally`.
- Kết thúc
- A2. Người dùng hủy:
- Không có vì logout là thao tác một chạm.

GHI CHÚ:
- Không tác động bảng `smartstay.*`.

### [TÊN ACTIVITY DIAGRAM]: [AD-03] Khám phá phòng public

ACTOR:
- Guest
- Tenant
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở `/listings` hoặc `/listings/:id`. (USER ACTION)
3. System gọi `publicListingsService.getListings()` hoặc `getListingDetail(roomId)`. (SYSTEM ACTION)
4. Service đọc view `smartstay.public_room_listings`. (SYSTEM ACTION)
5. UI hiển thị các trường từ view:
- `room_code`, `room_type`, `area_sqm`, `base_rent`, `max_occupants`
- `building_name`, `building_address`, `building_description`
- `availability_status`, `room_amenities`, `building_amenities`
6. Người dùng nhập search, chọn sort/filter. (USER ACTION)
7. UI lọc và sắp xếp trên bộ nhớ client; không ghi database. (SYSTEM ACTION)
8. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `SELECT smartstay.public_room_listings`

Kết thúc:
- UI hiển thị danh sách hoặc chi tiết phòng.

LUỒNG PHỤ:
- A1. View lỗi hoặc không trả dữ liệu:
- Điều kiện lỗi: query vào `public_room_listings` thất bại.
- Hành động xử lý: service trả `[]` hoặc `null`, UI hiển thị trạng thái rỗng.
- Kết thúc
- A2. Người dùng rời trang:
- Kết thúc

GHI CHÚ:
- Đây là flow read-only.
- `public_room_listings` là `VIEW`, không phải table thường.

### [TÊN ACTIVITY DIAGRAM]: [AD-04] Gửi quick inquiry cho phòng

ACTOR:
- Guest
- Tenant
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở `QuickInquiryModal` tại trang chi tiết phòng. (USER ACTION)
3. Người dùng nhập `name`, `phone`, `message`. (USER ACTION)
4. UI gọi `publicListingsService.submitInquiry(roomId, data)`. (SYSTEM ACTION)
5. Service ném lỗi ngay vì schema hiện tại không có `smartstay.room_inquiries`. (SYSTEM ACTION)
6. UI hiện toast lỗi. (SYSTEM ACTION)
7. Kết thúc

X. System kiểm tra:
- Nếu thiếu bất kỳ field nào phía form -> UI chặn submit.
- Nếu service bị gọi thành công -> luôn dừng ở lỗi feature stub.

N. Nếu hợp lệ:
- Không có thao tác DB thật sự.

Kết thúc:
- System trả lỗi: tính năng chưa được kích hoạt.
- UI không lưu dữ liệu nào.

LUỒNG PHỤ:
- A1. Lỗi nghiệp vụ:
- Điều kiện lỗi: `room_inquiries` không tồn tại trong schema live.
- Hành động xử lý: service throw error thân thiện cho người dùng.
- Kết thúc
- A2. Người dùng đóng modal:
- Kết thúc

GHI CHÚ:
- Không có `INSERT/UPDATE/DELETE`.
- Đây là UI có thật nhưng backend chưa tồn tại.

### [TÊN ACTIVITY DIAGRAM]: [AD-05] Nộp đơn thuê phòng

ACTOR:
- Tenant applicant
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở `/listings/:id/apply`. (USER ACTION)
3. Nếu chưa đăng nhập, UI yêu cầu login/register trước. (SYSTEM ACTION)
4. Người dùng nhập:
- `fullName`, `phone`, `email`
- `preferredMoveIn`
- `verificationMethod`
- `verificationValue`
- `notes`
5. UI gọi `publicListingsService.submitApplication(roomId, form)`. (SYSTEM ACTION)
6. Service đọc `smartstay.profiles` của user hiện tại để kiểm tra role và `tenant_stage`. (SYSTEM ACTION)
7. Service tìm đơn mở cùng `profile_id + room_id` với status `draft|submitted|under_review`. (SYSTEM ACTION)
8. Nếu đã có đơn mở, System `UPDATE smartstay.rental_applications`. (SYSTEM ACTION)
9. Nếu chưa có đơn mở, System `INSERT smartstay.rental_applications`. (SYSTEM ACTION)
10. Nếu `profiles.tenant_stage != 'applicant'`, System `UPDATE smartstay.profiles SET tenant_stage='applicant'`. (SYSTEM ACTION)
11. UI cập nhật local auth user sang `tenantStage='applicant'`. (SYSTEM ACTION)
12. Kết thúc

X. System kiểm tra:
- Nếu user chưa đăng nhập -> không cho nộp đơn.
- Nếu `profiles.role != 'tenant'` -> từ chối.
- Nếu `tenant_stage` là `resident_active` hoặc `resident_pending_onboarding` -> từ chối.

N. Nếu hợp lệ:
- System thực hiện:
- `SELECT smartstay.profiles`
- `SELECT smartstay.rental_applications`
- `INSERT smartstay.rental_applications` hoặc `UPDATE smartstay.rental_applications`
- `UPDATE smartstay.profiles`

Kết thúc:
- UI báo nộp đơn thành công.
- Đơn ở trạng thái `submitted`.

LUỒNG PHỤ:
- A1. Đơn thuê không hợp lệ:
- Điều kiện lỗi: role không phải tenant hoặc tenant đã là resident.
- Hành động xử lý: service throw error, UI hiển thị chặn flow.
- Kết thúc
- A2. Người dùng thoát form:
- Kết thúc

GHI CHÚ:
- Chưa tìm thấy flow admin duyệt / từ chối `rental_applications` trong code hiện tại.

### [TÊN ACTIVITY DIAGRAM]: [AD-06] Quản lý building

ACTOR:
- Workspace Owner/Admin
- Staff
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở modal tạo building hoặc trang detail building. (USER ACTION)
3. Người dùng nhập/cập nhật:
- `buildingName`, `address`, `description`
- `amenities`, `totalFloors`
- `latitude`, `longitude`
4. UI gọi `buildingService.createBuilding()` hoặc `updateBuilding()`. (SYSTEM ACTION)
5. Nếu xóa building, UI gọi `buildingService.deleteBuilding(id)`. (SYSTEM ACTION)
6. Kết thúc

X. System kiểm tra:
- Nếu `name` trùng bản ghi chưa xóa mềm khi chạy `checkBuildingCodeUnique()` -> UI có thể chặn tạo.
- Nếu xóa -> đây là soft delete, không xóa vật lý.

N. Nếu hợp lệ:
- System thực hiện:
- `INSERT smartstay.buildings`
- hoặc `UPDATE smartstay.buildings`
- hoặc `UPDATE smartstay.buildings SET is_deleted=true`
- Trigger `trg_buildings_updated` cập nhật `updated_at`

Kết thúc:
- UI refresh danh sách/detail building.

LUỒNG PHỤ:
- A1. Lỗi constraint:
- Điều kiện lỗi: dữ liệu bắt buộc thiếu hoặc DB trả lỗi.
- Hành động xử lý: UI hiện lỗi lưu building.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- `buildingCode` trong UI là mã dẫn xuất từ `id`, không có cột riêng trong DB.

### [TÊN ACTIVITY DIAGRAM]: [AD-07] Quản lý ảnh building

ACTOR:
- Workspace Owner/Admin
- Staff
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng chọn một hoặc nhiều file ảnh tại `BuildingDetail`. (USER ACTION)
3. UI gọi `fileService.uploadFile(file, file.name)` cho từng ảnh. (SYSTEM ACTION)
4. `fileService` kiểm tra:
- MIME thuộc `image/jpeg|image/png|image/webp`
- magic bytes hợp lệ
- kích thước <= 2MB
- không vượt rate limit 5 file/phút
5. Nếu upload thành công, file được lưu vào bucket `smartstay-files`, System lấy public URL. (SYSTEM ACTION)
6. UI gọi `buildingService.addBuildingImage(buildingId, url, isMain)`. (SYSTEM ACTION)
7. Nếu người dùng đặt ảnh đại diện, System:
- `UPDATE smartstay.building_images SET is_main=false WHERE building_id=?`
- `UPDATE smartstay.building_images SET is_main=true WHERE id=?`
8. Nếu người dùng xóa ảnh, System `DELETE smartstay.building_images WHERE id=?`. (SYSTEM ACTION)
9. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `INSERT storage object vào bucket smartstay-files`
- `INSERT smartstay.building_images`
- hoặc `UPDATE smartstay.building_images`
- hoặc `DELETE smartstay.building_images`

Kết thúc:
- UI reload gallery ảnh building.

LUỒNG PHỤ:
- A1. Upload bị chặn:
- Điều kiện lỗi: MIME sai, chữ ký file sai, quá 2MB, hoặc quá rate limit.
- Hành động xử lý: `fileService` throw error, UI hiện toast.
- Kết thúc
- A2. Người dùng đóng dialog upload:
- Kết thúc

GHI CHÚ:
- Không có transaction bao trùm storage + DB.
- Service `buildingService.uploadBuildingImage()` là mock và không phải luồng đang dùng trong view hiện tại.

### [TÊN ACTIVITY DIAGRAM]: [AD-08] Quản lý owner / landlord

ACTOR:
- Workspace Owner/Admin
- Staff
- Landlord
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở form tạo hoặc sửa owner. (USER ACTION)
3. Khi tạo mới, người dùng nhập:
- `fullName`, `email`, `phone`
- `cccd`, `taxCode`, `address`, `avatarUrl`
4. UI gọi Edge Function `create-owner`. (SYSTEM ACTION)
5. Edge Function kiểm tra caller có quyền admin/manager. (SYSTEM ACTION)
6. Edge Function gọi `auth.admin.createUser(email_confirm=true)`. (SYSTEM ACTION)
7. Edge Function `UPSERT smartstay.profiles` với:
- `id = auth.users.id`
- `full_name`, `phone`, `avatar_url`
- `role='landlord'`
- `is_active=true`
8. Khi sửa owner, UI gọi `buildingService.updateOwner(id, data)`. (SYSTEM ACTION)
9. Service đọc `profiles.preferences` hiện tại, merge:
- `cccd`, `tax_code`, `address`, `email`
10. Service `UPDATE smartstay.profiles`. (SYSTEM ACTION)
11. Kết thúc

X. System kiểm tra:
- Nếu email không hợp lệ -> từ chối.
- Nếu `auth.admin.createUser` báo `already registered` -> từ chối.
- Nếu lưu `profiles` lỗi sau khi tạo auth user -> rollback xóa auth user.

N. Nếu hợp lệ:
- System thực hiện:
- `INSERT auth.users`
- `UPSERT smartstay.profiles`
- Khi cập nhật: `UPDATE smartstay.profiles`
- Trigger `trg_profiles_updated` cập nhật `updated_at`

Kết thúc:
- UI refresh danh sách/detail owner.

LUỒNG PHỤ:
- A1. Tạo auth user thành công nhưng upsert profile lỗi:
- Hành động xử lý: Edge Function `deleteUser(userId)` rollback.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- Tạo owner mới hiện chưa lưu `cccd`, `taxCode`, `address` vào DB trong cùng flow tạo; các field này chỉ được persist khi chạy `updateOwner()`.
- Đây là chỗ cần lưu ý khi convert sang activity chính xác.

### [TÊN ACTIVITY DIAGRAM]: [AD-09] Quản lý room

ACTOR:
- Workspace Owner/Admin
- Staff
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở form tạo hoặc sửa room. (USER ACTION)
3. Người dùng nhập/cập nhật:
- `buildingId`, `roomCode`, `floorNumber`
- `areaSqm`, `roomType`, `maxOccupancy`
- `hasBalcony`, `directionFacing`, `amenities`
- `baseRentPrice`, `conditionScore`, `status`
4. UI gọi `roomService.createRoom()` hoặc `updateRoom()`. (SYSTEM ACTION)
5. Nếu xóa phòng, UI gọi `roomService.deleteRoom(id)`. (SYSTEM ACTION)
6. Kết thúc

X. System kiểm tra:
- `buildingId` phải là số nguyên dương.
- `room_code` phải duy nhất theo cặp `(building_id, room_code)`.
- Check constraints DB:
- `area_sqm > 0`
- `base_rent >= 0`
- `condition_score between 1 and 10`
- `max_occupants > 0`

N. Nếu hợp lệ:
- System thực hiện:
- `INSERT smartstay.rooms`
- hoặc `UPDATE smartstay.rooms`
- hoặc `UPDATE smartstay.rooms SET is_deleted=true`
- Trigger `trg_rooms_updated` cập nhật `updated_at`

Kết thúc:
- UI refresh room list/detail.

LUỒNG PHỤ:
- A1. Trùng mã phòng:
- Điều kiện lỗi: unique `uq_room_building_code`.
- Hành động xử lý: UI hiện lỗi mã phòng đã tồn tại.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- Không tìm thấy luồng ghi `smartstay.room_status_history` khi đổi status phòng trong code hiện tại.

### [TÊN ACTIVITY DIAGRAM]: [AD-10] Quản lý ảnh room

ACTOR:
- Workspace Owner/Admin
- Staff
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng chọn ảnh tại `RoomDetail`. (USER ACTION)
3. UI gọi `fileService.uploadFile()` cho từng file. (SYSTEM ACTION)
4. Nếu upload thành công, UI gọi `roomService.addRoomImage(roomId, url, isMain)`. (SYSTEM ACTION)
5. Nếu đặt ảnh chính, System reset `is_main=false` cho ảnh cùng phòng rồi set ảnh mới `is_main=true`. (SYSTEM ACTION)
6. Nếu xóa ảnh, System `DELETE smartstay.room_images WHERE id=?`. (SYSTEM ACTION)
7. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- upload object vào bucket `smartstay-files`
- `INSERT smartstay.room_images`
- hoặc `UPDATE smartstay.room_images`
- hoặc `DELETE smartstay.room_images`

Kết thúc:
- UI reload gallery ảnh phòng.

LUỒNG PHỤ:
- A1. Upload lỗi:
- Điều kiện lỗi: file bị chặn bởi `fileService`.
- Hành động xử lý: UI hiện toast lỗi.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- Cùng cơ chế storage với ảnh building.

### [TÊN ACTIVITY DIAGRAM]: [AD-11] Quản lý room asset

ACTOR:
- Workspace Owner/Admin
- Staff
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở Asset Catalog hoặc Room Detail. (USER ACTION)
3. Nếu tạo asset mới, người dùng nhập:
- `assetName`, `assetCode`, `type`
- `purchasePrice`, `brand`, `model`
- dữ liệu gán phòng và billing nếu có
4. Nếu chưa có `assetId`, service `INSERT smartstay.assets`. (SYSTEM ACTION)
5. Service `INSERT smartstay.room_assets`. (SYSTEM ACTION)
6. Nếu gán asset có sẵn vào phòng, service `UPDATE smartstay.room_assets`:
- `room_id`, `assigned_at`
- `is_billable`, `monthly_charge`
- `billing_label`, `billing_start_date`, `billing_end_date`
- `billing_status`, `billing_notes`
7. Nếu sửa asset, service `UPDATE smartstay.room_assets`, và nếu metadata định nghĩa asset đổi thì `UPDATE smartstay.assets`. (SYSTEM ACTION)
8. Nếu xóa, service `DELETE smartstay.room_assets`. (SYSTEM ACTION)
9. Kết thúc

X. System kiểm tra:
- Nếu `condition='Poor'` và asset vẫn billable -> service tự chuyển `billing_status='suspended'` và set `broken_reported_at`.
- Nếu asset billable thay đổi trong hợp đồng active/pending -> trigger addendum có thể chạy.

N. Nếu hợp lệ:
- System thực hiện:
- `INSERT smartstay.assets` nếu là asset definition mới
- `INSERT/UPDATE/DELETE smartstay.room_assets`
- Có thể `UPDATE smartstay.assets`
- Trigger `trg_room_assets_sync_billing_fields`
- Trigger `trg_room_assets_create_addendum`

Kết thúc:
- UI refresh asset list/detail.

LUỒNG PHỤ:
- A1. Dữ liệu billing lỗi:
- Điều kiện lỗi: DB reject hoặc logic mapping status lỗi.
- Hành động xử lý: UI hiện lỗi lưu asset.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- Flow này có side effect tạo `contract_addendums` tự động qua trigger, nhưng việc tạo phụ lục là flow riêng ở AD-25.

### [TÊN ACTIVITY DIAGRAM]: [AD-12] Quản lý service catalog và bảng giá

ACTOR:
- Workspace Owner/Admin
- Staff
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng tạo service hoặc sửa service hiện có. (USER ACTION)
3. Người dùng nhập:
- `serviceCode`, `serviceName`
- `unit`, `billingMethod`, `description`
- `isActive`
- `initialPrice` hoặc `newPrice`, `effectiveFrom`
4. Nếu tạo mới, service `INSERT smartstay.service_catalog`. (SYSTEM ACTION)
5. Sau khi tạo service mới, service `INSERT smartstay.service_prices` với bản giá active đầu tiên. (SYSTEM ACTION)
6. Nếu sửa thông tin service, service `UPDATE smartstay.service_catalog`. (SYSTEM ACTION)
7. Nếu đổi trạng thái active, service `UPDATE smartstay.service_catalog.is_active`. (SYSTEM ACTION)
8. Nếu cập nhật giá, service:
- `UPDATE smartstay.service_prices SET effective_to=?, is_active=false` cho bản giá hiện tại
- `INSERT smartstay.service_prices` với giá mới và `is_active=true`
9. Kết thúc

X. System kiểm tra:
- `service_catalog.code` phải unique.
- Tên/code có thể được UI kiểm tra trước bằng `checkServiceNameUnique()` và `checkServiceCodeUnique()`.
- `service_prices.unit_price >= 0`
- `effective_to` phải null hoặc > `effective_from`

N. Nếu hợp lệ:
- System thực hiện:
- `INSERT/UPDATE smartstay.service_catalog`
- `INSERT/UPDATE smartstay.service_prices`

Kết thúc:
- UI refresh service list và price history.

LUỒNG PHỤ:
- A1. Trùng code hoặc tên:
- Hành động xử lý: UI hiện lỗi, không lưu.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- Đọc dữ liệu hiện vẫn có fallback sang bảng legacy `services`, nhưng các thao tác ghi mới đều vào `service_catalog` và `service_prices`.

### [TÊN ACTIVITY DIAGRAM]: [AD-13] Quản lý tenant profile

ACTOR:
- Workspace Owner/Admin
- Staff
- Tenant
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng tạo tenant mới hoặc sửa tenant hiện có. (USER ACTION)
3. Người dùng nhập/cập nhật:
- `fullName`, `phone`, `email`, `cccd`
- `dateOfBirth`, `gender`, `permanentAddress`
- `nationality`, `occupation`, `vehiclePlates`
- `avatarUrl`, `cccdFrontUrl`, `cccdBackUrl`
- `cccdIssuedDate`, `cccdIssuedPlace`
4. Khi tạo mới, service chuẩn hóa `cccd` và gọi `checkIdNumberExists()`. (SYSTEM ACTION)
5. Nếu CCCD chưa tồn tại, service `INSERT smartstay.tenants`. (SYSTEM ACTION)
6. Documents phụ được gộp vào JSON `tenants.documents`. (SYSTEM ACTION)
7. Khi cập nhật, service đọc `documents` hiện tại rồi merge field mới. (SYSTEM ACTION)
8. Service `UPDATE smartstay.tenants`. (SYSTEM ACTION)
9. Kết thúc

X. System kiểm tra:
- `tenants.id_number` phải unique.
- Nếu CCCD thuộc tenant đã xóa mềm -> chặn và yêu cầu khôi phục hồ sơ.
- Nếu cập nhật CCCD sang giá trị đã có ở tenant khác -> chặn.

N. Nếu hợp lệ:
- System thực hiện:
- `INSERT smartstay.tenants`
- hoặc `UPDATE smartstay.tenants`
- Trigger `trg_tenants_updated` cập nhật `updated_at`

Kết thúc:
- UI refresh detail tenant.

LUỒNG PHỤ:
- A1. Trùng CCCD hoặc phone:
- Hành động xử lý: service throw lỗi cụ thể, UI hiện toast.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- Các tab `Feedback`, `NPS`, `Contact groups` trong tenant service hiện là stub, không có table hỗ trợ.

### [TÊN ACTIVITY DIAGRAM]: [AD-14] Gửi notification trực tiếp cho profile

ACTOR:
- Workspace Owner/Admin
- Staff
- Tenant
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở form gửi thông báo từ Tenant Detail hoặc UI tương tự. (USER ACTION)
3. Người dùng nhập `title`, `message`, có thể kèm `type`, `link`. (USER ACTION)
4. UI gọi `notificationService.sendToProfile({ profileId, title, message, type, link })`. (SYSTEM ACTION)
5. Service lấy `created_by` từ session hiện tại. (SYSTEM ACTION)
6. Service `INSERT smartstay.notifications`. (SYSTEM ACTION)
7. Nếu tenant đang subscribe realtime, channel `notifications:{profileId}` nhận insert mới. (SYSTEM ACTION)
8. Kết thúc

X. System kiểm tra:
- Nếu bảng `notifications` không tồn tại -> service throw error.
- `title` và `message` được trim trước khi insert.

N. Nếu hợp lệ:
- System thực hiện:
- `INSERT smartstay.notifications`

Kết thúc:
- UI gửi thành công.
- Bên người nhận có thể thấy badge unread tăng.

LUỒNG PHỤ:
- A1. Thiếu bảng notifications:
- Hành động xử lý: service báo schema hiện tại chưa có bảng `notifications`.
- Kết thúc
- A2. Người dùng đóng form:
- Kết thúc

GHI CHÚ:
- Admin `NotificationPage` riêng là mock UI; luồng gửi thật hiện đi qua `notificationService.sendToProfile()`.

### [TÊN ACTIVITY DIAGRAM]: [AD-15] Quản lý user workspace

ACTOR:
- Workspace Owner/Admin
- SuperAdmin
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở `UserModal` để tạo hoặc sửa user workspace. (USER ACTION)
3. Form thu thập:
- `fullName`, `username`, `email`, `phone`
- `roleId`, `role`, `buildingsAccess`
- `identityNumber`, `dateOfBirth`, `gender`, `address`
- `avatar`, `isActive`, `forceChangePassword`
4. Nếu tạo mới, UI gọi `userService.createUser(formData)`. (SYSTEM ACTION)
5. Service gọi Edge Function `create-user`. (SYSTEM ACTION)
6. Edge Function kiểm tra admin role, tạo `auth.users`, rồi `UPSERT smartstay.profiles`. (SYSTEM ACTION)
7. Nếu sửa user, service `UPDATE smartstay.profiles` và merge `preferences`. (SYSTEM ACTION)
8. Nếu disable/xóa mềm user, service `UPDATE smartstay.profiles SET is_active=false`. (SYSTEM ACTION)
9. Khi edit user từ modal settings, UI gọi thêm `auditService.logAction(...)`. (SYSTEM ACTION)
10. Kết thúc

X. System kiểm tra:
- `username` phải >= 3 ký tự hợp lệ.
- `email` phải hợp lệ.
- Nếu email đã đăng ký -> Edge Function trả `409`.
- Nếu role create không thuộc `admin|staff|tenant|super_admin` -> Edge Function từ chối.

N. Nếu hợp lệ:
- System thực hiện:
- `INSERT auth.users`
- `UPSERT smartstay.profiles`
- hoặc `UPDATE smartstay.profiles`
- `INSERT smartstay.audit_logs` khi edit từ `UserModal`

Kết thúc:
- UI refresh danh sách user.

LUỒNG PHỤ:
- A1. Tạo auth user xong nhưng upsert profile lỗi:
- Hành động xử lý: Edge Function xóa auth user để rollback.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- `create-user` hiện không persist `roleId`, `identityNumber`, `dateOfBirth`, `gender`, `address` dù UI/service gửi các field này; đây là lệch logic thật trong code.

### [TÊN ACTIVITY DIAGRAM]: [AD-16] Gửi email reset password cho user

ACTOR:
- Workspace Owner/Admin
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng chọn một user và bấm gửi email reset password. (USER ACTION)
3. UI gọi `userService.sendResetPasswordEmail(userId)`. (SYSTEM ACTION)
4. Service đọc user qua `getUserById(userId)` để lấy email. (SYSTEM ACTION)
5. Service gọi `supabase.auth.resetPasswordForEmail(user.email, { redirectTo: window.origin + '/reset-password' })`. (SYSTEM ACTION)
6. Kết thúc

X. System kiểm tra:
- Nếu user không có email -> từ chối.
- Nếu Supabase Auth trả lỗi -> từ chối.

N. Nếu hợp lệ:
- System thực hiện:
- `SELECT smartstay.profiles`
- gọi Supabase Auth reset email flow

Kết thúc:
- User nhận email reset password.

LUỒNG PHỤ:
- A1. User không có email:
- Hành động xử lý: UI hiện lỗi.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- Hàm `userService.resetPassword()` local hiện là stub; luồng thật là gửi email reset.

### [TÊN ACTIVITY DIAGRAM]: [AD-17] Quản lý role-permission matrix

ACTOR:
- Workspace Owner/Admin
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở `PermissionMatrix`. (USER ACTION)
3. UI tải:
- `smartstay.roles`
- `smartstay.permissions`
- `smartstay.role_permissions`
4. Người dùng bật/tắt permission cho từng role trong local state. (USER ACTION)
5. Người dùng bấm lưu. (USER ACTION)
6. Với mỗi role, UI gọi `roleService.updateRolePermissions(roleId, permissionCodes)`. (SYSTEM ACTION)
7. Service đọc `permissions.id` theo `code`. (SYSTEM ACTION)
8. Service `DELETE smartstay.role_permissions WHERE role_id=?`. (SYSTEM ACTION)
9. Service `INSERT smartstay.role_permissions` cho tập quyền mới. (SYSTEM ACTION)
10. Kết thúc

X. System kiểm tra:
- Nếu `permission.code` không map được sang `permissions.id` -> mapping đó không được insert.

N. Nếu hợp lệ:
- System thực hiện:
- `SELECT smartstay.roles`
- `SELECT smartstay.permissions`
- `SELECT smartstay.role_permissions`
- `DELETE smartstay.role_permissions`
- `INSERT smartstay.role_permissions`

Kết thúc:
- Matrix quyền được lưu.

LUỒNG PHỤ:
- A1. Lỗi lưu một role:
- Hành động xử lý: UI hiện lỗi; role khác có thể đã lưu trước đó.
- Kết thúc
- A2. Người dùng thoát trang:
- Kết thúc

GHI CHÚ:
- Luồng hiện không dùng transaction bao trùm toàn bộ matrix nhiều role.

### [TÊN ACTIVITY DIAGRAM]: [AD-18] Cập nhật system setting

ACTOR:
- Workspace Owner/Admin
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở `SystemSettings`. (USER ACTION)
3. UI tải `smartstay.system_settings`. (SYSTEM ACTION)
4. Người dùng chỉnh `value` của một setting theo `key`. (USER ACTION)
5. UI gọi `systemService.updateSetting(key, value)`. (SYSTEM ACTION)
6. Service `UPDATE smartstay.system_settings`. (SYSTEM ACTION)
7. Trigger `trg_system_settings_updated` cập nhật `updated_at`. (SYSTEM ACTION)
8. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `UPDATE smartstay.system_settings`

Kết thúc:
- UI hiển thị giá trị cấu hình mới.

LUỒNG PHỤ:
- A1. Key không tồn tại:
- Điều kiện lỗi: `UPDATE` không match dòng hoặc DB trả lỗi.
- Hành động xử lý: UI hiện lỗi lưu setting.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- `portal_payment_settings` là view đọc phụ, không phải bảng để update trực tiếp.

### [TÊN ACTIVITY DIAGRAM]: [AD-19] Tạo hợp đồng

ACTOR:
- Workspace Owner/Admin
- Staff
- Tenant
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở `CreateContractWizard`. (USER ACTION)
3. Người dùng đi qua 4 bước:
- Chọn building, room, primary tenant, occupants
- Nhập term: `startDate`, `endDate`, `rentPrice`, `depositAmount`, `paymentCycle`, `paymentDueDay`
- Chọn `utilityPolicyId`, `selectedServices`
- Xác nhận
4. UI kiểm tra sớm hợp đồng chồng lấn theo `room_id + khoảng ngày`. (SYSTEM ACTION)
5. UI gọi `contractService.createContract(data)`. (SYSTEM ACTION)
6. Nếu `VITE_USE_EDGE_FUNCTIONS=true`, service gọi Edge Function `create-contract`. (SYSTEM ACTION)
7. Nếu không, service gọi RPC `create_contract_v2(...)`. (SYSTEM ACTION)
8. Function/RPC thực hiện:
- `INSERT smartstay.contracts`
- `INSERT smartstay.contract_tenants` cho primary tenant
- `INSERT smartstay.room_occupants` cho primary tenant và occupants bổ sung
- `INSERT smartstay.contract_services` cho các service được chọn
- `UPDATE smartstay.rooms SET status='occupied'`
9. Trigger trên `contract_tenants` đảm bảo có `tenant_balances`. (SYSTEM ACTION)
10. Kết thúc

X. System kiểm tra:
- Nếu đã tồn tại contract `active|pending_signature` cùng phòng chồng lấn khoảng ngày -> từ chối.
- `roomId`, `primaryTenantId` phải là số hợp lệ.
- RPC mới yêu cầu `occupants_for_billing > 0` gián tiếp qua dữ liệu occupant/primary.

N. Nếu hợp lệ:
- System thực hiện:
- `INSERT smartstay.contracts`
- `INSERT smartstay.contract_tenants`
- `INSERT smartstay.room_occupants`
- `INSERT smartstay.contract_services`
- `UPDATE smartstay.rooms`
- Trigger `ensure_contract_tenant_balance`

Kết thúc:
- UI điều hướng sang detail contract mới tạo.

LUỒNG PHỤ:
- A1. Chồng lấn hợp đồng:
- Hành động xử lý: UI hiện mã contract xung đột.
- Kết thúc
- A2. Người dùng hủy wizard:
- Kết thúc

GHI CHÚ:
- Edge Function `create-contract` chỉ chấp nhận caller có quyền admin.
- Function live `create-contract` đang deploy với `verify_jwt=false`, nhưng bản thân function vẫn tự kiểm tra quyền trong code.

### [TÊN ACTIVITY DIAGRAM]: [AD-20] Thêm occupant vào hợp đồng

ACTOR:
- Workspace Owner/Admin
- Staff
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở `AddOccupantModal`. (USER ACTION)
3. Người dùng chọn `tenantId`, `moveInDate`, `relationshipToPrimary`, `note`. (USER ACTION)
4. UI gọi `contractService.addOccupant(payload)`. (SYSTEM ACTION)
5. Service gọi RPC `add_contract_occupant`. (SYSTEM ACTION)
6. RPC khóa dòng contract và room. (SYSTEM ACTION)
7. RPC kiểm tra:
- contract tồn tại và status thuộc `active|pending_signature`
- tenant không phải primary tenant
- `moveInDate` nằm trong khoảng contract
- số occupant active hiện tại < `rooms.max_occupants`
- tenant chưa active ở contract khác
8. Nếu hợp lệ, RPC `UPSERT smartstay.room_occupants`. (SYSTEM ACTION)
9. RPC cập nhật `contracts.terms.occupants_for_billing`. (SYSTEM ACTION)
10. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `UPSERT smartstay.room_occupants`
- `UPDATE smartstay.contracts`

Kết thúc:
- UI refresh danh sách occupants.

LUỒNG PHỤ:
- A1. Quá sức chứa hoặc tenant đã ở hợp đồng khác:
- Hành động xử lý: RPC trả lỗi, UI hiện toast.
- Kết thúc
- A2. Người dùng đóng modal:
- Kết thúc

GHI CHÚ:
- Có lock ở mức DB row trong RPC.

### [TÊN ACTIVITY DIAGRAM]: [AD-21] Xóa occupant khỏi hợp đồng

ACTOR:
- Workspace Owner/Admin
- Staff
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng chọn occupant cần xóa khỏi contract. (USER ACTION)
3. Người dùng nhập `moveOutDate`, `note`. (USER ACTION)
4. UI gọi `contractService.removeOccupant(payload)`. (SYSTEM ACTION)
5. Service gọi RPC `remove_contract_occupant`. (SYSTEM ACTION)
6. RPC tìm `room_occupants` active theo `contract_id + tenant_id`. (SYSTEM ACTION)
7. RPC kiểm tra occupant không phải primary tenant. (SYSTEM ACTION)
8. RPC `UPDATE smartstay.room_occupants SET status='moved_out', move_out_at=?, note=?`. (SYSTEM ACTION)
9. RPC đếm lại occupant active còn lại. (SYSTEM ACTION)
10. RPC cập nhật `contracts.terms.occupants_for_billing`. (SYSTEM ACTION)
11. Nếu không còn occupant active -> RPC gọi tiếp `liquidate_contract`. (SYSTEM ACTION)
12. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `UPDATE smartstay.room_occupants`
- `UPDATE smartstay.contracts`
- Có thể gọi `liquidate_contract`

Kết thúc:
- UI refresh contract detail.

LUỒNG PHỤ:
- A1. Người bị xóa là primary tenant:
- Hành động xử lý: RPC từ chối và yêu cầu chuyển đại diện hoặc thanh lý.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- Flow này có thể auto-chain sang AD-23 nếu contract hết occupant.

### [TÊN ACTIVITY DIAGRAM]: [AD-22] Chuyển người đại diện hợp đồng

ACTOR:
- Workspace Owner/Admin
- Staff
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở `TransferContractModal`. (USER ACTION)
3. Người dùng chọn `toTenantId`, `transferDate`, `note`. (USER ACTION)
4. UI gọi `contractService.transferContract(payload)`. (SYSTEM ACTION)
5. Service gọi RPC `transfer_contract_representative`. (SYSTEM ACTION)
6. RPC khóa contract cũ. (SYSTEM ACTION)
7. RPC kiểm tra tenant đích là occupant active và khác primary tenant cũ. (SYSTEM ACTION)
8. RPC terminate contract cũ:
- update contract cũ
- move out occupants cũ
- ghi `contract_terminations`
9. RPC `INSERT smartstay.contracts` mới, copy term chính và đổi `primary_tenant_id`. (SYSTEM ACTION)
10. RPC `INSERT smartstay.contract_tenants` và `INSERT smartstay.room_occupants` cho contract mới. (SYSTEM ACTION)
11. RPC `INSERT smartstay.contract_transfers`. (SYSTEM ACTION)
12. RPC `UPDATE smartstay.contracts.linked_contract_id` cho contract cũ và `UPDATE smartstay.rooms SET status='occupied'`. (SYSTEM ACTION)
13. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `UPDATE smartstay.contracts`
- `INSERT smartstay.contracts`
- `INSERT smartstay.contract_tenants`
- `INSERT smartstay.room_occupants`
- `UPSERT/INSERT smartstay.contract_terminations`
- `INSERT smartstay.contract_transfers`
- `UPDATE smartstay.rooms`

Kết thúc:
- UI điều hướng sang contract mới hoặc reload detail.

LUỒNG PHỤ:
- A1. Tenant đích không phải occupant active:
- Hành động xử lý: RPC từ chối.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- Đây là flow tạo contract mới, không chỉ đổi cờ đại diện trên cùng một contract.

### [TÊN ACTIVITY DIAGRAM]: [AD-23] Thanh lý hợp đồng

ACTOR:
- Workspace Owner/Admin
- Staff
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở `LiquidationModal`. (USER ACTION)
3. Người dùng nhập `terminationDate`, `reason`, `depositUsed`, `additionalCharges`. (USER ACTION)
4. UI gọi `contractService.liquidateContract(payload)`. (SYSTEM ACTION)
5. Service gọi RPC `liquidate_contract`. (SYSTEM ACTION)
6. RPC khóa contract. (SYSTEM ACTION)
7. RPC kiểm tra không còn invoice chưa thanh toán với `balance_due > 0` và status không thuộc `paid|cancelled`. (SYSTEM ACTION)
8. RPC `UPDATE smartstay.room_occupants` active -> `moved_out`. (SYSTEM ACTION)
9. RPC `UPDATE smartstay.contracts SET status='terminated', terminated_at=?, termination_reason=?`. (SYSTEM ACTION)
10. RPC `UPSERT smartstay.contract_terminations`. (SYSTEM ACTION)
11. Nếu phòng không còn contract active/pending khác -> `UPDATE smartstay.rooms SET status='available'`. (SYSTEM ACTION)
12. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `UPDATE smartstay.room_occupants`
- `UPDATE smartstay.contracts`
- `UPSERT smartstay.contract_terminations`
- có thể `UPDATE smartstay.rooms`

Kết thúc:
- UI hiển thị contract đã terminate.

LUỒNG PHỤ:
- A1. Còn hóa đơn chưa thanh toán:
- Hành động xử lý: RPC từ chối thanh lý.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- Có lock DB trong RPC.

### [TÊN ACTIVITY DIAGRAM]: [AD-24] Tạo phụ lục hợp đồng thủ công

ACTOR:
- Workspace Owner/Admin
- Staff
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở `CreateAddendumModal`. (USER ACTION)
3. Người dùng nhập:
- `contractId`, `type`, `title`, `content`
- `effectiveDate`, `status`
- có thể upload file phụ lục
4. Nếu có file, UI gọi `portalAddendumService.uploadAddendumFile(file)`. (SYSTEM ACTION)
5. `fileService` upload PDF/DOC/DOCX vào bucket `smartstay-files`. (SYSTEM ACTION)
6. UI gọi `portalAddendumService.createAddendum(payload)`. (SYSTEM ACTION)
7. Service `INSERT smartstay.contract_addendums`. (SYSTEM ACTION)
8. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- upload file vào Storage
- `INSERT smartstay.contract_addendums`

Kết thúc:
- UI refresh danh sách phụ lục.

LUỒNG PHỤ:
- A1. File sai định dạng:
- Điều kiện lỗi: không phải PDF/DOC/DOCX hoặc > 10MB.
- Hành động xử lý: upload bị chặn.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- `addendum_code` hiện để DB tự sinh hoặc để trống theo schema mặc định; service không tự build code trong flow insert.

### [TÊN ACTIVITY DIAGRAM]: [AD-25] Tạo phụ lục hợp đồng tự động từ room asset

ACTOR:
- System
- Workspace Owner/Admin
- Staff

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng sửa `room_assets` theo hướng có ảnh hưởng billing. (USER ACTION)
3. Trigger `trg_room_assets_create_addendum` chạy `create_room_asset_contract_addendum()`. (SYSTEM ACTION)
4. Function tìm các contract `active|pending_signature` đang gắn với phòng đó. (SYSTEM ACTION)
5. Function xác định loại thay đổi:
- `asset_assignment`
- `asset_repricing`
- `asset_status_change`
6. Function kiểm tra tránh trùng addendum theo `summary_json.room_asset_id + effective_date`. (SYSTEM ACTION)
7. Nếu chưa có bản trùng, function `INSERT smartstay.contract_addendums` với status draft. (SYSTEM ACTION)
8. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `INSERT smartstay.contract_addendums`

Kết thúc:
- Addendum tự động xuất hiện trong contract detail / addendum list.

LUỒNG PHỤ:
- A1. Không có contract active/pending cho phòng:
- Hành động xử lý: không insert addendum.
- Kết thúc
- A2. Bản ghi trùng đã tồn tại:
- Hành động xử lý: bỏ qua.
- Kết thúc

GHI CHÚ:
- Đây là trigger tự động.
- Có side effect từ AD-11.

### [TÊN ACTIVITY DIAGRAM]: [AD-26] Quản lý utility policy

ACTOR:
- Workspace Owner/Admin
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở `UtilityPoliciesPage`. (USER ACTION)
3. Người dùng nhập:
- `scopeType`, `scopeId`
- `name`, `description`
- điện/nước base, min floor, multiplier, season months
- device adjustments
- `effectiveFrom`, `effectiveTo`
4. UI tự sinh `code` bằng `createSuggestedPolicyCode()`. (SYSTEM ACTION)
5. UI gọi `utilityAdminService.createPolicy(form)` hoặc `setPolicyActiveStatus(id, isActive)`. (SYSTEM ACTION)
6. Service `INSERT smartstay.utility_policies`. (SYSTEM ACTION)
7. Nếu có device adjustment active, service `INSERT smartstay.utility_policy_device_adjustments`. (SYSTEM ACTION)
8. Nếu đổi trạng thái active, service `UPDATE smartstay.utility_policies.is_active`. (SYSTEM ACTION)
9. Trigger `trg_touch_utility_policies_updated_at` và `trg_touch_utility_policy_device_adjustments_updated_at` cập nhật `updated_at`. (SYSTEM ACTION)
10. Kết thúc

X. System kiểm tra:
- Nếu `scopeType != 'system'` mà không có `scopeId` -> UI chặn.
- Nếu `effectiveTo < effectiveFrom` -> UI chặn.
- Check constraints DB:
- scope `system` thì `scope_id` phải null, còn scope khác phải có `scope_id`
- số tiền >= 0
- multiplier > 0

N. Nếu hợp lệ:
- System thực hiện:
- `INSERT smartstay.utility_policies`
- `INSERT smartstay.utility_policy_device_adjustments`
- hoặc `UPDATE smartstay.utility_policies`

Kết thúc:
- UI refresh policy list.

LUỒNG PHỤ:
- A1. Dữ liệu policy vi phạm constraint:
- Hành động xử lý: DB từ chối, UI hiện lỗi.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- Thứ tự ưu tiên khi resolve policy trong UI: `contract > room > building > system`.

### [TÊN ACTIVITY DIAGRAM]: [AD-27] Quản lý utility override

ACTOR:
- Workspace Owner/Admin
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở `UtilityOverridesPage`. (USER ACTION)
3. Người dùng nhập:
- `contractId`, `billingPeriod`, `reason`
- các override cho occupants, electric, water, multiplier, season months
4. UI gọi `utilityAdminService.upsertOverride(input)` hoặc `deleteOverride(id)`. (SYSTEM ACTION)
5. Service đọc override cũ theo `contract_id + billing_period`. (SYSTEM ACTION)
6. Service build `old_values_json` và `new_values_json`. (SYSTEM ACTION)
7. Service `UPSERT smartstay.invoice_utility_overrides ON CONFLICT(contract_id,billing_period)`. (SYSTEM ACTION)
8. Nếu xóa, service `DELETE smartstay.invoice_utility_overrides WHERE id=?`. (SYSTEM ACTION)
9. Trigger `trg_touch_invoice_utility_overrides_updated_at` cập nhật `updated_at`. (SYSTEM ACTION)
10. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `SELECT smartstay.invoice_utility_overrides`
- `UPSERT smartstay.invoice_utility_overrides`
- hoặc `DELETE smartstay.invoice_utility_overrides`

Kết thúc:
- UI refresh override list.

LUỒNG PHỤ:
- A1. Thiếu `contractId` hoặc `billingPeriod`:
- Hành động xử lý: UI chặn submit.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- Unique live: `(contract_id, billing_period)`.

### [TÊN ACTIVITY DIAGRAM]: [AD-28] Preview utility billing run

ACTOR:
- Workspace Owner/Admin
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng chọn `billingPeriod`, có thể chọn `dueDate`. (USER ACTION)
3. UI gọi `utilityAdminService.previewBillingRun(billingPeriod, dueDate)`. (SYSTEM ACTION)
4. Service gọi Edge Function `run-utility-billing` với `dryRun=true`. (SYSTEM ACTION)
5. Edge Function chọn các contract active giao cắt kỳ billing. (SYSTEM ACTION)
6. Edge Function loại contract không dùng utility policy hoặc `occupants_for_billing <= 0`. (SYSTEM ACTION)
7. Edge Function kiểm tra contract đã có invoice chưa bị cancel trong cùng kỳ. (SYSTEM ACTION)
8. Edge Function trả về:
- `eligibleContracts`
- `existingInvoiceContracts`
- `ineligibleContracts`
- diagnostics tổng hợp
9. UI hiển thị preview. (SYSTEM ACTION)
10. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `SELECT smartstay.contracts`
- `SELECT smartstay.invoices`
- không ghi DB

Kết thúc:
- UI thấy preview đủ điều kiện/chưa đủ điều kiện.

LUỒNG PHỤ:
- A1. Kỳ thanh toán sai định dạng:
- Hành động xử lý: UI hoặc service chặn.
- Kết thúc
- A2. Không có contract hợp lệ:
- Hành động xử lý: preview trả danh sách rỗng.
- Kết thúc

GHI CHÚ:
- Đây là dry-run, không `INSERT billing_runs`.

### [TÊN ACTIVITY DIAGRAM]: [AD-29] Chạy utility billing run

ACTOR:
- Workspace Owner/Admin
- Cron
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng bấm chạy billing run hoặc Cron kích hoạt job. (USER ACTION / SYSTEM ACTION)
3. System gọi Edge Function `run-utility-billing` với `dryRun=false`. (SYSTEM ACTION)
4. Edge Function kiểm tra:
- manual trigger phải là admin role
- cron trigger phải có `x-cron-secret`
- cron chỉ được chạy ngày 1 theo múi giờ `Asia/Saigon`
5. Edge Function `INSERT smartstay.billing_runs` với status `running`. (SYSTEM ACTION)
6. Edge Function duyệt từng contract eligible. (SYSTEM ACTION)
7. Với từng contract, Edge Function build payload utility và gọi RPC `create_policy_utility_invoice`. (SYSTEM ACTION)
8. Nếu tạo invoice thành công, snapshot utility được ghi. (SYSTEM ACTION)
9. Sau khi xong toàn bộ, Edge Function `UPDATE smartstay.billing_runs` sang `completed` hoặc `failed`, kèm `summary_json/error_json`. (SYSTEM ACTION)
10. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `INSERT smartstay.billing_runs`
- lặp gọi `create_policy_utility_invoice`
- `INSERT smartstay.invoices`
- `INSERT smartstay.invoice_items`
- `INSERT smartstay.invoice_utility_snapshots`
- `UPDATE smartstay.billing_runs`

Kết thúc:
- UI hoặc lịch sử run hiển thị số contract thành công/thất bại.

LUỒNG PHỤ:
- A1. Trigger cron sai ngày hoặc sai secret:
- Hành động xử lý: function từ chối chạy.
- Kết thúc
- A2. Một contract lỗi:
- Hành động xử lý: contract đó được ghi vào summary/error, run vẫn có thể tiếp tục contract khác.
- Kết thúc

GHI CHÚ:
- Có loop qua nhiều contract.
- Không thấy transaction bao trùm toàn bộ batch.

### [TÊN ACTIVITY DIAGRAM]: [AD-30] Tạo hóa đơn utility đơn lẻ

ACTOR:
- Workspace Owner/Admin
- Staff
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở `CreateInvoiceModal`. (USER ACTION)
3. Người dùng chọn `contractId`, `monthYear`, `dueDate`, `discountAmount`, `discountReason`, `note`. (USER ACTION)
4. UI gọi `invoiceService.previewInvoice(input)` để build draft. (SYSTEM ACTION)
5. Nếu preview có `missingUtilityItems`, UI chặn tạo. (SYSTEM ACTION)
6. Khi xác nhận, UI gọi `invoiceService.createInvoice(input)`. (SYSTEM ACTION)
7. Service kiểm tra:
- `contractId` hợp lệ
- `monthYear` đúng `YYYY-MM`
- contract dùng `utility_billing_type='policy'`
- `occupants_for_billing > 0`
8. Service gọi Edge Function `create-utility-invoice`. (SYSTEM ACTION)
9. Edge Function build payload utility rồi gọi RPC `create_policy_utility_invoice`. (SYSTEM ACTION)
10. RPC `INSERT smartstay.invoices`, `INSERT smartstay.invoice_items`, `INSERT smartstay.invoice_utility_snapshots`. (SYSTEM ACTION)
11. Service refetch invoice vừa tạo. (SYSTEM ACTION)
12. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `SELECT smartstay.contracts`
- `INSERT smartstay.invoices`
- `INSERT smartstay.invoice_items`
- `INSERT smartstay.invoice_utility_snapshots`

Kết thúc:
- UI điều hướng hoặc refresh invoice list.

LUỒNG PHỤ:
- A1. Contract không dùng utility policy:
- Hành động xử lý: service throw lỗi.
- Kết thúc
- A2. Trùng invoice cùng kỳ:
- Hành động xử lý: RPC từ chối nếu đã có invoice chưa canceled.
- Kết thúc

GHI CHÚ:
- Edge Function live `create-utility-invoice` đang deploy với `verify_jwt=false`, nhưng code vẫn tự kiểm tra admin role.

### [TÊN ACTIVITY DIAGRAM]: [AD-31] Tạo hóa đơn utility hàng loạt

ACTOR:
- Workspace Owner/Admin
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở `BulkInvoiceModal`. (USER ACTION)
3. Người dùng chọn `monthYear`, `dueDate`, có thể chọn `buildingId`. (USER ACTION)
4. UI gọi `invoiceService.previewBulkInvoices(input)`. (SYSTEM ACTION)
5. Service:
- tải contract tạo invoice được
- lọc theo building nếu có
- kiểm tra `smartstay.invoices` cùng kỳ chưa cancel
- gọi `buildInvoiceDraft()` cho từng contract còn lại
6. UI hiển thị contract `ready`, `blocked`, `duplicate`, `error`. (SYSTEM ACTION)
7. Người dùng chọn danh sách contractIds cần tạo. (USER ACTION)
8. UI gọi `invoiceService.createBulkInvoices({ ...input, contractIds, onProgress })`. (SYSTEM ACTION)
9. Service lặp từng `contractId` và gọi lại `createInvoice()` của AD-30. (SYSTEM ACTION)
10. Service gom kết quả vào 3 bucket:
- `created`
- `skipped`
- `failed`
11. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `SELECT smartstay.invoices`
- loop gọi AD-30 nhiều lần

Kết thúc:
- UI hiển thị summary tạo thành công/bỏ qua/thất bại.

LUỒNG PHỤ:
- A1. Không có contract thuộc building đã chọn:
- Hành động xử lý: preview trả rỗng.
- Kết thúc
- A2. Một số contract fail:
- Hành động xử lý: batch không rollback toàn bộ; chỉ đánh dấu failed/skipped từng contract.
- Kết thúc

GHI CHÚ:
- Có loop qua nhiều contract.
- Không có transaction toàn lô.

### [TÊN ACTIVITY DIAGRAM]: [AD-32] Ghi nhận payment thủ công

ACTOR:
- Workspace Owner/Admin
- Staff
- Tenant
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở `RecordPaymentModal` hoặc flow tương tự. (USER ACTION)
3. Người dùng nhập:
- `invoiceId`, `amount`, `method`, `paymentDate`
- `note`, `receiptUrl`
- chọn `status = Pending` hoặc `Confirmed`
4. UI gọi `paymentService.recordPayment(payment)`. (SYSTEM ACTION)
5. Nếu `VITE_USE_EDGE_FUNCTIONS=true`, service gọi Edge Function `process-payment` với:
- `invoiceId`, `amount`, `method`, `paymentDate`
- `notes`, `receiptUrl`
- `autoConfirm = (status==='Confirmed')`
6. Nếu `autoConfirm=false`, function có thể chỉ tạo `payment_attempts` và trả `attemptId`. (SYSTEM ACTION)
7. Nếu `autoConfirm=true`, function tạo `payments` rồi áp dụng vào invoice. (SYSTEM ACTION)
8. Nếu chạy legacy path, service `INSERT smartstay.payments`; nếu confirmed thì tự cập nhật invoice. (SYSTEM ACTION)
9. Kết thúc

X. System kiểm tra:
- `amount > 0`
- `amount <= balance còn lại`
- invoice không ở trạng thái `cancelled`

N. Nếu hợp lệ:
- System thực hiện:
- `INSERT smartstay.payment_attempts` hoặc `INSERT smartstay.payments`
- có thể `UPDATE smartstay.invoices`
- có thể gọi `apply_confirmed_payment`

Kết thúc:
- UI hiển thị payment mới hoặc payment pending.

LUỒNG PHỤ:
- A1. Số tiền vượt quá balance:
- Hành động xử lý: function/RPC từ chối.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- Với edge path, logic thật đi qua `process_payment(...)` / `approve_payment(...)`.

### [TÊN ACTIVITY DIAGRAM]: [AD-33] Duyệt hoặc từ chối payment

ACTOR:
- Workspace Owner/Admin
- Staff
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở Payment List hoặc Payment Detail. (USER ACTION)
3. Nếu duyệt payment, UI gọi `paymentService.approvePayment(id)`. (SYSTEM ACTION)
4. Nếu `VITE_USE_EDGE_FUNCTIONS=true`, service gọi Edge Function `process-payment` với `existingPaymentId` và `confirm=true`. (SYSTEM ACTION)
5. Edge Function/RPC gọi `approve_payment` rồi `apply_confirmed_payment`. (SYSTEM ACTION)
6. `apply_confirmed_payment`:
- khóa `payments` và `invoices`
- kiểm tra không overpay
- update `payments.confirmed_at/confirmed_by/applied_at/applied_by`
- update `invoices.amount_paid/status/paid_date`
- đảm bảo có `tenant_balances`
- trừ số dư `tenant_balances.balance`
- ghi `balance_history`
7. Nếu từ chối payment, UI gọi `paymentService.rejectPayment(id, reason)`. (SYSTEM ACTION)
8. Service hiện chỉ `UPDATE smartstay.payments.notes='[REJECTED] reason'`. (SYSTEM ACTION)
9. Kết thúc

N. Nếu hợp lệ:
- System thực hiện khi duyệt:
- `UPDATE smartstay.payments`
- `UPDATE smartstay.invoices`
- `UPDATE smartstay.tenant_balances`
- `INSERT smartstay.balance_history`
- Khi từ chối:
- `UPDATE smartstay.payments`

Kết thúc:
- UI refresh trạng thái payment/invoice.

LUỒNG PHỤ:
- A1. Payment đã được apply:
- Hành động xử lý: RPC từ chối hoặc bỏ qua theo flag `fail_if_applied`.
- Kết thúc
- A2. Overpay:
- Hành động xử lý: RPC từ chối.
- Kết thúc

GHI CHÚ:
- Nhánh reject hiện chưa đồng bộ `payment_attempts.status`; đây là logic thiếu.

### [TÊN ACTIVITY DIAGRAM]: [AD-34] Điều chỉnh số dư tenant

ACTOR:
- Workspace Owner/Admin
- Staff
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở `TopUpModal` hoặc `DeductModal`. (USER ACTION)
3. Người dùng nhập `tenantId`, `amount`, `note`. (USER ACTION)
4. UI map loại giao dịch:
- top up -> `ManualTopUp`
- deduct -> `ManualDeduct`
5. UI gọi `paymentService.manualBalanceAdjustment(...)`. (SYSTEM ACTION)
6. Nếu edge path bật, service gọi Edge Function `adjust-balance`. (SYSTEM ACTION)
7. Edge Function gọi RPC `adjust_balance(tenant_id, amount, transaction_type, notes, invoice_id, created_by)`. (SYSTEM ACTION)
8. RPC:
- đảm bảo có `tenant_balances`
- khóa `tenant_balances`
- `INSERT smartstay.balance_history`
- `UPDATE smartstay.tenant_balances`
9. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `INSERT smartstay.balance_history`
- `UPDATE smartstay.tenant_balances`

Kết thúc:
- UI refresh wallet/ledger.

LUỒNG PHỤ:
- A1. `transactionType` không hợp lệ:
- Hành động xử lý: Edge Function từ chối.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- Legacy path hiện là non-atomic hai bước, nhưng live flow ưu tiên Edge Function.

### [TÊN ACTIVITY DIAGRAM]: [AD-35] Xử lý webhook SePay

ACTOR:
- SePay
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. SePay hoặc demo flow gọi webhook. (USER ACTION / SYSTEM ACTION)
3. Function/RPC `handle_sepay_webhook(payload, source, received_at)` được chạy. (SYSTEM ACTION)
4. System `INSERT smartstay.webhook_logs` với trạng thái processing. (SYSTEM ACTION)
5. System kiểm tra payload là inbound transfer và parse:
- amount
- transaction id
- transfer content
6. System trích `invoice_code` từ nội dung chuyển khoản. (SYSTEM ACTION)
7. System tìm invoice theo code. (SYSTEM ACTION)
8. System kiểm tra:
- không duplicate transaction
- invoice chưa paid/cancelled
- amount không vượt balance
9. System gọi `process_payment(... auto_confirm=false, idempotency='sepay:trans_id', attempt_status='processing')`. (SYSTEM ACTION)
10. System cập nhật metadata gateway cho `payment_attempts`. (SYSTEM ACTION)
11. System gọi `approve_payment(attempt_id, source='sepay_webhook')`. (SYSTEM ACTION)
12. System `UPDATE smartstay.webhook_logs` sang `success` hoặc `failed`. (SYSTEM ACTION)
13. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `INSERT/UPDATE smartstay.webhook_logs`
- `INSERT smartstay.payment_attempts`
- `INSERT smartstay.payments`
- `UPDATE smartstay.payment_attempts`
- `UPDATE smartstay.payments`
- `UPDATE smartstay.invoices`
- `UPDATE smartstay.tenant_balances`
- `INSERT smartstay.balance_history`

Kết thúc:
- Invoice được cộng tiền và có thể chuyển sang `paid` hoặc `partially_paid`.

LUỒNG PHỤ:
- A1. Không parse được invoice code:
- Hành động xử lý: webhook log chuyển `failed`.
- Kết thúc
- A2. Duplicate transaction:
- Hành động xử lý: bỏ qua hoặc log failed tùy nhánh xử lý.
- Kết thúc

GHI CHÚ:
- Portal invoice page có demo `simulateSepayPayment()` gọi flow này với header `x-smartstay-demo:true`.

### [TÊN ACTIVITY DIAGRAM]: [AD-36] Xử lý webhook MoMo IPN

ACTOR:
- MoMo
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. MoMo gửi IPN callback. (SYSTEM ACTION)
3. System chạy `handle_momo_ipn(...)`. (SYSTEM ACTION)
4. System xác thực HMAC/signature của IPN. (SYSTEM ACTION)
5. System tìm `payment_attempts` theo `gateway_order_id` hoặc idempotency key. (SYSTEM ACTION)
6. System kiểm tra:
- payment attempt có tồn tại
- chưa rejected/cancelled/refunded
- amount khớp với attempt
7. Nếu trạng thái callback thành công, System gọi `approve_payment(attempt_id, source='momo_ipn')`. (SYSTEM ACTION)
8. Nếu callback thất bại, System cập nhật `payment_attempts` tương ứng là failed/rejected. (SYSTEM ACTION)
9. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `UPDATE smartstay.payment_attempts`
- có thể `INSERT smartstay.payments`
- `UPDATE smartstay.invoices`
- `UPDATE smartstay.tenant_balances`
- `INSERT smartstay.balance_history`

Kết thúc:
- Payment attempt được chốt trạng thái cuối.

LUỒNG PHỤ:
- A1. Sai chữ ký HMAC:
- Hành động xử lý: từ chối callback.
- Kết thúc
- A2. Amount mismatch:
- Hành động xử lý: không apply payment, đánh dấu failed.
- Kết thúc

GHI CHÚ:
- MoMo flow thật chỉ có backend callback; UI portal không trực tiếp hoàn tất invoice, chỉ khởi tạo request.

### [TÊN ACTIVITY DIAGRAM]: [AD-37] Tạo ticket

ACTOR:
- Tenant
- Workspace Owner/Admin
- Staff
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở form tạo ticket ở portal hoặc admin. (USER ACTION)
3. Người dùng nhập:
- `tenantId`, `roomId`
- `title`, `description`
- `type/category`, `priority`
- có thể kèm attachments
4. UI gọi `ticketService.createTicket(input)`. (SYSTEM ACTION)
5. Service xác thực input bằng Zod. (SYSTEM ACTION)
6. Service kiểm tra session user tồn tại. (SYSTEM ACTION)
7. Service `INSERT smartstay.tickets`. (SYSTEM ACTION)
8. Nếu có attachments hoặc description, service upload attachments qua `fileService` rồi `INSERT smartstay.ticket_comments` comment đầu tiên. (SYSTEM ACTION)
9. Kết thúc

X. System kiểm tra:
- `title` tối thiểu 3 ký tự.
- Nếu RLS không cho tạo ticket cho tenant đó -> từ chối.

N. Nếu hợp lệ:
- System thực hiện:
- `INSERT smartstay.tickets`
- có thể upload file vào Storage
- có thể `INSERT smartstay.ticket_comments`
- Trigger `trg_tickets_updated` cập nhật `updated_at`

Kết thúc:
- UI điều hướng sang detail ticket hoặc refresh list.

LUỒNG PHỤ:
- A1. Upload ảnh lỗi:
- Hành động xử lý: create ticket có thể fail hoặc chỉ thiếu attachments tùy thời điểm lỗi.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- Portal feedback hiện cũng đi vào `tickets` với `category='feedback'` thay vì bảng feedback riêng.

### [TÊN ACTIVITY DIAGRAM]: [AD-38] Bình luận / phân công / cập nhật ticket

ACTOR:
- Tenant
- Workspace Owner/Admin
- Staff
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở `TicketDetail`. (USER ACTION)
3. Nếu thêm comment, UI gọi `ticketService.addComment(ticketId, content, isInternal, attachments)`. (SYSTEM ACTION)
4. Service `INSERT smartstay.ticket_comments`. (SYSTEM ACTION)
5. Nếu phân công staff, UI gọi `ticketService.assignTicket(ticketId, assigneeId)`. (SYSTEM ACTION)
6. Service `UPDATE smartstay.tickets.assigned_to`. (SYSTEM ACTION)
7. Nếu đổi trạng thái, UI gọi `updateTicketStatus()` hoặc `updateStatus()`. (SYSTEM ACTION)
8. Service `UPDATE smartstay.tickets`:
- `status`
- `resolved_at` nếu resolve/close
- `resolution_notes`, `resolution_cost`, `satisfaction_rating` nếu có
9. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `INSERT smartstay.ticket_comments`
- `UPDATE smartstay.tickets`

Kết thúc:
- UI cập nhật timeline comment, assignee, badge SLA.

LUỒNG PHỤ:
- A1. Tenant cố xem ticket không thuộc tenant của mình:
- Hành động xử lý: `getTicketDetail/getTicketComments` có filter `tenant_id`; query fail.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- `slaDeadline` hiện được tính client-side, không có cột DB.

### [TÊN ACTIVITY DIAGRAM]: [AD-39] Quản lý amenity policy

ACTOR:
- Workspace Owner/Admin
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở `AmenityManagementPage` tab policy. (USER ACTION)
3. Người dùng tạo mới hoặc sửa policy với:
- `code`, `name`, `serviceId/amenityId`, `buildingId`
- `bookingMode`, `chargeMode`, `status`
- slot capacity, advance days, cancellation cutoff
- approval/checkin/waitlist flags
- `priceOverrideAmount`, `activeFrom`, `activeTo`
- `rulesJson`, `changeSummary`
4. Nếu tạo mới, UI gọi `amenityAdminService.createPolicy(input)`. (SYSTEM ACTION)
5. Service `INSERT smartstay.amenity_policies`. (SYSTEM ACTION)
6. Service `INSERT smartstay.amenity_policy_versions` bản version đầu tiên. (SYSTEM ACTION)
7. Nếu sửa policy, service `UPDATE smartstay.amenity_policies`, tăng `current_version_no`, rồi `INSERT smartstay.amenity_policy_versions`. (SYSTEM ACTION)
8. Nếu archive, service `UPDATE smartstay.amenity_policies.status='archived', deleted_at=?, current_version_no=?` rồi `INSERT smartstay.amenity_policy_versions`. (SYSTEM ACTION)
9. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `INSERT/UPDATE smartstay.amenity_policies`
- `INSERT smartstay.amenity_policy_versions`
- Trigger cập nhật `updated_at` và sync legacy refs

Kết thúc:
- UI refresh policy list và dashboard amenity.

LUỒNG PHỤ:
- A1. Schema compatibility:
- Điều kiện lỗi: project dùng field `amenity_id` hoặc `service_id` khác nhau.
- Hành động xử lý: service có fallback qua `isSchemaCompatError`.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- Flow này tách riêng khỏi duyệt version ở AD-40.

### [TÊN ACTIVITY DIAGRAM]: [AD-40] Duyệt amenity policy version

ACTOR:
- Workspace Owner/Admin
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở tab version của một policy. (USER ACTION)
3. Người dùng chọn một version pending approval. (USER ACTION)
4. UI gọi `amenityAdminService.reviewVersion(versionId, decision, reviewNote)`. (SYSTEM ACTION)
5. Service `UPDATE smartstay.amenity_policy_versions`:
- `status`
- `reviewed_by`
- `reviewed_at`
- `review_note`
6. Service `UPDATE smartstay.amenity_policies`:
- `status='approved'` hoặc `draft`
- `approved_by`, `approved_at`
- `current_version_no = version_no` của version vừa duyệt
7. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `UPDATE smartstay.amenity_policy_versions`
- `UPDATE smartstay.amenity_policies`

Kết thúc:
- UI thấy version được approve/reject.

LUỒNG PHỤ:
- A1. Version không tồn tại:
- Hành động xử lý: query `single()` lỗi.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- Không có transaction rõ ràng bao trùm 2 câu lệnh update.

### [TÊN ACTIVITY DIAGRAM]: [AD-41] Tạo amenity exception

ACTOR:
- Workspace Owner/Admin
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở tab exception. (USER ACTION)
3. Người dùng nhập:
- `policyId`, `serviceId/amenityId`, `buildingId`
- `title`, `exceptionType`
- `startAt`, `endAt`
- `reason`, `overrideJson`
4. UI gọi `amenityAdminService.createException(input)`. (SYSTEM ACTION)
5. Service `INSERT smartstay.amenity_booking_exceptions`. (SYSTEM ACTION)
6. Trigger sync refs/updated_at chạy. (SYSTEM ACTION)
7. Kết thúc

X. System kiểm tra:
- `end_at > start_at`
- `exception_type` phải hợp lệ

N. Nếu hợp lệ:
- System thực hiện:
- `INSERT smartstay.amenity_booking_exceptions`

Kết thúc:
- UI refresh exception list.

LUỒNG PHỤ:
- A1. Thời gian không hợp lệ:
- Hành động xử lý: DB reject hoặc UI chặn.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- Có fallback giữa `amenity_id` và `service_id`.

### [TÊN ACTIVITY DIAGRAM]: [AD-42] Queue amenity notification

ACTOR:
- Workspace Owner/Admin
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng chọn policy đang theo dõi và nhập `title`, `message`. (USER ACTION)
3. UI gọi `amenityAdminService.queuePolicyNotification(input)`. (SYSTEM ACTION)
4. Service lấy `created_by` từ session. (SYSTEM ACTION)
5. Service `INSERT smartstay.amenity_policy_notifications` với:
- `policy_id`, `version_id`
- `title`, `message`
- `channel`
- `audience_scope`
- `payload_json`
6. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `INSERT smartstay.amenity_policy_notifications`

Kết thúc:
- UI thấy notification ở trạng thái `queued`.

LUỒNG PHỤ:
- A1. Chưa chọn policy:
- Hành động xử lý: UI disable nút queue.
- Kết thúc
- A2. Người dùng hủy:
- Kết thúc

GHI CHÚ:
- Hiện chỉ ghi hàng đợi thông báo; chưa thấy worker gửi thực tế trong code này.

### [TÊN ACTIVITY DIAGRAM]: [AD-43] Đặt chỗ tiện ích và hủy đặt chỗ

ACTOR:
- Tenant
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng mở `PortalAmenityList` hoặc `MyBookings`. (USER ACTION)
3. UI tải danh sách amenity từ `portalAmenityService.getAmenities()`. (SYSTEM ACTION)
4. Người dùng chọn `amenityId`, `date`, `timeSlot`. (USER ACTION)
5. UI gọi `portalAmenityService.createBooking({ amenityId, date, timeSlot })`. (SYSTEM ACTION)
6. Service tìm `tenantId` theo `tenants.profile_id = auth.user.id`. (SYSTEM ACTION)
7. Service `INSERT smartstay.amenity_bookings` với `status='booked'`. (SYSTEM ACTION)
8. Nếu người dùng hủy booking, UI gọi `portalAmenityService.cancelBooking(bookingId)`. (SYSTEM ACTION)
9. Service `UPDATE smartstay.amenity_bookings SET status='cancelled'`. (SYSTEM ACTION)
10. Kết thúc

X. System kiểm tra:
- User phải đăng nhập và có tenant record.
- Nếu DB unique/conflict slot xảy ra -> insert bị từ chối; UI hiện “slot đã có người đặt”.

N. Nếu hợp lệ:
- System thực hiện:
- `SELECT smartstay.tenants`
- `INSERT smartstay.amenity_bookings`
- hoặc `UPDATE smartstay.amenity_bookings`

Kết thúc:
- UI refresh booking list.

LUỒNG PHỤ:
- A1. Tenant chưa được provision:
- Hành động xử lý: service throw `Unauthenticated` hoặc không tìm thấy tenant.
- Kết thúc
- A2. Người dùng hủy trước khi submit:
- Kết thúc

GHI CHÚ:
- Bảng `amenity_booking_checkins` và `amenity_booking_charges` hiện chưa có luồng write thật trong UI/service.

### [TÊN ACTIVITY DIAGRAM]: [AD-44] Đọc và đánh dấu notification

ACTOR:
- Tenant
- Workspace user
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. UI lấy `profileId` từ session. (SYSTEM ACTION)
3. UI gọi `notificationService.getNotifications(profileId)` và `getUnreadCount(profileId)`. (SYSTEM ACTION)
4. Người dùng mở một notification. (USER ACTION)
5. UI gọi `notificationService.markAsRead(notificationId)`. (SYSTEM ACTION)
6. Nếu người dùng bấm “mark all”, UI gọi `notificationService.markAllAsRead(profileId)`. (SYSTEM ACTION)
7. Service `UPDATE smartstay.notifications SET is_read=true`. (SYSTEM ACTION)
8. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `SELECT smartstay.notifications`
- `UPDATE smartstay.notifications`

Kết thúc:
- Badge unread giảm.
- UI điều hướng theo `link` nếu notification có link.

LUỒNG PHỤ:
- A1. Bảng notifications không tồn tại:
- Hành động xử lý: service trả `[]` hoặc `0`, không crash UI.
- Kết thúc
- A2. Người dùng đóng panel:
- Kết thúc

GHI CHÚ:
- Service có cơ chế realtime subscribe theo `profile_id`.

### [TÊN ACTIVITY DIAGRAM]: [AD-45] Cập nhật hồ sơ portal / avatar / mật khẩu / feedback

ACTOR:
- Tenant
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Tenant mở `Portal Profile`. (USER ACTION)
3. Nếu sửa hồ sơ cá nhân, UI gọi `portalProfileService.updateProfile(data)`. (SYSTEM ACTION)
4. Service cập nhật `smartstay.tenants`; nếu tenant record chưa có thì fallback `UPDATE smartstay.profiles`. (SYSTEM ACTION)
5. Nếu đổi avatar, UI gọi `portalProfileService.updateAvatar(file)`. (SYSTEM ACTION)
6. `fileService` upload vào `smartstay-files/avatars`, sau đó `UPDATE smartstay.profiles.avatar_url`. (SYSTEM ACTION)
7. Nếu đổi mật khẩu, UI gọi `portalProfileService.changePassword({ currentPassword, newPassword })`. (SYSTEM ACTION)
8. Service gọi `supabase.auth.updateUser({ password: newPassword })`. (SYSTEM ACTION)
9. Nếu gửi feedback, UI gọi `portalProfileService.submitFeedback(content)`. (SYSTEM ACTION)
10. Service `INSERT smartstay.tickets` với `category='feedback'`, `priority='normal'`, `status='new'`. (SYSTEM ACTION)
11. Kết thúc

X. System kiểm tra:
- Upload avatar theo rule của `fileService`.
- Nếu chưa có tenant record, profile update chỉ sửa được `full_name`, `phone` trong `profiles`.

N. Nếu hợp lệ:
- System thực hiện:
- `UPDATE smartstay.tenants`
- hoặc `UPDATE smartstay.profiles`
- upload avatar vào Storage + `UPDATE smartstay.profiles`
- gọi Supabase Auth đổi mật khẩu
- `INSERT smartstay.tickets` cho feedback

Kết thúc:
- UI cập nhật profile ngay.

LUỒNG PHỤ:
- A1. Đổi mật khẩu lỗi:
- Hành động xử lý: UI hiện lỗi.
- Kết thúc
- A2. Người dùng hủy từng sheet:
- Kết thúc

GHI CHÚ:
- `currentPassword` hiện không được kiểm tra server-side trong `changePassword`.
- Notification preferences và 2FA toggle ở UI hiện không persist vào DB.

### [TÊN ACTIVITY DIAGRAM]: [AD-46] Kích hoạt resident onboarding

ACTOR:
- Tenant
- Workspace Owner/Admin
- Staff
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Tenant mở module onboarding. (USER ACTION)
3. UI gọi `portalOnboardingService.getStatus()`. (SYSTEM ACTION)
4. Service đọc `smartstay.tenants` và contract active để tính:
- personal info
- CCCD upload
- emergency contact
- deposit paid
- contract signed
- room handover
5. Nếu `completionPercent === 100` và `tenantStage === 'resident_pending_onboarding'`, UI tự gọi `portalOnboardingService.activateResident()`. (SYSTEM ACTION)
6. Nếu `VITE_USE_EDGE_FUNCTIONS=true`, service gọi Edge Function `activate-resident`. (SYSTEM ACTION)
7. Edge Function kiểm tra:
- tenant tồn tại
- `full_name`, `id_number`, `date_of_birth` có dữ liệu
- `documents.cccd_images` tồn tại
- `emergency_contact_name` tồn tại
- có contract active
- `deposit_status` thuộc `received|partially_refunded`
8. Nếu hợp lệ, Edge Function `UPDATE smartstay.profiles SET tenant_stage='resident_active'`. (SYSTEM ACTION)
9. UI cập nhật local auth user. (SYSTEM ACTION)
10. Kết thúc

X. System kiểm tra:
- Nếu bật legacy path thay vì edge, service chỉ `UPDATE profiles` trực tiếp, không chạy validations.

N. Nếu hợp lệ:
- System thực hiện:
- `SELECT smartstay.tenants`
- `SELECT smartstay.contract_tenants`
- `SELECT smartstay.contracts`
- `UPDATE smartstay.profiles`

Kết thúc:
- Tenant stage chuyển sang `resident_active`.

LUỒNG PHỤ:
- A1. Chưa đủ điều kiện:
- Điều kiện lỗi: thiếu CCCD, emergency contact, active contract, deposit.
- Hành động xử lý: activation fail.
- Kết thúc
- A2. Người dùng rời onboarding:
- Kết thúc

GHI CHÚ:
- `isRoomHandovered` đang hardcode `false` vì schema hiện không có cột room handover; vì vậy mốc 100% thực tế là không đạt được bằng luồng hiện tại.

### [TÊN ACTIVITY DIAGRAM]: [AD-47] Gửi yêu cầu thanh toán hóa đơn từ tenant portal

ACTOR:
- Tenant
- System
- SePay

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Tenant mở `Portal Invoice List` và chọn một invoice. (USER ACTION)
3. UI tải detail invoice qua `portalInvoiceService.fetchInvoiceById(invoiceId)`. (SYSTEM ACTION)
4. Tenant nhập số tiền và thông tin đối soát chuyển khoản. (USER ACTION)
5. UI gọi `portalInvoiceService.recordBankTransfer(invoiceId, payload)`. (SYSTEM ACTION)
6. Service kiểm tra:
- tenant hiện tại có quyền trên invoice qua `contract_tenants`
- `amount > 0`
- `amount <= balance`
7. Service build payment note metadata rồi gọi RPC `portal_record_invoice_payment`. (SYSTEM ACTION)
8. RPC khóa invoice, xác nhận invoice thuộc tenant hiện tại, rồi gọi `process_payment(auto_confirm=false)`. (SYSTEM ACTION)
9. `process_payment` tạo `smartstay.payment_attempts`:
- với `attempt_status='submitted'` cho bank transfer
- hoặc `pending` cho MoMo
10. UI refresh invoice detail. (SYSTEM ACTION)
11. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `SELECT smartstay.tenants`
- `SELECT smartstay.contract_tenants`
- `INSERT smartstay.payment_attempts`

Kết thúc:
- UI báo “đã gửi thông tin đối soát”.
- Invoice chưa được cộng tiền cho tới khi admin duyệt hoặc webhook xác nhận.

LUỒNG PHỤ:
- A1. Số tiền vượt balance:
- Hành động xử lý: service chặn submit.
- Kết thúc
- A2. Người dùng chọn cash trong portal:
- Hành động xử lý: UI hiện lỗi “Tiền mặt không cần gửi yêu cầu online”.
- Kết thúc

GHI CHÚ:
- `recordCashPayment()` và `recordCardPayment()` có trong service, nhưng màn portal hiện tại chỉ chạy nhánh bank transfer / SePay-style request.
- Các flow portal này hiện có code nhưng đang bị route `/portal/* -> /listings` chặn ở shell chính.

### [TÊN ACTIVITY DIAGRAM]: [AD-48] Đánh dấu đã thanh toán hoặc hủy invoice

ACTOR:
- Workspace Owner/Admin
- Staff
- Landlord
- System

MÔ TẢ LUỒNG CHÍNH:
1. Bắt đầu
2. Người dùng thao tác trên invoice cần đóng trạng thái. (USER ACTION)
3. Nếu đánh dấu paid, UI/service gọi RPC `portal_mark_invoice_paid(invoiceId)`. (SYSTEM ACTION)
4. RPC kiểm tra caller có role `admin|manager|staff|landlord`. (SYSTEM ACTION)
5. RPC kiểm tra `balance_due = 0`. (SYSTEM ACTION)
6. Nếu hợp lệ, RPC `UPDATE smartstay.invoices SET status='paid', paid_date=now()`. (SYSTEM ACTION)
7. Nếu hủy invoice, UI/service gọi RPC `portal_cancel_invoice(invoiceId, reason)`. (SYSTEM ACTION)
8. RPC kiểm tra caller có role phù hợp và `amount_paid = 0`. (SYSTEM ACTION)
9. RPC `UPDATE smartstay.invoices SET status='cancelled'` và append lý do vào `notes`. (SYSTEM ACTION)
10. Kết thúc

N. Nếu hợp lệ:
- System thực hiện:
- `UPDATE smartstay.invoices`

Kết thúc:
- UI refresh invoice status.

LUỒNG PHỤ:
- A1. Đánh dấu paid khi còn balance:
- Hành động xử lý: RPC từ chối.
- Kết thúc
- A2. Hủy invoice đã có tiền:
- Hành động xử lý: RPC từ chối.
- Kết thúc

GHI CHÚ:
- Hiện chưa tìm thấy UI tenant gọi trực tiếp 2 RPC này.
- Service nằm ở `portalInvoiceService` nhưng điều kiện quyền thực tế là staff/admin/landlord.

## PHẦN 3: PHÂN TÍCH HỆ THỐNG

### Thiếu

- UI có `QuickInquiryModal` nhưng schema live không có `smartstay.room_inquiries`.
- UI announcements tồn tại nhưng schema live không có `smartstay.announcements`.
- Module visitor tồn tại nhưng schema live không có `smartstay.visitors`.
- Module portal service request cho phép “gửi yêu cầu đăng ký/hủy dịch vụ”, nhưng không có bảng request riêng; hiện chỉ toast, không persist.
- Onboarding step “Ký biên bản bàn giao” không có cột/flag lưu ở `contracts` hoặc `tenants`.
- `HandoverChecklist` admin là local UI, không có bảng checklist/handover persistence.
- `autoOffsetInvoices()` có UI modal nhưng không có logic DB thật.
- Báo cáo NPS/feedback dùng màn hình riêng nhưng schema live không có `tenant_feedback`, `nps_surveys`.
- Admin communications `NotificationPage` là mock UI, không ghi vào `smartstay.notifications`.
- Portal forgot-password OTP là mock flow, không dùng Supabase Auth reset thật.
- Rental application hiện chỉ có bước nộp đơn và list lead; chưa tìm thấy bước duyệt/từ chối/chuyển contract trong UI/backend.

### Dư

- `portalRoutes.tsx` và nhiều màn portal có code/service thật, nhưng `App.tsx` đang redirect toàn bộ `/portal/*` về `/listings`.
- Tồn tại song song `services` legacy và `service_catalog/service_prices` mới; nhiều service phải dùng compatibility fallback.
- Route legacy `/admin/*`, `/rooms/*`, `/buildings/*` cùng tồn tại với namespace thật `/owner/*`.
- `buildingService.uploadBuildingImage()` là mock và không phải luồng đang dùng trong `BuildingDetail`.
- `recordCashPayment()` và `recordCardPayment()` có trong `portalInvoiceService`, nhưng UI portal invoice hiện chỉ gửi bank transfer / SePay-style request.
- `hello-world` Edge Function không map vào nghiệp vụ nào của sản phẩm.

### Sai

- Portal onboarding auto-activate resident tại `completionPercent === 100`, nhưng `isRoomHandovered` đang hardcode `false`; do đó flow hoàn tất onboarding là không đạt được bằng dữ liệu hiện tại.
- Nếu `VITE_USE_EDGE_FUNCTIONS=false`, `portalOnboardingService.activateResident()` chỉ update `profiles.tenant_stage` và bỏ qua toàn bộ validate business.
- `create-user` Edge Function không lưu `roleId`, `identityNumber`, `dateOfBirth`, `gender`, `address` dù form và `userService.createUser()` gửi các field này.
- `create-owner` Edge Function nhận `cccd`, `taxCode`, `address` nhưng không persist vào DB trong bước create; chỉ `updateOwner()` sau đó mới lưu vào `profiles.preferences`.
- `paymentService.rejectPayment()` chỉ ghi `[REJECTED]` vào `payments.notes`; không cập nhật trạng thái chuẩn cho `payment_attempts`.
- `autoOffsetInvoices()` luôn trả `true` nhưng không ghi DB.
- `portalProfileService.changePassword()` không kiểm tra `currentPassword`.
- Notification preferences và toggle 2FA trong portal profile chỉ là state cục bộ, không lưu DB.
- `room_status_history` được đọc ở Room Detail và report, nhưng không tìm thấy write path hiện tại.
- `maintenance_logs` có bảng live nhưng chưa thấy service/UI ghi dữ liệu.
- `contract_renewals` có bảng live và được đọc ở contract detail, nhưng chưa thấy flow tạo renewal.
- `amenity_booking_checkins` và `amenity_booking_charges` có bảng live, nhưng chưa có service/UI viết dữ liệu; `AmenityCheckin` hiện là placeholder.
- Nhiều Edge Functions nhạy cảm đang deploy với `verify_jwt=false`: `create-contract`, `create-user`, `create-utility-invoice`, `run-utility-billing`, `sepay-webhook`, `webhook-payment`. Dù code có tự kiểm tra role/secret, cấu hình này vẫn làm bề mặt tấn công rộng hơn mức cần thiết.
- Tên vai trò gây nhiễu:
- workspace `Owner` thật ra map từ DB role `admin`
- hồ sơ chủ nhà lại dùng DB role `landlord`
- cùng một từ “owner” đang chỉ 2 actor khác nhau

### Kiểm tra thiếu activity diagram

- Không thấy nghiệp vụ thay đổi trạng thái dữ liệu nào lớn bị bỏ sót trong các module đang chạy thật.
- Các màn read-only đã được quét nhưng không tách activity riêng vì không có state transition đáng kể.

### Nghiệp vụ có trong UI nhưng chưa có backend hoặc chưa dùng schema

- Quick inquiry cho listing
- Announcements
- Visitors
- Portal service request approval flow
- Handover checklist persistence
- Amenity check-in/check-out thực tế
- Auto offset invoices
- Staff ratings
- NPS reports nguồn dữ liệu thật
- Portal notification preferences / 2FA persistence

### Nghiệp vụ có trong database nhưng chưa được UI/backend hiện tại dùng đúng mức

- `contract_renewals`
- `maintenance_logs`
- `room_status_history` write path
- `amenity_booking_checkins`
- `amenity_booking_charges`
- `schedule_monthly_utility_billing_job()` / `unschedule_monthly_utility_billing_job()` chưa thấy UI quản trị

### Activity diagram nào không map với UI hoặc DB

- Không đưa vào activity diagram các flow giả hoàn toàn như visitor check-in, portal forgot-password OTP mock, admin notification mock, vì chúng không có backend/schema thật.
- Các AD portal từ AD-45 đến AD-48 map với code/service và DB thật, nhưng cần hiểu rõ chúng đang bị chặn bởi router runtime hiện tại.

### Kết luận ngắn

- Phần lõi vận hành có thật và khá rõ ràng nhất hiện nay là:
- building / room / asset
- contract lifecycle
- utility billing
- payments / webhook / balance
- tickets
- amenity governance
- notifications
- Các lỗ hổng lớn nhất nằm ở:
- portal route chưa mount
- onboarding không thể hoàn tất
- nhiều UI đã lên màn nhưng chưa có backend thật
- vài field quan trọng trên form create user / create owner đang bị thu thập nhưng không được persist

---

PHẦN GHI ĐÈ CHUẨN HÓA AD-19 DÙNG THAY THẾ CHO PHẦN AD-19 CŨ
[TÊN ACTIVITY DIAGRAM]: [AD-19] Tạo hợp đồng
TÁC NHÂN:

Chủ hệ thống / Quản trị viên
Nhân viên
Hệ thống
MÔ TẢ LUỒNG CHÍNH:

Bắt đầu.
Người dùng mở màn hình hướng dẫn tạo hợp đồng CreateContractWizard.
Giải thích: CreateContractWizard là màn hình tạo hợp đồng theo từng bước.
Người dùng nhập dữ liệu hợp đồng theo 4 bước.
Bước 1: Chọn tòa nhà (building), phòng (room), người đứng tên hợp đồng (primary tenant), và người ở cùng (occupants).
Bước 2: Nhập điều khoản hợp đồng gồm:
loại hợp đồng (type)
ngày bắt đầu (startDate)
ngày kết thúc (endDate)
giá thuê (rentPrice)
tiền cọc (depositAmount)
chu kỳ thanh toán (paymentCycle)
ngày đến hạn thanh toán (paymentDueDay)
Bước 3: Chọn chính sách điện nước (utilityPolicyId), chọn các dịch vụ áp dụng (selectedServices), nhập thông tin người đại diện bên cho thuê (ownerRep).
Bước 4: Xem lại toàn bộ thông tin hợp đồng, chọn căn cứ pháp lý của bên cho thuê (ownerLegalConfirmation.legalBasisType), nhập ghi chú pháp lý (ownerLegalConfirmation.legalBasisNote) nếu có, tải hồ sơ pháp lý đính kèm (supportingDocumentUrls) nếu cần, và xác nhận đầy đủ các cam kết pháp lý bắt buộc.
Giao diện người dùng kiểm tra sớm các dữ liệu bắt buộc ở từng bước.
Giao diện người dùng kiểm tra sớm việc trùng thời gian hợp đồng theo room_id + khoảng ngày.
Giải thích: kiểm tra xem phòng đó đã có hợp đồng còn hiệu lực trong khoảng ngày đã chọn hay chưa.
Giao diện người dùng chỉ cho phép bấm tạo hợp đồng khi phần xác nhận pháp lý hợp lệ ở phía màn hình.
Giao diện gọi hàm tạo hợp đồng contractService.createContract(data).
Giải thích:
contractService là lớp xử lý nghiệp vụ hợp đồng ở phía ứng dụng
createContract nghĩa là “thực hiện tạo hợp đồng”
data là toàn bộ dữ liệu người dùng đã nhập
Nếu cấu hình VITE_USE_EDGE_FUNCTIONS=true, hệ thống sẽ gọi hàm máy chủ create-contract.
Giải thích:
VITE_USE_EDGE_FUNCTIONS=true nghĩa là ứng dụng được cấu hình để gọi hàm máy chủ trung gian
create-contract nghĩa tiếng Việt là “hàm tạo hợp đồng”
đây là một hàm phía máy chủ dùng để nhận dữ liệu, kiểm tra quyền, rồi gọi xuống cơ sở dữ liệu
Nếu không dùng hàm máy chủ trung gian, hệ thống gọi thủ tục cơ sở dữ liệu create_contract_v3(...).
Giải thích:
create_contract_v3 nghĩa là “thủ tục tạo hợp đồng phiên bản 3”
đây là thủ tục xử lý chính trong cơ sở dữ liệu
Hàm máy chủ hoặc thủ tục cơ sở dữ liệu kiểm tra lại toàn bộ dữ liệu ở phía máy chủ.
Nếu dữ liệu hợp lệ, hệ thống thực hiện các thao tác sau:
thêm bản ghi hợp đồng vào bảng smartstay.contracts
thêm người đứng tên hợp đồng vào bảng smartstay.contract_tenants
thêm người ở thực tế vào bảng smartstay.room_occupants
thêm các dịch vụ áp dụng cho hợp đồng vào bảng smartstay.contract_services
thêm số dư công nợ khởi tạo cho người thuê vào bảng smartstay.tenant_balances nếu chưa có
cập nhật trạng thái phòng trong bảng smartstay.rooms thành occupied
ghi nhật ký hệ thống vào audit_logs
Hệ thống lưu phần cam kết pháp lý của bên cho thuê vào contracts.terms.owner_legal_confirmation.
Giải thích:
terms là phần điều khoản hoặc dữ liệu bổ sung của hợp đồng
owner_legal_confirmation là nhóm dữ liệu xác nhận pháp lý của bên cho thuê
Giao diện điều hướng sang màn hình chi tiết hợp đồng vừa tạo.
Kết thúc.
X. HỆ THỐNG KIỂM TRA:

roomId, primaryTenantId phải là mã định danh hợp lệ.
primaryTenantId là bắt buộc.
Giải thích: đây là người đứng tên hợp đồng, không được bỏ trống.
Hợp đồng phải có ít nhất 1 người ở, bao gồm người đứng tên hợp đồng.
primaryTenantId không được trùng với danh sách occupants.
Giải thích: người đứng tên hợp đồng không được đồng thời xuất hiện trong danh sách người ở cùng.
Tổng số người ở không được vượt quá rooms.max_occupants nếu phòng có cấu hình sức chứa tối đa.
Giải thích: max_occupants là số người ở tối đa mà phòng cho phép.
Nếu đã tồn tại hợp đồng có trạng thái active hoặc pending_signature cùng phòng và chồng lấn khoảng ngày thì phải từ chối.
Giải thích:
active là đang có hiệu lực
pending_signature là đang chờ ký
startDate, endDate phải hợp lệ, và endDate phải sau startDate.
rentPrice phải hợp lệ, depositAmount không được âm.
paymentDueDay phải từ 1 đến 31.
utilityPolicyId phải tồn tại và đang hoạt động nếu được chọn.
Giải thích: đây là mã chính sách điện nước.
Các dịch vụ được chọn phải là dịch vụ hợp lệ và đang hoạt động.
Người ở cùng bổ sung không được đang ở hợp lệ tại hợp đồng hoặc phòng khác nếu vi phạm quy tắc nghiệp vụ.
ownerLegalConfirmation.legalBasisType phải là một trong các loại căn cứ pháp lý hợp lệ:
owner: chủ sở hữu hoặc người có quyền cho thuê
authorized_representative: người được ủy quyền hợp pháp
business_entity: pháp nhân hoặc đơn vị kinh doanh cho thuê
Bắt buộc phải xác nhận đầy đủ các cam kết pháp lý:
có quyền cho thuê hợp pháp hoặc được ủy quyền hợp lệ
nhà hoặc phòng đủ điều kiện cho thuê và không có tranh chấp theo thông tin hiện có
chấp nhận trách nhiệm bàn giao, bảo trì, phối hợp hồ sơ cư trú và các nghĩa vụ liên quan
đồng ý lưu vết cam kết và chịu trách nhiệm về tính chính xác của thông tin
Nếu ownerLegalConfirmation.legalBasisType = authorized_representative thì bắt buộc phải có ít nhất 1 hồ sơ pháp lý đính kèm.
Giải thích: nếu người ký là người được ủy quyền, phải có ít nhất một tài liệu chứng minh việc ủy quyền.
N. NẾU HỢP LỆ:

Hệ thống thực hiện:
thêm hợp đồng vào smartstay.contracts
thêm người thuộc hợp đồng vào smartstay.contract_tenants
thêm người cư trú vào smartstay.room_occupants
thêm dịch vụ hợp đồng vào smartstay.contract_services
thêm số dư công nợ ban đầu vào smartstay.tenant_balances nếu chưa tồn tại
cập nhật phòng trong smartstay.rooms
ghi nhật ký vào audit_logs
lưu dữ liệu xác nhận pháp lý vào contracts.terms.owner_legal_confirmation
KẾT THÚC:

Giao diện chuyển sang màn hình chi tiết của hợp đồng mới tạo.
LUỒNG PHỤ:

A1. Trùng hợp đồng:

Cách xử lý: giao diện hoặc máy chủ từ chối tạo hợp đồng, hiển thị lỗi, không ghi dữ liệu.

Kết thúc.

A2. Thiếu dữ liệu pháp lý bắt buộc:

Cách xử lý: giao diện chặn không cho bấm tạo; nếu vẫn gửi yêu cầu thì máy chủ hoặc thủ tục cơ sở dữ liệu tiếp tục từ chối.

Kết thúc.

A3. Người ở cùng không hợp lệ:

Cách xử lý: từ chối tạo hợp đồng nếu người ở cùng trùng với người đứng tên, vượt sức chứa, hoặc đang ở hợp lệ tại hợp đồng hoặc phòng khác.

Kết thúc.

A4. Người dùng hủy quá trình tạo hợp đồng:

Cách xử lý: không ghi bất kỳ dữ liệu nào.

Kết thúc.

TRẠNG THÁI HỆ THỐNG SAU KHI THÀNH CÔNG:

Hợp đồng mới được tạo với trạng thái active, nghĩa là đang có hiệu lực.
Phòng được chuyển sang trạng thái occupied, nghĩa là đang có người thuê.
Người đứng tên hợp đồng được gắn với hợp đồng.
Người ở cùng được ghi nhận trong dữ liệu cư trú thực tế.
Các dịch vụ hợp đồng được chụp lại tại thời điểm tạo hợp đồng.
Giải thích: “chụp lại” nghĩa là lưu trạng thái dữ liệu tại đúng thời điểm đó để về sau không bị thay đổi theo danh mục gốc.
Dữ liệu cam kết pháp lý được lưu trong hợp đồng.
Nhật ký hệ thống có bản ghi tạo hợp đồng.
GHI CHÚ:

Phần này dùng để thay thế cho phần AD-19 cũ.
Tenant nghĩa là người thuê, không phải tác nhân thực hiện flow này.
Edge Function create-contract nghĩa là hàm máy chủ “tạo hợp đồng”.
create_contract_v3 nghĩa là thủ tục tạo hợp đồng phiên bản 3 trong cơ sở dữ liệu.
contractService.createContract nghĩa là hàm nghiệp vụ tạo hợp đồng ở tầng ứng dụng.
ownerRep nghĩa là thông tin người đại diện bên cho thuê.
ownerLegalConfirmation nghĩa là nhóm dữ liệu xác nhận pháp lý của bên cho thuê.
supportingDocumentUrls nghĩa là danh sách đường dẫn đến các hồ sơ pháp lý đính kèm.
audit_logs nghĩa là nhật ký kiểm tra và theo dõi hành động trong hệ thống.
tenant_balances nghĩa là bảng số dư công nợ của người thuê.
contract_tenants nghĩa là bảng liên kết người thuê với hợp đồng.
room_occupants nghĩa là bảng ghi nhận những người đang ở thực tế trong phòng.
contract_services nghĩa là bảng ghi nhận các dịch vụ áp dụng cho hợp đồng.
Flow hiện tại dùng create_contract_v3, không còn dùng create_contract_v2.