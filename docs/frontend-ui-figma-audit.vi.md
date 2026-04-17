# SmartStay Frontend Audit Và Figma Redesign Spec

## 0. Mục tiêu tài liệu

Tài liệu này được biên soạn để:

- AI Figma hiểu đầy đủ cấu trúc frontend hiện tại mà không cần đọc code.
- Frontend team có một đặc tả rõ ràng để redesign UI nhưng không làm sai logic nghiệp vụ.
- Chuẩn hóa design system cho toàn bộ SmartStay theo hướng hiện đại, tối giản, dễ dùng và đồng bộ.

Phạm vi quét đã bao gồm:

- Route và layout trong `src/App.tsx`, `src/routes/*`.
- Màn hình trong `src/views/**/*`.
- Component trong `src/components/**/*`.
- Schema validation trong `src/schemas/*`.
- Service/business layer trong `src/services/*`.
- Tài liệu nghiệp vụ trong `docs/contract-lifecycle-workflow.md`, `docs/contract-representative-occupants-flow.md`, `docs/utility-contract-amenity-standard-flow.md`, `docs/utility-billing-demo.md`, `docs/amenity-governance-spec-vi.md`.

## 1. Tổng quan kiến trúc frontend hiện tại

### 1.1 Stack

- Framework: React 18 + Vite.
- Router: React Router.
- State/data: Zustand + TanStack Query.
- Styling: Tailwind CSS + CSS variables trong `src/index.css`.
- Backend: Supabase.
- Icon: Lucide.
- Font hiện có: `Inter` là font chính, `Syne` được dùng như font display.

### 1.2 Actor và namespace

| Actor | Namespace chính | Layout | Ghi chú |
| --- | --- | --- | --- |
| Guest | `/`, `/public/*`, `/listings*` | `PublicLayout` | Marketing, auth, browse listing, apply |
| Owner | `/owner/*` | `AdminLayout` | Không gian quản trị chính |
| Staff | `/staff/*` | `StaffLayout` | Không gian vận hành hiện trường |
| Tenant | `/portal/*` | `PortalLayout` + `PortalAuthGuard` | Cổng cư dân |
| Super Admin | `/super-admin/*` | `SuperAdminLayout` | Quản trị đa tenant, hiện còn scaffold |

### 1.3 Layout shell hiện tại

- `AdminLayout`: sidebar trái co giãn, topbar, content max-width `1280px`.
- `StaffLayout`: giống admin nhưng có hero/header riêng cho workspace vận hành.
- `PortalLayout`: desktop có sidebar gradient, mobile có bottom navigation, dùng top bar riêng.
- `PublicLayout`: topbar + footer marketing.
- `SuperAdminLayout`: shell tối màu riêng biệt, tách hoàn toàn khỏi hệ visual còn lại.

### 1.4 Token hiện có trong code

Token hiện tại trong `src/index.css` đang xoay quanh:

- Primary: `#1B3A6B`
- Secondary: `#0D8A8A`
- Accent: `#F26419`
- Background: `#F8FAFC`
- Foreground: `#1E293B`
- Success: `#10B981`
- Warning: `#F59E0B`
- Destructive: `#EF4444`

Nhận xét: bộ màu nền tảng tốt, nhưng cách áp dụng ở từng màn hình chưa thống nhất.

## 2. Inventory màn hình theo route

### 2.1 Public và Auth

| Route | Màn hình | Actor | Mục đích | Chức năng chính | Thành phần chính |
| --- | --- | --- | --- | --- | --- |
| `/` | LandingPage | Guest | Landing marketing + điều hướng theo role | Hero, lợi ích sản phẩm, FAQ, preview screenshot, CTA đăng nhập | Public hero, tab content, CTA, screenshot section |
| `/login` | LoginPage | Guest, Owner, Staff, Tenant, Super Admin | Đăng nhập hợp nhất | Email, password, remember me, lockout sau 5 lần sai, dev quick accounts, redirect theo role | Auth card, input, button, helper links |
| `/public/forgot-password` | ForgotPasswordPage | Guest | Gửi email reset password | Email input, submit Supabase reset | Form đơn giản |
| `/public/reset-password` | ResetPasswordPage | Guest | Đặt lại mật khẩu | Kiểm tra recovery session, nhập password mới, confirm password | Password form |
| `/public/change-password` | ChangePasswordPage | Người dùng đã có session | Đổi mật khẩu | Current password, new password, confirm | Password form |
| `/public/register` | RegisterPage | Guest muốn thành tenant prospect | Tạo tài khoản tenant | Họ tên, email, điện thoại, mật khẩu, đồng ý điều khoản; tạo profile prospect và auto login | Auth form |
| `/portal/verify-otp` | OtpVerification | Guest/Tenant | Xác minh OTP | 6 ô OTP, resend timer | OTP form |
| `/portal/forgot-password` | Portal ForgotPassword | Tenant | Quên mật khẩu kiểu portal | Identifier -> OTP -> mật khẩu mới | Multi-step form, hiện thiên về scaffold UI |
| `/listings` | ListingsPage | Guest/Tenant | Duyệt listing công khai | Search, filter giá/diện tích/loại phòng, sort, grid card | Filter bar, card grid, mobile filter drawer |
| `/listings/:id` | ListingDetailPage | Guest/Tenant | Xem chi tiết listing | Hero, gallery, giá, sức chứa, tiện ích, quy trình, CTA apply, quick inquiry | Detail sections, CTA, QuickInquiryModal |
| `/listings/:id/apply` | ListingApplyPage | Guest/Tenant | Nộp hồ sơ thuê | Nhánh theo auth state và tenant stage, submit application | Guard state, form, summary card |

### 2.2 Owner workspace `/owner/*`

