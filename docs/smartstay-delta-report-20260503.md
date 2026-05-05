# SmartStay — Delta Report: Thay Đổi So Với Tài Liệu Gốc

**Tài liệu gốc tham chiếu:** `docs/smartstay-system-activity-analysis-20260418.md` (Ngày: 2026-04-18)
**Ngày quét so sánh:** 2026-05-03
**Phạm vi quét:** Live Supabase schema, ownerRoutes.tsx, portalRoutes.tsx, src/services/*, src/views/*

---

> **Hướng dẫn sử dụng tài liệu này:**
> Tài liệu này liệt kê chính xác những gì **đã thay đổi** so với tài liệu gốc ngày 18/04.
> Dùng để cập nhật tài liệu `smartstay-system-activity-analysis-20260418.md` hoặc tạo phiên bản mới.
> Ký hiệu: ✅ = đã khắc phục / đã triển khai mới | ⚠️ = thay đổi cần lưu ý | ❌ = vẫn còn vấn đề

---

## PHẦN 1: THAY ĐỔI LỚN VỀ ROUTING (TRỌNG YẾU)

### 1.1 Portal Route — Từ `Dormant` → `Active`

**Tài liệu gốc (18/04) ghi:**
> "Module portal có rất nhiều màn hình và service thật, nhưng `src/App.tsx` hiện đang redirect toàn bộ `/portal/*` về `/listings`. Nghĩa là code portal tồn tại, nhưng runtime shell hiện tại chưa mount portal."

**Thực tế hiện nay (03/05):** ✅ **ĐÃ THAY ĐỔI HOÀN TOÀN**

Portal đã được mount đầy đủ. `portalRoutes.tsx` hiện có 20 routes thật đang hoạt động:

| Route | Component | Trạng thái |
| --- | --- | --- |
| `/portal` (index) | `TenantDashboard` | Active |
| `/portal/dashboard` | `TenantDashboard` | Active |
| `/portal/invoices` | `PortalInvoiceList` | Active |
| `/portal/invoices/:id` | `PortalInvoiceDetail` | Active |
| `/portal/payments/history` | `PortalPaymentHistory` | Active |
| `/portal/balance` | `PortalBalanceDetail` | Active |
| `/portal/contract` | `PortalContractView` | Active |
| `/portal/contracts` | `PortalContractView` | Active |
| `/portal/tickets` | `PortalTicketList` | Active |
| `/portal/tickets/create` | `PortalCreateTicket` | Active |
| `/portal/tickets/:id` | `PortalTicketDetail` | Active |
| `/portal/amenities` | `PortalAmenityList` | Active |
| `/portal/amenities/my-bookings` | `PortalMyBookings` | Active |
| `/portal/visitors` | `PortalVisitorList` | Active |
| `/portal/announcements` | `Announcements` | Active |
| `/portal/faq` | `Faq` | Active |
| `/portal/profile` | `Profile` | Active |
| `/portal/notifications` | `NotificationCenter` | Active |
| `/portal/service-requests` | `ServiceRequests` | Active |
| `/portal/documents` | `Documents` | Active |

**→ Toàn bộ AD-44, AD-45, AD-46, AD-47, AD-48 trong tài liệu gốc không còn bị chặn bởi router.**

### 1.2 Owner Workspace — Route có thêm mới

**Route mới trong `ownerRoutes.tsx` chưa có trong tài liệu gốc:**

| Route mới | Component | Ghi chú |
| --- | --- | --- |
| `/owner/announcements` | `AnnouncementPage` | Module communications mới mount |
| `/owner/notifications` | `NotificationPage` | Module notifications mới mount |
| `/owner/leads` | `LeadsPage` | Module quản lý khách đăng ký mới |
| `/owner/reports` | `ReportDashboard` | Module báo cáo & analytics mới |
| `/owner/assets` | `AssetCatalog` | Module quản lý tài sản mới |

**Route đã thay đổi logic phân quyền:**

Tài liệu gốc không ghi rõ cấu trúc phân quyền trong route. Hiện tại:
- Routes chỉ dành cho `Owner|SuperAdmin` được bọc bởi `ProtectedRoute allowedRoles={['Owner', 'SuperAdmin']}`.
- Routes dành cho Staff (không có guard role cứng): `staff/dashboard`, `staff/my-tickets`, `staff/visitor-checkin`, `staff/amenity-checkin`, `staff/:id/ratings`, `tickets/:id`.

---

## PHẦN 2: THAY ĐỔI SCHEMA DATABASE (TRỌNG YẾU)

### 2.1 Bảng MỚI đã xuất hiện trong schema live — Không có trong tài liệu gốc

| Bảng mới | Số dòng hiện có | Ghi chú |
| --- | --- | --- |
| `smartstay.handover_checklists` | 2 | Bàn giao phòng — đã có dữ liệu thật |
| `smartstay.handover_items` | 18 | Item checklist bàn giao — đã có dữ liệu thật |
| `smartstay.handover_asset_snapshots` | 0 | Snapshot tài sản tại thời điểm bàn giao |
| `smartstay.room_inquiries` | 0 | Đã tạo bảng nhưng chưa có dữ liệu |
| `smartstay.announcements` | 0 | Đã tạo bảng nhưng chưa có dữ liệu |
| `smartstay.assets` | 19 | Danh mục tài sản tổng (Tủ lạnh, Máy lạnh...) |
| `smartstay.room_assets` | 50 | Gán tài sản cụ thể vào từng phòng |
| `smartstay.contract_addendums` | 7 | Phụ lục hợp đồng |

**Ý nghĩa cập nhật tài liệu:**

- **Handover Persistence**: ✅ **ĐÃ CÓ BACKEND**. Cần tạo AD mới cho flow handover.
- **Announcements**: ✅ **Bảng đã tồn tại**. Service `announcementService.ts` đã sẵn sàng.
- **Assets**: ✅ **Bảng đã tồn tại**. Module quản lý tài sản đã triển khai.
- **Addendums**: ✅ **Bảng đã tồn tại**. Hỗ trợ quản lý phụ lục hợp đồng.

### 2.2 Bảng đã có trong tài liệu gốc — Nay đã có dữ liệu thật

| Bảng | Trạng thái trong tài liệu gốc | Trạng thái hiện tại |
| --- | --- | --- |
| `smartstay.room_status_history` | "chưa thấy write path" | ✅ 15 rows — đã có write path |
| `smartstay.maintenance_logs` | "chưa thấy service/UI ghi" | ✅ 8 rows — đã có dữ liệu |
| `smartstay.contract_renewals` | "chưa thấy flow tạo renewal" | ✅ 3 rows — đã có dữ liệu |
| `smartstay.contract_transfers` | Chưa được nêu riêng | 1 row |
| `smartstay.invoice_utility_snapshots` | Tài liệu ghi là đã có | 3 rows |
| `smartstay.invoice_utility_overrides` | Tài liệu ghi là đã có | 3 rows |

---

## PHẦN 3: THAY ĐỔI EDGE FUNCTIONS (TRỌNG YẾU)

### 3.1 Edge Functions — Bảo mật & `verify_jwt`

| Edge Function | `verify_jwt` gốc (18/04) | `verify_jwt` hiện tại (03/05) | Thay đổi? |
| --- | --- | --- | --- |
| **`create-contract`** | `false` (vấn đề P0) | **`true`** | ✅ **ĐÃ VÁ** |
| **`create-user`** | `false` (vấn đề P0) | **`true`** | ✅ **ĐÃ VÁ** |
| `create-utility-invoice` | `false` | `false` | ❌ Vẫn chưa vá |
| `run-utility-billing` | `false` | `false` | ❌ Vẫn chưa vá |

---

## PHẦN 4: THAY ĐỔI SERVICE LAYER

### 4.1 Service mới — Chưa có trong tài liệu gốc

| Service mới | File | Ghi chú |
| --- | --- | --- |
| `visitorService.ts` | `src/services/visitorService.ts` | Quản lý khách vãng lai |
| `portalAddendumService.ts` | `src/services/portalAddendumService.ts` | Tenant xem phụ lục hợp đồng |
| `ownerLeadService.ts` | `src/services/ownerLeadService.ts` | Quản lý leads (đơn thuê mới) |
| `announcementService.ts` | `src/services/announcementService.ts` | Quản lý thông báo (Owner) |
| `reportService.ts` | `src/services/reportService.ts` | Hệ thống báo cáo & analytics |
| `publicListingsService.ts` | `src/services/publicListingsService.ts` | Landing page & xem phòng công khai |
| `assetService.ts` | `src/services/assetService.ts` | Quản lý kho tài sản & gán phòng |

---

## PHẦN 10: KIẾN TRÚC "SOFT LAUNCH" (MỚI)

**Phát hiện quan trọng (03/05):** Hệ thống đang vận hành theo mô hình "Dual-Mode".

### 10.1 Marketplace Dashboard (Bề mặt ra mắt tối giản)
- File: `src/views/admin/MarketplaceDashboard.tsx`
- **Đặc điểm:** Đây là UI mới dành cho giai đoạn Launch, cố tình ẩn đi các module phức tạp (Contracts, Invoices, Payments, Portal, Reports) để tập trung vào việc xuất bản phòng trống và nhận đơn thuê.
- **Ghi chú:** Toàn bộ code cho các module bị ẩn **vẫn tồn tại và hoạt động** ở tầng route/service.

---

## PHẦN 7: ACTIVITY DIAGRAM MỚI CẦN THÊM

| AD mới | Module | Lý do |
| --- | --- | --- |
| **AD-49** | Tạo handover checklist | `handover_checklists` đã có dữ liệu thật |
| **AD-50** | Gửi inquiry phòng | `room_inquiries` đã có bảng & logic leads |
| **AD-51** | Đăng announcement | `announcements` đã có bảng & UI quản lý |
| **AD-52** | Ký phụ lục hợp đồng | `contract_addendums` mới triển khai |
| **AD-53** | Xem báo cáo tài chính | `reportService.ts` triển khai aggregation thật |
| **AD-54** | Quản lý tài sản | `assetService.ts` + `AssetCatalog.tsx` |

---

*Delta report phân tích bởi Antigravity — 2026-05-03*
*Dùng để cập nhật: `docs/smartstay-system-activity-analysis-20260418.md`*