| Route | Màn hình | Actor | Mục đích | Chức năng chính | Thành phần chính |
| --- | --- | --- | --- | --- | --- |
| `/owner/dashboard` | Dashboard | Owner | Tổng quan vận hành | KPI, chart doanh thu, occupancy, recent payments, recent tickets, electricity chart | KPI cards, charts, quick actions |
| `/owner/buildings` | BuildingList | Owner | Quản lý tòa nhà | Search, filter, sort, table/grid, tạo mới | Filter panel, cards, table, modal |
| `/owner/buildings/:id` | BuildingDetail | Owner | Xem chi tiết tòa nhà | Tabs overview/rooms/images/ownership/reports, edit, delete, export | Detail hero, rooms table, ownership table, gallery |
| `/owner/rooms` | RoomList | Owner | Quản lý phòng | Search, filter, sort, table/grid, tạo mới | Cards, table, modal |
| `/owner/rooms/:id` | RoomDetail | Owner | Chi tiết phòng | Overview, images, assets, contracts, history, edit/delete | Gallery, asset table, contract table, history |
| `/owner/rooms/:id/handover` | HandoverChecklist | Owner | Biên bản bàn giao phòng | Checklist theo nhóm, note, ảnh, chữ ký | Checklist sections, asset list |
| `/owner/tenants` | TenantList | Owner | Quản lý cư dân | Search, filter trạng thái/tòa nhà, tạo mới, danh sách | DataTable, filter drawer, modal |
| `/owner/tenants/:id` | TenantDetail | Owner | Hồ sơ cư dân 360 độ | Hồ sơ, liên hệ, hợp đồng, hóa đơn, ví, phản hồi, onboarding | Tabbed detail, tables, ledger, progress |
| `/owner/tenants/:id/balance` | TenantBalance | Owner | Quản lý số dư cư dân | Nạp trừ hoàn offset công nợ | Summary cards, balance modals |
| `/owner/owners` | OwnerList | Owner | Quản lý chủ sở hữu | Search, filter, tạo mới, list/detail | Table, modal |
| `/owner/owners/:id` | OwnerDetail | Owner | Chi tiết chủ sở hữu | Portfolio building, contact, ownership info | Detail cards, related list |
| `/owner/contracts` | ContractList | Owner | Quản lý hợp đồng | Search, filter, export, copy code, open detail | List cards/table, status chip |
| `/owner/contracts/create` | CreateContractWizard | Owner | Tạo hợp đồng mới | 4 bước cư trú/điều khoản/dịch vụ/xác nhận | Wizard, selector, summary |
| `/owner/contracts/addendums` | AddendumListPage | Owner | Quản lý phụ lục | List phụ lục, tạo phụ lục, trạng thái ký | Table/list, modal |
| `/owner/contracts/:id` | ContractDetail | Owner | Chi tiết hợp đồng | Overview, occupants, transfers, invoices, add occupant, transfer, liquidate | Detail tabs, action modals |
| `/owner/invoices` | InvoiceList | Owner | Quản lý hóa đơn | Tabs theo trạng thái, create single, create bulk, record payment, reminder | Table, counters, modals |
| `/owner/invoices/:id` | InvoiceDetail | Owner | Chi tiết hóa đơn | Itemized fees, utility snapshot, payment history, resend/print | Summary card, table, payment panel |
| `/owner/payments` | PaymentList | Owner | Quản lý giao dịch thanh toán | Filter, approve/reject pending, list transaction | Table, pending summary banner |
| `/owner/payments/:id` | PaymentDetail | Owner | Chi tiết giao dịch | Evidence image, related invoice, approve/reject, timeline | Detail card, evidence preview |
| `/owner/payments/webhooks` | WebhookLogs | Owner | Giám sát webhook thanh toán | Channel health, logs, payload, retry | Health cards, logs table, detail modal |
| `/owner/services` | ServiceCatalog | Owner | Quản lý catalog dịch vụ | Filter, CRUD service, update price history | DataTable, service modal, price modal |
| `/owner/assets` | AssetCatalog | Owner | Quản lý tài sản | Filter theo condition/type, CRUD, assign room | Table/grid, asset modal |
| `/owner/tickets` | TicketList | Owner | Quản lý ticket hỗ trợ | Stats, quick filter, advanced filter, tạo ticket | Stats row, filter, table |
| `/owner/tickets/:id` | TicketDetail | Owner | Chi tiết ticket | Timeline, comments, attachments, assignee, status transition | Detail card, comment thread |
| `/owner/staff/dashboard` | StaffDashboard | Owner | Theo dõi hiệu suất staff | KPI staff, workload, progress | KPI cards, charts |
| `/owner/staff/my-tickets` | StaffMyTickets | Owner | Màn hình kiểu queue xử lý ticket | Kanban/table, xử lý ticket | TicketKanban, list cards |
| `/owner/staff/visitor-checkin` | VisitorCheckin | Owner | Giám sát quy trình khách ra vào | Check-in/check-out visitor | Table/list, action buttons |
| `/owner/staff/amenity-checkin` | AmenityCheckin | Owner | Giám sát check-in tiện ích | Validate booking, check-in/out | Booking table |
| `/owner/staff/:id/ratings` | StaffRatings | Owner | Đánh giá nhân sự | Ratings, chart, review cards | Stats + review feed |
| `/owner/amenities` | AmenityManagementPage | Owner | Quản trị chính sách tiện ích | Policy, version, exception, notification queue | Tabs, cards, forms |
| `/owner/utility-billing` | UtilityHubPage | Owner | Hub điện nước | Giới thiệu policy/override/billing run, metric gần nhất | Info cards, metrics |
| `/owner/announcements` | AnnouncementPage | Owner | Quản lý thông báo | CRUD announcement, pin, publish | Cards/list, modal |
| `/owner/notifications` | NotificationPage | Owner | Nhật ký gửi thông báo | Xem trạng thái push/sms/email | Table/list, currently mock heavy |
| `/owner/reports` | ReportsHub | Owner | Cổng báo cáo | Chọn report domain | Report cards |
| `/owner/reports/occupancy` | OccupancyReport | Owner | Báo cáo lấp đầy | Occupancy chart, by building/room | Chart + table |
| `/owner/reports/financial` | FinancialReport | Owner | Báo cáo tài chính | Revenue, collection, trend | Charts, metrics |
| `/owner/reports/debt` | DebtReport | Owner | Báo cáo công nợ | Overdue, debt aging | Table + chart |
| `/owner/reports/room-lifecycle` | RoomLifecycleReport | Owner | Vòng đời phòng | Status transition, heatmap | Charts, heatmap |
| `/owner/reports/nps` | NPSReport | Owner | Báo cáo hài lòng cư dân | NPS trend, feedback | Charts, cards |
| `/owner/reports/staff` | StaffReport | Owner | Hiệu suất staff | KPI theo nhân sự | Table + charts |
| `/owner/reports/alerts` | AlertsReport | Owner | Cảnh báo vận hành | Alert summary và priority | Cards + list |
| `/owner/settings/users` | UserListPage | Owner | Quản trị user | List user, create/edit, reset password | Stats cards, DataTable, modal |
| `/owner/settings/users/permissions` | PermissionMatrix | Owner | Ma trận phân quyền | Xem/sửa permission theo role | Matrix table |
| `/owner/settings/utility-policies` | UtilityPoliciesPage | Owner | Chính sách điện nước | Tạo/cập nhật policy theo scope | Form + policy cards |
| `/owner/settings/utility-overrides` | UtilityOverridesPage | Owner | Điều chỉnh thủ công kỳ điện nước | Tạo override theo hợp đồng/kỳ | Form + list |
| `/owner/settings/billing-runs` | BillingRunsPage | Owner | Điều phối đợt tính phí | Preview, run billing, xem snapshot | Form, preview summary, run history |
| `/owner/settings/system` | SystemSettings | Owner | Cấu hình hệ thống | General, notification, security, database | Tab settings scaffold |
| `/owner/settings/audit-logs` | AuditLogs | Owner | Nhật ký hoạt động | Filter, xem action log | Log table/timeline |

Ghi chú:

- `/admin/*` là legacy alias, hiện redirect sang `/owner/*`.
- Các route `reports/*` và `settings/*` bị khóa bằng `ProtectedRoute requiredRole="Owner"`.

### 2.3 Staff workspace `/staff/*`

| Route | Màn hình | Actor | Mục đích | Chức năng chính | Thành phần chính |
| --- | --- | --- | --- | --- | --- |
| `/staff/dashboard` | StaffDashboard | Staff | Tổng quan việc trong ca | KPI cá nhân/ca trực, ticket workload | KPI cards, task list |
| `/staff/my-tickets` | StaffMyTickets | Staff | Danh sách việc cần xử lý | Kanban/list, nhận việc, resolve | TicketKanban, action modal |
| `/staff/tickets/:id` | TicketDetail | Staff | Chi tiết ticket | Comment, attachment, đổi trạng thái | Detail thread |
| `/staff/visitor-checkin` | VisitorCheckin | Staff | Check-in khách | Xác nhận/huỷ visitor | Table/list |
| `/staff/amenity-checkin` | AmenityCheckin | Staff | Check-in tiện ích | Xác thực booking, trạng thái sử dụng | Table/list |

### 2.4 Tenant portal `/portal/*`

| Route | Màn hình | Actor | Mục đích | Chức năng chính | Thành phần chính |
| --- | --- | --- | --- | --- | --- |
| `/portal/dashboard` | TenantDashboard | Tenant | Tổng quan cư dân | Contract summary, invoice due, tickets, wallet, notification | Hero, quick actions, cards |
| `/portal/onboarding` | Onboarding | Tenant mới | Kích hoạt cư dân | 6 bước hồ sơ, giấy tờ, emergency contact, handover, deposit, contract | Multi-step onboarding |
| `/portal/invoices` | Portal InvoiceList | Tenant | Xem hóa đơn và thanh toán | Filter, search, detail bottom sheet, SePay QR, manual reconciliation | Summary cards, list/table, bottom sheet |
| `/portal/invoices/:id` | Portal InvoiceDetail | Tenant | Route detail hóa đơn | Wrapper redirect/query-param vào invoice list detail | Deep link route |
| `/portal/payments/history` | PaymentHistory | Tenant | Lịch sử thanh toán | List card theo giao dịch | Payment list |
| `/portal/balance` | BalanceDetail | Tenant | Ví và số dư | Ledger immutable, balance summary | Ledger table/list |
| `/portal/contract` | ContractView | Tenant | Xem hợp đồng hiện tại | Status, rent, chu kỳ, addendum, services | Contract summary card |
| `/portal/tickets` | TicketList | Tenant | Theo dõi yêu cầu hỗ trợ | Filter theo trạng thái, danh sách ticket, rating sau resolved | Ticket cards |
| `/portal/tickets/create` | CreateTicket | Tenant | Tạo yêu cầu mới | Chọn category, priority, tiêu đề, mô tả, ảnh | Guided form |
| `/portal/tickets/:id` | TicketDetail | Tenant | Chi tiết ticket | Timeline/chat, attachment, trạng thái, rating | Detail thread |
| `/portal/amenities` | AmenityList | Tenant | Đặt tiện ích | Browse amenity, chọn ngày, slot, xác nhận booking | Amenity cards, BottomSheet flow |
| `/portal/amenities/my-bookings` | MyBookings | Tenant | Xem lịch đặt tiện ích | Upcoming/past, cancel nếu còn >2 giờ | Tab list, confirm modal |
| `/portal/visitors` | VisitorList | Tenant | Đăng ký khách thăm | Hiện đang tạm đóng, dẫn sang ticket support | Placeholder page |
| `/portal/announcements` | Announcements | Tenant | Xem thông báo | List, detail, mark read, share | Cards/list, bottom sheet |
| `/portal/faq` | Faq | Tenant | Tự phục vụ thông tin | Category tab, detail | Accordion/list |
| `/portal/profile` | Profile | Tenant | Hồ sơ cá nhân | Personal info, security, feedback, notification prefs, pass QR, logout | Profile hub, bottom sheets |
| `/portal/notifications` | NotificationCenter | Tenant | Trung tâm thông báo | Tabs unread/all, mark read, swipe delete, route by type | Swipe cards |
| `/portal/service-requests` | ServiceRequests | Tenant | Đăng ký/hủy dịch vụ | Current services, available services, gửi request staff | Cards, bottom sheet |
| `/portal/documents` | Documents | Tenant | Xem giấy tờ hồ sơ | Document cards, category count, open file | Document list |

### 2.5 Super Admin `/super-admin/*`

| Route | Màn hình | Actor | Mục đích | Chức năng chính | Trạng thái hiện tại |
| --- | --- | --- | --- | --- | --- |
| `/super-admin/dashboard` | Dashboard | Super Admin | Tổng quan nền tảng | KPI platform | Có UI riêng |
| `/super-admin/organizations` | Organizations | Super Admin | Quản lý tenant organizations | Danh sách tổ chức, mapping project | Scaffold placeholder |
| `/super-admin/owners` | Owners | Super Admin | Quản lý owner toàn nền tảng | Danh sách owner accounts | Scaffold placeholder |
| `/super-admin/audit` | Risk & Audit | Super Admin | Audit và risk monitoring | Audit, support impersonation | Scaffold placeholder |
| `/super-admin/settings` | Platform Settings | Super Admin | Pricing, feature flags, usage | Platform configs | Scaffold placeholder |

## 3. Inventory component phục vụ Figma

Chỉ liệt kê các component có giá trị thiết kế; helper thuần logic không đưa vào inventory Figma.

### 3.1 Layout component

| Component | Loại | Vai trò | Nơi dùng |
| --- | --- | --- | --- |
| `AdminLayout` | App shell | Sidebar + topbar + content wrapper cho owner | Owner workspace |
| `StaffLayout` | App shell | App shell tối ưu cho staff vận hành | Staff workspace |
| `PortalLayout` | App shell | Desktop sidebar + mobile bottom nav + portal header | Tenant portal |
| `SuperAdminLayout` | App shell | Console tối màu tách biệt | Super Admin |
| `PublicLayout` | App shell | Header/footer cho public site | Public/auth/listings |
| `Sidebar` | Navigation | Menu điều hướng theo quyền | Owner/Staff |
| `Topbar` | Navigation/header | Search, actions, user actions | Owner/Staff |
| `BottomNavigation` | Mobile nav | Điều hướng portal mobile | Portal |
| `BottomSheet` | Overlay | Pattern detail/action trên portal | Invoice detail, booking, profile sheet |

### 3.2 Base UI component

| Component | Loại | Vai trò | Ghi chú hiện trạng |
| --- | --- | --- | --- |
| `Button` | Primitive | CTA chính/phụ/nguy hiểm/ghost | Đang dùng uppercase nặng, variant chưa đồng nhất toàn app |
| `Card` | Primitive | Khung nội dung, stat, detail | Dùng tốt nhưng style nhiều biến thể tự phát |
| `Badge` / `StatusBadge` | Primitive | Hiển thị trạng thái | Semantic chưa thống nhất giữa module |
| `Select` | Form primitive | Select dropdown | Chưa phải source duy nhất; nhiều màn hình còn dùng native select |
| `Modal` | Overlay | Dialog CRUD/action | Portal dùng bottom sheet, admin dùng modal, chưa có guideline thống nhất |
| `DataTable` | Data component | Table chung có sort/pagination/actions | Một số màn hình bỏ qua và tự vẽ table riêng |
| `FileUpload` | Data/form | Upload file có progress | Dùng ở một số form, hữu ích cho design system |
| `Spinner`, `Skeleton`, `PageSkeleton`, `OfflineBanner` | Feedback | Loading/offline state | Cần chuẩn hóa visual loading/error/empty |
| `SafeImage` | Media | Ảnh fallback | Dùng trong public/portal cards |

### 3.3 Business component

| Component | Domain | Vai trò |
| --- | --- | --- |
| `QuickInquiryModal` | Public listings | Hỏi nhanh về phòng |
| `BuildingModal` | Buildings | Tạo/sửa tòa nhà |
| `RoomModal` | Rooms | Tạo/sửa phòng |
| `TenantFormModal` | Tenants | Tạo/sửa cư dân |
| `OwnerModal` | Owners | Tạo/sửa chủ sở hữu |
| `UserModal` | Settings | Tạo/sửa user hệ thống |
| `ResetPasswordModal` | Settings | Reset password user |
| `AnnouncementModal` | Communications | Tạo/sửa thông báo |
| `TicketFormModal` | Tickets | Tạo ticket nội bộ/admin |
| `TicketAdvancedFilter` | Tickets | Bộ lọc nâng cao ticket |
| `TicketKanban` | Tickets | View kanban theo trạng thái |
| `CreateInvoiceModal` | Finance | Tạo hóa đơn lẻ |
| `BulkInvoiceModal` | Finance | Tạo hóa đơn hàng loạt từ preview |
| `RecordPaymentModal` | Finance | Ghi nhận giao dịch thanh toán |
| `AddOccupantModal` | Contracts | Thêm người ở cùng |
| `TransferContractModal` | Contracts | Chuyển người đại diện |
| `LiquidationModal` | Contracts | Thanh lý hợp đồng |
| `TerminateContractModal` | Contracts | Chấm dứt hợp đồng |
| `CreateAddendumModal` | Contracts | Tạo phụ lục |
| `ProfileTab`, `ContactTab`, `ContractTab`, `InvoiceTab`, `WalletTab`, `FeedbackTab`, `OnboardingTab` | Tenant detail | Nhóm sub-screen trong hồ sơ cư dân |

## 4. Inventory form

### 4.1 Form nghiệp vụ chính

| Màn hình/Form | Field chính | Validation chính | Submit action |
| --- | --- | --- | --- |
| Login | email, password, rememberMe | required, lockout local 5 lần/5 phút | `authStore.login`, redirect theo role |
| Register | fullName, email, phone, password, confirmPassword, agreeTerms | required, password match, agree terms | tạo tenant prospect + auto login |
| ForgotPassword | email | email hợp lệ | gửi reset email qua Supabase |
| ResetPassword | newPassword, confirmPassword | min 8 ký tự, trùng khớp | cập nhật password |
| Listing apply | fullName, preferredMoveIn, phone, email, verificationMethod, verificationValue, notes | tenant-only, resident bị chặn, tránh duplicate application mở | `publicListingsService.submitApplication` |
| Quick inquiry | fullName, phone, message | required nhẹ | `publicListingsService.submitInquiry` |
| BuildingModal | buildingCode, buildingName, type, totalFloors, province, district, ward, address, amenities, managementPhone, managementEmail | tên >= 3, địa chỉ >= 5, năm xây 1900..hiện tại, email hợp lệ | create/update building |
| RoomModal | buildingId, roomCode, floorNumber, roomType, directionFacing, furnishing, maxOccupancy, conditionScore, hasBalcony, amenities, description | roomCode >= 2, occupancy >= 1, area/rent hợp lệ | create/update room |
| TenantFormModal | fullName, phone, CCCD/passport, issued date/place, email, gender, DOB, nationality, occupation, permanentAddress, avatar, ID front/back, vehiclePlates | required theo profile cơ bản | create/update tenant |
| OwnerModal | fullName, CCCD, phone, email, taxCode, address, avatar | required cơ bản | create/update owner |
| UserModal | email, username, role, active, fullName, phone, CCCD, dob, gender, address, avatar, 2FA, force change password | email hợp lệ, role required | create/update user |
| CreateContractWizard Step 1 | building, room, primaryTenant, occupants | required, occupants không chứa primary tenant | lưu step data |
| CreateContractWizard Step 2 | contractType, startDate, endDate, rentPrice, deposit, paymentCycle, paymentDueDay, discount/promo | end > start, due day 1..31, rent >= 1000 | lưu step data |
| CreateContractWizard Step 3 | fixed services, utilityPolicy, ownerRep fullName/cccd/role | utilityPolicy required | lưu step data |
| CreateContractWizard Step 4 | confirmation | phải qua các bước trước | create contract |
| AddOccupantModal | tenant, moveInDate, relationship, note | tenant required | add occupant |
| TransferContractModal | newRepresentative, transferDate, note | chỉ chọn occupant active, không phải primary hiện tại | transfer contract |
| LiquidationModal | liquidationDate, reason, deductFromDeposit, extraCharges | date + reason | liquidate contract |
| TerminateContractModal | terminationDate, reason, penalty, note | date + reason | terminate contract |
| CreateAddendumModal | addendumCode, type, title, effectiveDate, status, attachment | nếu `Signed` thì cần file | create addendum |
| CreateInvoiceModal | contract, month, dueDate, discount, discountReason, note | contract required | preview rồi create single invoice |
| BulkInvoiceModal | billingMonth, defaultDueDate, building filter, selected contracts | preview row status ready/blocked/duplicate/error | create batch invoices |
| RecordPaymentModal | invoice, amount, method, proof, transactionCode, notes | amount > 0, overpayment confirm | save pending hoặc confirmed |
| TicketFormModal | category, building, room, priority, SLA deadline, tenant, assignee, title, description, attachments | required core fields | create ticket nội bộ |
| Portal CreateTicket | category, priority, title, description, attachments | title >= 6, ảnh JPG/PNG/WEBP tối đa 4 | `ticketService.createTicket` |
| AnnouncementModal | title, isPinned, type, status, publishAt, targetGroups, content, buildingIds | required nội dung + target | create/update announcement |
| UtilityPoliciesPage | scopeType, scopeId, effectiveFrom, effectiveTo, code, name, description, electricBase, minElectricFloor, waterPerPerson, waterBase, minWaterFloor, roundingIncrement, electricHotSeasonMultiplier, locationMultiplier, seasonMonths, device adjustments | required scope/name/code, multiplier/date hợp lệ | create/update policy |
| UtilityOverridesPage | contractId, billingPeriod, reason, electricBaseOverride, waterBaseOverride, occupantsForBillingOverride, hotSeasonOverride, locationOverride, finalOverride | contract + billing period required | upsert override |
| BillingRunsPage | billingPeriod, dueDate, building filter/preset | cần preview trước run | preview/start billing run |
| Amenity management forms | policy/version/exception/review/queue notification | phụ thuộc tab; status version `draft/pending_approval/approved/archived` | create/update/review policy version |
| Portal Profile personal info | fullName, phone, email | basic validation | update tenant profile |
| Portal Profile security | current/new/confirm password, 2FA toggle | password match | update security preferences |
| Portal notification prefs | sms, email, push | không có validation phức tạp | update notification preferences |

### 4.2 Form filter và tìm kiếm

| Màn hình | Field filter/tìm kiếm | Tác động UI |
| --- | --- | --- |
| ListingsPage | keyword, roomType, minPrice, maxPrice, minArea, maxArea, sort | lọc card listing, mobile drawer |
| BuildingList | search, buildingType, status, sort | đổi table/grid result |
| RoomList | search, building, status, type, sort | đổi card/table result |
| TenantList | search, status, activeContract, onboardingComplete, building | lọc table tenant |
| ContractList | search, status, building, room, expiring, sort | lọc list hợp đồng |
| InvoiceList admin | activeTab status, search, building/contract/tenant/date filters | lọc invoice table + counter |
| PaymentList | method, status, date, keyword | lọc payment list |
| TicketList admin | quick filter, advanced filter: type, priority, status, building, assignee, SLA | lọc table/kanban |
| ServiceCatalog | keyword, type, active state | lọc DataTable service |
| AssetCatalog | keyword, type, condition | lọc tài sản |
| Reports | date range, building, report-specific filters | đổi chart và table |
| Portal InvoiceList | search, status, date range, sort | lọc invoice list portal |
| NotificationCenter | tab unread/all | đổi danh sách thông báo |

## 5. Inventory dữ liệu hiển thị

| Module | Dạng hiển thị | Dữ liệu chính | Action trên UI | Trạng thái cần thiết kế |
| --- | --- | --- | --- | --- |
| Dashboard owner | KPI + chart + recent list | active contracts, open tickets, occupancy, doanh thu, recent payments/tickets | refresh, chọn tòa nhà | loading, empty, error, stale data |
| Building list/detail | cards + table + gallery | building meta, room counts, owners, images | create/edit/delete/export/upload | no data, upload progress |
| Room list/detail | cards + table + tabs | room meta, assets, contracts, history, images | assign asset, mark vacant, edit/delete | vacant/occupied/maintenance/reserved |
| Tenant list/detail | table + tabbed detail | profile, contacts, contracts, invoices, balance, feedback, onboarding | edit, message, top-up/deduct/offset | resident active, checked out, blacklisted |
| Contract list/detail | list/table + tabs | contract summary, occupants, transfer history, invoices | create, add occupant, transfer, liquidate, addendum | draft, signed, active, expired, terminated |
| Invoice list/detail | table + detail sections | amount due, items, payments, utility snapshot, due date | create, bulk create, reminder, print, record payment | unpaid, overdue, paid, cancelled |
| Payment list/detail | table + evidence preview | payment amount, method, status, invoice link, proof | approve, reject | pending, confirmed, rejected, refunded |
| Ticket list/detail | table/kanban + thread | ticket meta, assignee, priority, comments, attachments | assign, comment, status change | open, in progress, resolved, closed |
| Service catalog | table + modal | service info, calc type, active price | create, edit, toggle, update price | active/inactive |
| Asset catalog | table/grid | asset name, type, condition, room assignment | create, edit, delete, assign | new/good/fair/poor |
| Amenity management | cards + tables + tabs | policy, version, exception, notification queue | create, review, approve | draft, pending approval, approved, archived |
| Utility billing | forms + preview cards + run history | policies, overrides, eligible contracts, snapshots | preview, run, view snapshot | draft, running, completed, failed |
| Portal dashboard | hero + quick action + card feed | active contract, invoice due, open tickets, notifications, wallet | open detail screens | active contract / no contract |
| Portal invoice | cards + list + bottom sheet | invoice summary, line items, payment history, bank info | pay via QR, submit reconciliation | pending, partial, paid, overdue |
| Portal amenity | card grid + bottom sheet | amenity info, booking price, slots, bookings | create booking, cancel booking | available, empty, loading |
| Portal ticket | cards + thread | user ticket, category, status, comment | create, comment, rate | open, in progress, resolved |
| Public listings | card grid + detail sections | room name, price, area, capacity, amenity, availability | filter, view detail, apply, inquiry | empty result, loading |

## 6. Logic nghiệp vụ, trạng thái dữ liệu và điều kiện hiển thị

### 6.1 Ma trận trạng thái chính

| Domain | Trạng thái | Ý nghĩa |
| --- | --- | --- |
| Tenant stage | `prospect`, `applicant`, `resident_pending_onboarding`, `resident_active` | Hành trình từ đăng ký tài khoản đến cư dân hoạt động |
| Room | `Vacant`, `Occupied`, `Maintenance`, `Reserved` | Trạng thái phòng trong UI |
| Contract | `Draft`, `Signed`, `Active`, `Expired`, `Terminated`, `Cancelled` | Mapping từ DB `draft/pending_signature/active/expired/terminated/cancelled` |
| Deposit | `Available`, `Deducted`, `Refunded` | Mapping từ DB `pending/received/partially_refunded/refunded/forfeited` |
| Invoice admin | `Unpaid`, `Paid`, `Overdue`, `Cancelled` | UI gộp `draft/pending_payment/partially_paid` thành `Unpaid` |
| Invoice portal | `pending`, `partial`, `paid`, `overdue`, `cancelled` | Phân rã chi tiết hơn cho cổng cư dân |
| Payment | `Pending`, `Confirmed`, `Rejected`, `Refunded` | Duyệt giao dịch và cập nhật hóa đơn |
| Ticket | `Open`, `InProgress`, `Resolved`, `Closed`, `Cancelled` | Lưu ý `Cancelled` trong UI đang bị map về DB `closed` nên round-trip bị mất dữ liệu |
| Amenity policy | `draft`, `pending_approval`, `approved`, `archived` | Dùng ở AmenityManagement |
| Billing run | `draft`, `running`, `completed`, `failed`, `cancelled` | Dùng ở BillingRunsPage |
| Rental application | `draft`, `submitted`, `under_review`, `approved`, `rejected`, `cancelled` | Dùng cho luồng apply listing |

### 6.2 Flow nghiệp vụ chi tiết

#### A. Auth và phân quyền

1. User vào `/login`.
2. Sau đăng nhập, hệ thống lấy profile từ Supabase và resolve role trong `authStore`.
3. Redirect theo role:
   - Owner -> `/owner/dashboard`
   - Staff -> `/staff/dashboard`
   - Super Admin -> `/super-admin/dashboard`
   - Tenant -> `/portal/dashboard` hoặc `/portal/onboarding` tùy stage
4. Sidebar owner/staff render item theo permission trong `rolePermissions`.

#### B. Public listing apply

1. Guest duyệt `/listings` và vào `/listings/:id`.
2. Khi nhấn apply:
   - Nếu chưa đăng nhập -> yêu cầu login/register.
   - Nếu account không phải tenant -> chặn submit.
   - Nếu tenant đã là `resident_pending_onboarding` hoặc `resident_active` -> điều hướng sang portal.
   - Nếu đã có application `draft/submitted/under_review` cho listing đó -> hiển thị trạng thái đã nộp.
3. Form apply lưu thông tin xác minh và note, sau đó tạo rental application với trạng thái ban đầu `submitted`.

#### C. Hành trình tenant

1. Register tạo tenant stage `prospect`.
2. Nộp application phòng chuyển qua trạng thái applicant ở tầng nghiệp vụ.
3. Khi được duyệt và liên kết hồ sơ cư dân, account đi vào `resident_pending_onboarding`.
4. Hoàn thành onboarding 100% sẽ chuyển sang `resident_active`.

#### D. Contract lifecycle

1. Owner tạo hợp đồng qua wizard 4 bước.
2. Hợp đồng gắn phòng, primary tenant, occupants, chính sách điện nước và dịch vụ cố định.
3. Sau khi ký hoặc kích hoạt, contract đi vào `Active`.
4. Trong thời gian hiệu lực:
   - Có thể thêm occupant.
   - Có thể chuyển người đại diện nếu có occupant active khác.
   - Có thể tạo addendum.
5. Kết thúc hợp đồng bằng terminate hoặc liquidate.

#### E. Invoice và payment

1. Invoice được tạo theo từng hợp đồng hoặc bulk theo kỳ.
2. `previewInvoice` và `previewBulkInvoices` cho người dùng xem trước dòng phí và tính hợp lệ.
3. Invoice list hiển thị status UI:
   - `Unpaid`: draft, pending payment, partially paid.
   - `Paid`, `Overdue`, `Cancelled`.
4. Payment record nội bộ có thể:
   - Save Pending: chờ owner duyệt.
   - Save Confirmed: xác nhận ngay, cập nhật `amount_paid`, `paid_date`, `invoice status`.
5. Portal invoice:
   - Hiển thị QR SePay nếu có cấu hình ngân hàng.
   - Nếu auto-confirm thất bại, tenant gửi thông tin đối soát thủ công.
   - Có demo mode invoke edge function `sepay-webhook`.

#### F. Utility billing

1. Utility policy tồn tại theo phân cấp `system -> building -> room -> contract`.
2. Utility override ghi đè policy theo hợp đồng và kỳ thanh toán.
3. Billing run:
   - Chọn kỳ tính phí và hạn thanh toán.
   - Preview danh sách eligible/blocked/duplicate/error.
   - Start run để chốt snapshot.
4. Snapshot phải được coi là immutable trong UI redesign.

#### G. Ticket lifecycle

1. Ticket có thể được tạo từ owner/admin hoặc portal tenant.
2. Trạng thái chính:
   - Open
   - InProgress
   - Resolved
   - Closed
3. Staff queue tập trung ở `StaffMyTickets`.
4. Sau `Resolved`, portal có thể hiển thị rating flow.
5. Rủi ro hiện tại: UI có trạng thái `Cancelled` nhưng DB enum không có `cancelled`; current mapping ghi `Cancelled -> closed`.

#### H. Amenity governance và booking

1. Owner định nghĩa policy, version, exception và audience notification.
2. Tenant vào `/portal/amenities`, chọn tiện ích, ngày, slot, xác nhận booking.
3. `MyBookings` chia `upcoming` và `past`.
4. Tenant chỉ được hủy booking nếu:
   - status là `booked`
   - thời điểm bắt đầu còn lớn hơn `2 giờ`
5. Staff/owner có màn hình check-in tiện ích riêng.

#### I. Onboarding cư dân

1. Step 1: personal info.
2. Step 2: upload giấy tờ tùy thân.
3. Step 3: emergency contact.
4. Step 4: room handover, chỉ hiển thị là chờ admin xác nhận.
5. Step 5: deposit paid, chờ admin xác nhận.
6. Step 6: contract signed, chờ admin xác nhận.
7. Khi `completionPercent` đạt 100% và stage là `resident_pending_onboarding`, hệ thống kích hoạt `resident_active`.

#### J. Notification routing

Portal notification khi click sẽ route theo type:

- invoice mới / invoice đến hạn / payment confirmed -> `/portal/invoices`
- ticket -> `/portal/tickets`
- announcement -> `/portal/announcements`
- contract renew -> `/portal/profile`

### 6.3 Điều kiện hiển thị UI quan trọng

| Điều kiện | Ảnh hưởng UI |
| --- | --- |
| User đã auth vào `/` | redirect thẳng về home path theo role |
| Portal dashboard không có active contract | hiển thị cảnh báo thay vì hero hợp đồng |
| Listing apply với resident | hiển thị CTA đi portal thay vì form apply |
| Listing apply có application đang mở | hiển thị summary trạng thái đã nộp |
| `MyBookings` nếu bắt đầu trong <= 2 giờ | ẩn nút hủy |
| `CreateTicket` tenant không có tenant profile | chặn submit và báo lỗi |
| `TicketDetail` admin/staff | nút action đổi theo trạng thái hiện tại |
| `RoomDetail` | action chính đổi theo `Vacant/Occupied/Maintenance` |
| `TenantDetail` | dữ liệu tab được lazy load theo tab active |
| `RecordPaymentModal` | confirmed payment có xác nhận khi vượt số dư còn lại |
| `TransferContractModal` | chỉ xuất hiện khi có secondary occupant active |
| `HandoverChecklist` item `NotOK` | hiện note/photo bổ sung |
| Portal invoice balance = 0 | khóa phần payment request |
| `Sidebar` owner/staff | menu thay đổi theo permission và role |

### 6.4 Khu vực placeholder, mock hoặc chưa hoàn chỉnh

| Khu vực | Trạng thái | Ảnh hưởng redesign |
| --- | --- | --- |
| Super Admin `organizations/owners/audit/settings` | scaffold placeholder | vẫn cần thiết kế nhưng nên tách phase 2 |
| Portal `VisitorList` | tính năng tạm đóng | cần màn hình disabled state chuẩn |
| Portal `ServiceRequests` | chưa có bảng `service_requests`, hiện chỉ toast yêu cầu | cần thiết kế như “request to staff”, không giả lập self-service hoàn tất |
| Portal forgot password OTP | UI nhiều khả năng demo-first | không nên thiết kế flow xác minh quá sâu nếu backend chưa chốt |
| Admin `NotificationPage` | đang dùng nhiều mock data | thiết kế nên ở mức log viewer nhẹ |
| `UtilityHubPage` | hub thông tin hơn là màn hình nghiệp vụ chính | không đầu tư quá nhiều fidelity |
| Ticket `Cancelled` | mismatch logic với DB enum | cần sửa logic trước hoặc loại trạng thái này khỏi thiết kế |

## 7. Phân tích UI hiện tại

### 7.1 Điểm tích cực

- Đã có phân tách namespace tương đối rõ giữa public, owner, staff, portal và super-admin.
- Bộ màu gốc navy + teal phù hợp domain bất động sản/vận hành.
- Nhiều màn hình đã có loading, empty, error state.
- Dữ liệu nghiệp vụ khá phong phú, đủ để thiết kế dashboard và flows chuyên nghiệp.

### 7.2 Vấn đề UI/UX chính

1. Hệ visual đang bị phân mảnh.
   - Owner/admin, portal, super-admin dùng ba ngôn ngữ thiết kế gần như khác nhau hoàn toàn.

2. Quá nhiều chữ in hoa, tracking rộng và font weight quá nặng.
   - Điều này làm tiếng Việt khó đọc, đặc biệt với heading dài hoặc label có dấu.

3. Bán kính bo góc và shadow đang bị lạm dụng.
   - Rất nhiều khối dùng `rounded-[28px]`, `rounded-[32px]`, `rounded-[36px]`, tạo cảm giác “showcase” hơn là enterprise product.

4. Component chưa thật sự chuẩn hóa.
   - Nhiều màn hình tự định nghĩa input, select, header, filter bar, card, table row thay vì tái sử dụng nguồn chung.

5. Hệ phân cấp thông tin chưa ổn.
   - Nhiều trang có quá nhiều lớp gradient, badge, hero và micro-decoration khiến vùng dữ liệu chính bị chìm.

6. Portal mobile-first nhưng desktop chưa tối ưu.
   - Một số bottom sheet hoặc flow mobile được bê thẳng lên desktop, làm thao tác dài và khó quét.

7. Search/filter pattern không đồng nhất.
   - Có chỗ dùng drawer, có chỗ dùng inline form, có chỗ dùng chip, có chỗ dùng button group.

### 7.3 Vấn đề tiếng Việt và copy

- Nguồn code không cho thấy lỗi mojibake thực trong file, nhưng terminal có thể hiển thị sai encoding.
- Vấn đề thực tế trên UI là:
  - Trộn tiếng Việt và tiếng Anh.
  - Nhiều heading upper-case làm dấu tiếng Việt khó đọc.
  - Một số thuật ngữ chưa thống nhất: `ticket`, `yêu cầu`, `support`, `hỗ trợ`; `owner`, `chủ sở hữu`; `tenant`, `cư dân`, `khách thuê`.

Chuẩn thuật ngữ nên chốt:

- `Cư dân` cho portal.
- `Khách thuê` chỉ dùng trong bối cảnh hợp đồng/listing public khi chưa active resident.
- `Yêu cầu hỗ trợ` thay cho `ticket` ở bề mặt người dùng.
- `Chủ sở hữu` thay cho `owner` trên UI tiếng Việt.
- `Đợt tính phí điện nước` thay cho cách gọi mơ hồ như `billing run` ở bề mặt business.

### 7.4 Rủi ro consistency

- Super Admin đang có theme dark riêng, nếu giữ nguyên sẽ phá vỡ bộ design system chung.
- Portal dùng nhiều card bo tròn lớn và gradient hospitality; admin lại thiên enterprise; public lại thiên marketing.
- Nếu redesign không có component library thống nhất, đội frontend sẽ tiếp tục nhân bản CSS cục bộ.

## 8. Design system đề xuất

### 8.1 Nguyên tắc thiết kế

- Hiện đại nhưng không phô trương.
- Ưu tiên clarity cho data-heavy screen.
- Một hệ component dùng chung cho owner, staff, portal; public site được phép dùng tone marketing hơn nhưng vẫn cùng token.
- Không dùng nhiều hơn 1 màu nhấn mạnh trên cùng một card/screen.
- Không viết uppercase cho heading dài hoặc body text tiếng Việt.

### 8.2 Color system đề xuất

#### A. Brand palette

| Token | HEX | Dùng cho |
| --- | --- | --- |
| `brand.navy.900` | `#0B182C` | Text đậm trên nền sáng, dark surfaces sâu |
| `brand.navy.800` | `#112743` | Sidebar dark, active navigation |
| `brand.navy.700` | `#163257` | Hover primary dark |
| `brand.navy.600` | `#1B3A6B` | Primary brand chính |
| `brand.navy.500` | `#2E5B89` | Link, secondary emphasis |
| `brand.navy.100` | `#DCE7F2` | Background nhẹ cho brand section |
| `brand.teal.700` | `#0A5D5F` | Hover secondary accent |
| `brand.teal.600` | `#0D8A8A` | Secondary brand |
| `brand.teal.500` | `#12A3A3` | Info highlight, charts |
| `brand.teal.100` | `#D4F3F1` | Surface nhẹ cho filter/notice |
| `accent.orange.600` | `#D64F0E` | Hover accent |
| `accent.orange.500` | `#F26419` | Promotional accent, CTA phụ |
| `accent.orange.100` | `#FFE5D6` | Promo badge/light background |

#### B. Neutral và semantic tokens

| Token | Light | Use |
| --- | --- | --- |
| `bg.canvas` | `#F6F8FB` | Toàn bộ app background |
| `bg.surface` | `#FFFFFF` | Card, table, modal |
| `bg.surface-alt` | `#EEF3F8` | Header table, filter bar, section nhẹ |
| `bg.subtle-brand` | `#F1F6FB` | Hero nhẹ, info strip |
| `border.default` | `#D7E2EC` | Border mặc định |
| `border.strong` | `#BCCBDA` | Hover/focus border |
| `text.primary` | `#0F172A` | Heading, body chính |
| `text.secondary` | `#475569` | Body phụ |
| `text.muted` | `#64748B` | Hint, caption |
| `text.disabled` | `#94A3B8` | Disabled |
| `state.success` | `#16A34A` | Thành công |
| `state.warning` | `#D97706` | Cảnh báo |
| `state.error` | `#DC2626` | Lỗi |
| `state.info` | `#0284C7` | Thông tin |

#### C. Cặp màu semantic bắt buộc

| Semantic pair | Foreground | Background |
| --- | --- | --- |
| Primary CTA | `#FFFFFF` | `#1B3A6B` |
| Secondary CTA | `#0F172A` | `#FFFFFF` + border `#D7E2EC` |
| Success chip | `#166534` | `#DCFCE7` |
| Warning chip | `#92400E` | `#FEF3C7` |
| Error chip | `#991B1B` | `#FEE2E2` |
| Info chip | `#0C4A6E` | `#E0F2FE` |

Yêu cầu contrast:

- Tất cả cặp text/body và button/text phải đạt WCAG AA cho text thường.
- Không đặt text teal nhạt trên nền trắng.
- Không dùng orange làm màu chữ chính cho body text.

### 8.3 Typography

#### A. Font family

- Font chính toàn hệ thống: `Inter`.
- Font phụ/display: `Syne`.
- Quy tắc:
  - `Inter` dùng cho admin, staff, portal và toàn bộ biểu mẫu/bảng.
  - `Syne` chỉ dùng tiết chế cho public landing hero hoặc một số title marketing, không dùng cho data-heavy screen.

#### B. Type scale

| Style | Font | Size | Weight | Line-height | Use |
| --- | --- | --- | --- | --- | --- |
| Display XL | Syne | 48 | 800 | 56 | Hero public |
| Display L | Syne | 40 | 800 | 48 | Hero phụ/public |
| H1 | Inter | 32 | 800 | 40 | Page title desktop |
| H2 | Inter | 28 | 700 | 36 | Section title |
| H3 | Inter | 24 | 700 | 32 | Card title lớn / modal title |
| H4 | Inter | 20 | 700 | 28 | Subsection title |
| Title | Inter | 18 | 700 | 28 | Tile/card title |
| Body L | Inter | 16 | 400/500 | 24 | Nội dung chính |
| Body M | Inter | 14 | 400/500 | 22 | Bảng, form, description |
| Body S | Inter | 12 | 500 | 18 | Caption, helper |
| Label | Inter | 12 | 600 | 16 | Label field, filter label |
| Button | Inter | 14 | 600 | 20 | Button text |
| Overline | Inter | 11 | 700 | 16 | Micro label, status header |

Quy tắc sử dụng:

- Hạn chế uppercase, chỉ dùng cho overline rất ngắn như `Báo cáo`, `Mới`, `Đến hạn`.
- Không letter-spacing rộng cho văn bản tiếng Việt dài.
- Page title không vượt quá 2 cấp phân tầng trên cùng một viewport.

### 8.4 Spacing, grid, radius, shadow

#### A. Spacing scale

| Token | Giá trị |
| --- | --- |
| `space.1` | 4px |
| `space.2` | 8px |
| `space.3` | 12px |
| `space.4` | 16px |
| `space.5` | 20px |
| `space.6` | 24px |
| `space.8` | 32px |
| `space.10` | 40px |
| `space.12` | 48px |

#### B. Layout grid

| Context | Width | Grid | Margin | Gutter |
| --- | --- | --- | --- | --- |
| Admin desktop | 1440 frame, 1280 content | 12 cột | 32px | 24px |
| Portal desktop | 1280 content | 12 cột | 24px | 24px |
| Tablet | 768 | 8 cột | 24px | 16px |
| Mobile | 390 | 4 cột | 16px | 12px |

#### C. Radius

- `radius.sm`: 8px
- `radius.md`: 12px
- `radius.lg`: 16px
- `radius.xl`: 20px
- `radius.2xl`: 24px

Quy tắc:

- Button/input/table cell/filter chip: ưu tiên `12px` hoặc `16px`.
- Card thường: `16px`.
- Modal/bottom sheet: `20px` hoặc `24px`.
- Không dùng `32px+` cho phần lớn admin screen.

#### D. Shadow

| Token | Giá trị | Use |
| --- | --- | --- |
| `shadow.sm` | `0 1px 2px rgba(15,23,42,.06)` | Input/card nhẹ |
| `shadow.md` | `0 8px 24px rgba(15,23,42,.08)` | Card nổi |
| `shadow.lg` | `0 20px 40px rgba(15,23,42,.12)` | Modal |
| `shadow.none` | `none` | Table, section phẳng |

### 8.5 Component rule

#### A. Button

| Variant | Default | Hover | Active | Disabled | Use |
| --- | --- | --- | --- | --- | --- |
| Primary | bg `#1B3A6B`, text white | `#163257` | `#112743` | bg `#CBD5E1`, text `#94A3B8` | CTA chính mỗi vùng |
| Secondary | white + border `#D7E2EC` | `#F8FAFC` | `#EEF3F8` | border `#E2E8F0`, text `#94A3B8` | Hành động phụ |
| Tertiary/Ghost | transparent | `#EEF3F8` | `#E2E8F0` | text `#94A3B8` | Action nhẹ trong table/header |
| Danger | bg `#DC2626`, text white | `#B91C1C` | `#991B1B` | bg `#FECACA`, text `#7F1D1D` | Delete, reject |

Quy tắc:

- Không uppercase mặc định.
- Button height: `40px` cho table/action nhỏ, `48px` cho form/page CTA.
- Icon cỡ `16px` hoặc `18px`, đặt trước text nếu là primary action.
- Mỗi khu vực chỉ có 1 primary button rõ ràng.

#### B. Input / Textarea / Select / Date picker

- Label luôn nằm trên field, dùng `Label 12/600`.
- Chiều cao input chuẩn: `44px`.
- Border mặc định: `border.default`.
- Focus: border `brand.teal.600` + ring `brand.teal.100`.
- Error: border `state.error`, helper text đỏ.
- Placeholder dùng `text.muted`, không quá nhạt.
- Textarea tối thiểu `96px`.
- Date picker và select phải cùng chiều cao, cùng radius với input text.

#### C. Table

- Header nền `bg.surface-alt`, chữ `Body S 12/600`.
- Row height tối thiểu `52px`.
- Hover row: `#F8FAFC`.
- Divider mảnh, không quá nhiều border dày.
- Action column cố định bên phải.
- Empty state phải có icon + 1 dòng tiêu đề + 1 dòng mô tả + CTA nếu cần.
- Với mobile không ép table quá nhiều; chuyển sang list card khi dữ liệu khó đọc.

#### D. Card dữ liệu

- Card thường: padding `20px` hoặc `24px`.
- Card KPI gồm:
  - metric label
  - metric value
  - delta/hint
  - icon nền nhẹ
- Không dùng gradient nặng cho mọi KPI card; chỉ 1-2 card nổi bật mỗi dashboard.

#### E. Modal

- Header: title + subtitle ngắn + close button.
- Body: spacing `24px`.
- Footer: secondary left, primary right.
- Max width:
  - form nhỏ: 480px
  - CRUD chuẩn: 560px
  - wizard/detail: 720px-960px
- Portal mobile ưu tiên bottom sheet; desktop ưu tiên modal hoặc side panel.

#### F. Tabs

- Dùng underline hoặc segmented control, không trộn cả hai trên cùng 1 page.
- Tab label không uppercase.
- Badge count chỉ dùng khi có giá trị vận hành.

#### G. Status badge

- Mọi domain phải map về cùng pattern:
  - màu semantic
  - icon nếu cần
  - text label chuẩn hóa
- Không tự tạo chip màu mới ngoài semantic system.

#### H. Navigation

- Sidebar owner/staff:
  - width 248px mở, 80px thu gọn
  - nhóm nav rõ ràng, icon 20px, text 14px
  - active state chỉ dùng 1 pattern
- Portal mobile:
  - 5 item bottom nav tối đa
  - active item có label rõ, icon 20px

#### I. Bottom sheet

- Chỉ là pattern ưu tiên trên mobile.
- Trên desktop, bottom sheet của portal nên chuyển thành drawer phải hoặc modal.

### 8.6 Icon và visual

- Chuẩn icon: Lucide duy nhất.
- Kích thước chuẩn: `16px`, `20px`, `24px`.
- Stroke width: `1.75` hoặc `2`.
- Không trộn Material, emoji và icon minh họa lẫn nhau.
- Ảnh minh họa chỉ dùng ở public/portal onboarding/empty state; admin screen nên tiết chế.

### 8.7 Dark mode

Dark mode nên là phase 2, nhưng nếu triển khai thì dùng token ngay từ đầu:

| Token | Dark value |
| --- | --- |
| `bg.canvas` | `#0B1220` |
| `bg.surface` | `#111B2E` |
| `bg.surface-alt` | `#17243B` |
| `border.default` | `#24364F` |
| `text.primary` | `#F8FAFC` |
| `text.secondary` | `#CBD5E1` |
| `text.muted` | `#94A3B8` |
| `brand.primary` | `#7FA5D6` |
| `brand.secondary` | `#53C7C3` |

Nguyên tắc:

- Không hard-code màu sáng trong component.
- Dark mode chỉ khả thi khi refactor token toàn cục trước.

## 9. Đặc tả bàn giao cho AI Figma

### 9.1 Bộ frame cần dựng

#### P1. Foundations

- Color styles
- Text styles
- Spacing/radius/shadow tokens
- Icon sizing rules
- Grid cho desktop/tablet/mobile

#### P2. Shared components

- App shell admin
- App shell portal
- Sidebar
- Topbar
- Bottom navigation
- Page header
- KPI card
- Filter bar
- Data table
- Empty/error/loading state
- Form fields
- Buttons
- Status badges
- Modal
- Drawer
- Bottom sheet
- Toast/alert

#### P3. Owner screens

- Dashboard
- Building list + detail
- Room list + detail + handover
- Tenant list + detail + balance modal
- Contract list + create wizard + detail
- Invoice list + detail
- Payment list + detail + webhook log
- Ticket list + detail
- Service catalog
- Asset catalog
- Amenity management
- Utility policies + overrides + billing runs
- User management + permission matrix + audit logs
- Reports hub + 1 template report detail

#### P4. Staff screens

- Staff dashboard
- My tickets
- Ticket detail
- Visitor check-in
- Amenity check-in

#### P5. Portal screens

- Dashboard
- Onboarding
- Invoice list/detail
- Payment history
- Balance
- Contract view
- Ticket list/create/detail
- Amenity list + booking flow + my bookings
- Announcements
- FAQ
- Profile + sheet variants
- Notifications
- Service requests
- Documents
- Visitor feature disabled state

#### P6. Public screens

- Landing page
- Listings page
- Listing detail
- Listing apply
- Auth pages

#### P7. Super Admin

- Dashboard
- Organization list
- Owner list
- Audit console
- Platform settings

### 9.2 Breakpoint ưu tiên khi thiết kế

- Admin/Owner: desktop-first, sau đó tablet.
- Staff: desktop + tablet.
- Portal: mobile-first, sau đó desktop.
- Public listing: desktop và mobile đều là primary.

### 9.3 Prototype flow nên dựng trong Figma

1. Login -> redirect theo role.
2. Browse listing -> listing detail -> apply.
3. Owner invoice list -> invoice detail -> record payment.
4. Owner contract list -> create contract wizard -> contract detail.
5. Tenant dashboard -> create ticket -> track ticket detail.
6. Tenant invoice -> QR payment / manual reconciliation.
7. Tenant amenity -> book slot -> my bookings -> cancel booking.
8. Tenant onboarding -> complete steps -> active resident.

### 9.4 Business rules không được phá khi redesign

- Không gộp lẫn Owner và Staff thành cùng một IA nếu role/permission khác nhau.
- Không bỏ utility hierarchy `system/building/room/contract`.
- Không bỏ transfer/liquidation/addendum khỏi contract flow.
- Không bỏ pending approval trong amenity governance.
- Không biến payment portal thành “pay now thành công ngay” nếu backend vẫn là QR + reconciliation.
- Không bỏ trạng thái preview trước khi chạy billing run.
- Không bỏ disabled state của onboarding steps do admin xác nhận.

## 10. Đề xuất redesign theo module

### 10.1 Owner/Admin

- Giảm decor, tăng mật độ thông tin có kiểm soát.
- Chuẩn hóa page structure:
  - page header
  - KPI/tóm tắt
  - filter bar
  - primary data surface
  - side action hoặc modal
- List/detail pages nên dùng cùng một template.
- Reports nên dùng 1 bộ chart card template thay vì mỗi report tự vẽ khác nhau.

### 10.2 Staff

- Tối ưu theo “queue processing”.
- Nhấn mạnh:
  - việc đang chờ
  - SLA
  - hành động kế tiếp
- Ticket detail staff nên ưu tiên timeline, assignee, resolution note.

### 10.3 Portal

- Portal nên bớt “trình diễn” và tập trung “dịch vụ cư dân”.
- Mỗi màn hình nên có:
  - 1 tiêu đề rõ
  - 1 CTA chính
  - 1 danh sách chính
- Bottom sheet chỉ giữ cho mobile; desktop dùng drawer/modal để tăng hiệu quả thao tác.
- Profile hiện có quá nhiều sheet khác nhau; nên gom thành:
  - thông tin cá nhân
  - bảo mật
  - thông báo
  - phản hồi
  - tài liệu/QR pass

### 10.4 Public listing

- Tách rõ hai mục tiêu:
  - thuyết phục người thuê
  - dẫn đến apply nhanh
- Listing page nên có filter system gọn, sticky summary và card đồng nhất.
- Listing detail nên có layout 2 cột desktop:
  - thông tin phòng
  - sticky summary + CTA apply/inquiry

### 10.5 Super Admin

- Không nên giữ theme tối tách biệt hoàn toàn.
- Dùng cùng design system, chỉ khác tone color và mô hình dashboard.
- IA cần phản ánh multi-tenant SaaS:
  - organizations
  - owner accounts
  - plans/billing
  - audits/risk
  - feature flags

### 10.6 Lộ trình UI implementation khuyến nghị

1. Chốt token và base component trước.
2. Refactor app shell và navigation.
3. Refactor list/detail template cho owner.
4. Refactor portal shell và các form/ticket/invoice flow.
5. Làm public listing và super-admin sau khi core system ổn định.

## 11. Kết luận ngắn

SmartStay có nền logic nghiệp vụ khá đầy đủ, nhưng giao diện hiện tại đang bị phân mảnh theo từng cụm màn hình. Redesign nên tập trung vào một design system duy nhất, tái cấu trúc lại app shell, filter/table/form pattern và giảm mạnh sự khác biệt không cần thiết giữa owner, staff và portal.

Nếu AI Figma bám theo tài liệu này, có thể thiết kế lại toàn bộ hệ thống mà vẫn giữ đúng flow nghiệp vụ hiện tại.
