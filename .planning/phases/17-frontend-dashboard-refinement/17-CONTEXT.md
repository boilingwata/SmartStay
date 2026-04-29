# Phase 17: Frontend Dashboard Refinement - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Tinh chỉnh frontend cho các module vận hành chính của SmartStay theo hướng dashboard SaaS production: đơn giản, rõ ràng, responsive tốt, không vỡ layout, không rối, dễ dùng cho cả người lớn tuổi hoặc người không rành công nghệ.

Phase này tập trung vào UI/layout/UX/text/format hiển thị của các màn quản trị đã có. Không xây landing page, không thêm luồng business mới, không đổi mô hình dữ liệu nếu không bắt buộc để sửa lỗi hiển thị hoặc mapping thuật ngữ.

## Module Trong Scope

- `assets`
- `amenities`
- `tenants`
- `contracts`
- `addendums`
- `utility-billing`
- `billing-runs`
- `services`
- `utility-policies`
- `utility-overrides`
- `invoices`
- `payments`
- `tickets`

## Vấn Đề UI Hiện Tại Cần Kiểm Tra

- Một số màn quản trị có nguy cơ bị bó bởi container hẹp, tạo nhiều khoảng trắng vô ích trên màn lớn.
- Các màn dữ liệu dày có nhiều bảng, badge, filter, tab và card, dễ bị rối nếu thiếu hierarchy rõ.
- Nhiều module hiển thị giá trị trạng thái, enum, lỗi backend hoặc thuật ngữ kỹ thuật từ service/Supabase; cần đổi sang tiếng Việt dễ hiểu.
- Bảng nhiều cột có nguy cơ vỡ layout nếu thiếu `overflow-x-auto`, `min-width` và chiến lược truncate/wrap.
- Các toolbar/filter/action group có nguy cơ xuống dòng xấu ở 1024px, 768px và 390px.
- Một số domain đang phân tán presentation logic trong view, component, service và helper; cần rà nguồn label/formatter để không hiển thị lệch nghĩa giữa list/detail/modal.

</domain>

<decisions>
## Implementation Decisions

### Ngôn ngữ, thuật ngữ và định dạng
- **D-01:** 100% nội dung người dùng nhìn thấy trong scope phase phải dùng tiếng Việt chuẩn, có dấu đầy đủ.
- **D-02:** Ngày, tháng, năm, giờ phải hiển thị theo chuẩn Việt Nam, ưu tiên `dd/MM/yyyy`, `dd/MM/yyyy HH:mm`, hoặc label tháng/năm tiếng Việt khi phù hợp.
- **D-03:** Không để lộ enum/raw value/technical value từ Supabase hoặc service như `pending_payment`, `partially_paid`, `in_progress`, `billing_runs`, `utility_policy`, `room_asset_auto` trên UI. Tất cả phải có nhãn tiếng Việt dễ hiểu.
- **D-04:** Text phải ngắn, trực tiếp, nghiệp vụ. Tránh diễn đạt marketing hoặc mô tả dài không giúp thao tác vận hành.
- **D-05:** Empty/loading/error state phải nói rõ người dùng cần làm gì tiếp theo, bằng tiếng Việt, không hiển thị lỗi kỹ thuật thô nếu có thể dịch được.

### Layout responsive bắt buộc
- **D-06:** Content chính phải fluid width, không bị khóa ở `max-width: 1200px`. Nếu cần giới hạn chiều rộng, dùng mức hợp lý cho dashboard như `1600px` hoặc `1760px` tùy màn.
- **D-07:** Vùng main content nằm cạnh sidebar phải có contract tương đương `flex-1 min-w-0`; các wrapper ngang chứa bảng, toolbar, tab, card grid hoặc text dài cũng phải có `min-w-0` khi cần.
- **D-08:** Grid responsive: mobile 1 cột, tablet thường 2 cột, desktop nhiều cột theo dữ liệu thật; không cố định số cột gây rỗng hoặc ép nội dung.
- **D-09:** Bảng nhiều cột bắt buộc có wrapper `overflow-x-auto` và `min-width` thực dụng. Horizontal scroll phải nằm trong vùng bảng, không kéo vỡ toàn trang.
- **D-10:** Card, badge, nút, input, filter, tab và action cell phải căn hàng đều; text không được tràn viền, đè nhau hoặc làm giãn layout bất thường.
- **D-11:** Sidebar/topbar không được ép sai content. Nếu shell layout là nguyên nhân gây bó/vỡ, được sửa tối thiểu trong scope phase để tạo nền ổn định cho các module.
- **D-12:** Không dùng browser zoom 50% làm tiêu chuẩn responsive. Phải kiểm tra theo viewport thật: `1920`, `1600`, `1440`, `1366`, `1280`, `1024`, `768`, `390`.

### Hướng thiết kế dashboard SaaS
- **D-13:** Đây là dashboard vận hành SaaS, không phải landing page. Không dùng hero lớn, layout marketing, section trang trí, card lồng card hoặc hình minh họa không phục vụ thao tác.
- **D-14:** Ưu tiên scan nhanh và thao tác nhanh: header gọn, metric vừa đủ, filter rõ, primary action dễ thấy, secondary action không tranh chấp thị giác.
- **D-15:** Giao diện phải đẹp vừa đủ và đúng tông SmartStay hiện tại: restrained, sạch, ít màu, dùng badge/tone có mục đích, không biến mỗi màn thành một palette riêng.
- **D-16:** Với người dùng ít rành công nghệ, mỗi màn phải trả lời nhanh: đây là danh sách gì, trạng thái nào cần chú ý, thao tác chính ở đâu, bấm vào đâu để xem/sửa.
- **D-17:** Không tăng độ phức tạp tương tác nếu một bảng/list/card rõ ràng đã đủ. Ưu tiên giải pháp quen thuộc: bảng, tab, filter, modal, sheet, dropdown, segmented control khi phù hợp.

### Module assets
- **D-18:** `assets` cần ưu tiên bảng/list hoặc card compact có khả năng scan nhanh mã tài sản, tên, loại, trạng thái, vị trí/phòng, giá/phí liên quan và hành động chính.
- **D-19:** Phải phân biệt rõ tài sản master trong `assets` và gán tài sản vào phòng qua `room_assets`; UI không được làm người dùng hiểu nhầm đang sửa nhầm lớp dữ liệu.
- **D-20:** Trạng thái, loại tài sản, nguồn tính phí và các cảnh báo liên quan tài sản phải được Việt hóa nhất quán.

### Module amenities
- **D-21:** `amenities` phải hiển thị như màn vận hành đặt/kiểm tra tiện ích, không như trang giới thiệu dịch vụ. Ưu tiên tên tiện ích, trạng thái hoạt động, lịch/booking liên quan, giới hạn sử dụng và hành động kiểm tra.
- **D-22:** Staff check-in amenity nếu bị ảnh hưởng bởi label/status phải dùng cùng nguồn thuật ngữ với màn quản trị.

### Module tenants
- **D-23:** `tenants` giữ hướng đã khóa ở phase 9: tenant profile là hồ sơ cư dân; hợp đồng, hóa đơn, thanh toán là ngữ cảnh liên kết, không đẩy ví/balance thành trung tâm nếu không thuộc luồng hiện có.
- **D-24:** Tenant list/detail phải ưu tiên thông tin định danh, liên hệ, phòng/hợp đồng hiện tại, trạng thái onboarding và công nợ/hóa đơn khi có; không nhồi quá nhiều khối ngang hàng.
- **D-25:** Các tab/detail tenant phải responsive rõ: desktop đủ tab, tablet có thể cuộn/rút gọn, mobile không ép tab desktop thu nhỏ.

### Module contracts và addendums
- **D-26:** `contracts` cần giữ split-workspace/summary-rail direction đã được sketch xác nhận cho luồng tạo hợp đồng: chọn tòa nhà/phòng/người thuê trước, summary và thông tin phụ ở cột phụ.
- **D-27:** Contract list/detail phải phân cấp rõ trạng thái hợp đồng, thời hạn, phòng, người thuê chính, tiền thuê/cọc, dịch vụ và hóa đơn liên quan.
- **D-28:** `addendums` phải dùng nhãn tiếng Việt cho loại phụ lục, trạng thái, nguồn tạo và ảnh hưởng nghiệp vụ. Không để các type như `AssetAssignment`, `RoomAssetAuto`, `RentChange` xuất hiện thô trên UI.
- **D-29:** Timeline, tab và modal hợp đồng chỉ được làm gọn/rõ hơn; không thêm quy trình ký số, phê duyệt mới hoặc nghiệp vụ hợp đồng mới trong phase này.

### Module utility-billing, billing-runs, utility-policies, utility-overrides
- **D-30:** Nhóm tiện ích phải làm rõ quan hệ: chính sách tính tiền, ghi đè, đợt chạy hóa đơn và kết quả/cảnh báo. Người dùng phải biết lỗi/cảnh báo đến từ đâu và cần sửa gì.
- **D-31:** `utility-billing`/hub không được là trang tổng quan rối; dùng các khối điều hướng ngắn tới chính sách, ghi đè, chạy kỳ, lịch sử/kết quả.
- **D-32:** `billing-runs` phải ưu tiên bảng scan nhanh kỳ tính tiền, trạng thái, thời gian chạy, người chạy, số hợp đồng/hóa đơn thành công/thất bại và hành động xem chi tiết.
- **D-33:** `utility-policies` và `utility-overrides` phải dịch rõ scope/source/status/warning, dùng thuật ngữ như "Chính sách", "Phạm vi áp dụng", "Ghi đè", "Kỳ tính tiền", "Chạy tính tiền", "Cảnh báo".
- **D-34:** Backend message từ utility billing phải được dịch qua presentation helper hoặc mapping tương đương trước khi hiển thị.

### Module services
- **D-35:** `services` là danh mục dịch vụ vận hành, không phải trang marketing. Cần ưu tiên tên dịch vụ, nhóm, giá hiện tại, trạng thái hoạt động, lịch sử giá và hành động cập nhật giá.
- **D-36:** Price history, detail modal và update price modal phải dùng format tiền/ngày Việt Nam, label rõ, không làm người dùng đoán đơn vị hoặc thời điểm hiệu lực.

### Module invoices và payments
- **D-37:** `invoices` và `payments` phải ưu tiên scan theo trạng thái thanh toán, kỳ/hạn thanh toán, người thuê/hợp đồng/phòng, số tiền, còn nợ, thời điểm thanh toán và hành động ghi nhận/xem chi tiết.
- **D-38:** Trạng thái hóa đơn/thanh toán phải được Việt hóa nhất quán: "Chưa chốt", "Chờ thanh toán", "Đã thanh toán một phần", "Đã thanh toán", "Quá hạn", "Đã hủy" hoặc wording tương đương đã được thống nhất.
- **D-39:** Các modal tạo hóa đơn, tạo hàng loạt, ghi nhận thanh toán phải có layout form gọn, không để label dài phá cột ở mobile.

### Module tickets
- **D-40:** `tickets` phải giữ hướng domain slice hiện có trong `features/tickets` và chuẩn hóa presentation thay vì tạo mapping rải rác mới.
- **D-41:** Ticket list/kanban/detail phải ưu tiên trạng thái xử lý, mức ưu tiên, phòng/người gửi, người phụ trách, thời hạn/thời điểm cập nhật và hành động tiếp theo.
- **D-42:** Ticket status/category/priority phải luôn là tiếng Việt dễ hiểu; không hiển thị raw value từ DB/service.

### In-scope
- **D-43:** Rà và chỉnh layout list/detail/modal/filter/tab/table của các module trong scope.
- **D-44:** Chuẩn hóa nhãn tiếng Việt, trạng thái, enum label, formatter ngày giờ/tiền tệ và lỗi hiển thị trong scope.
- **D-45:** Sửa shell/layout dùng chung ở mức tối thiểu nếu nó gây bó/vỡ content cho các module này.
- **D-46:** Bổ sung hoặc tái sử dụng helper/presentation mapping nếu giúp tránh lặp và tránh lệch nhãn giữa list/detail/modal.
- **D-47:** Sửa các vấn đề UI/service mapping nhỏ nếu cần để UI không hiển thị sai nghĩa, nhưng không mở rộng sang refactor backend/schema lớn.

### Out-of-scope
- **D-48:** Không xây landing page, trang marketing hoặc hero giới thiệu sản phẩm.
- **D-49:** Không thêm business flow mới như phê duyệt hợp đồng, ký số, ví tenant mới, payment gateway mới, quy trình bảo trì mới hoặc automation mới nếu chưa có trong app.
- **D-50:** Không refactor toàn bộ kiến trúc frontend sang feature-first trong phase này, dù có thể giữ hướng file mới theo pattern tốt hơn khi cần.
- **D-51:** Không đổi schema Supabase hoặc RLS chỉ để polish UI, trừ khi phát hiện lỗi blocker khiến màn hiện tại không thể hiển thị/lưu đúng.
- **D-52:** Không thay đổi portal/public/landing ngoài những chỗ bị ảnh hưởng trực tiếp bởi shared label/helper trong scope.

### Acceptance Criteria
- **D-53:** Tất cả module trong scope có UI tiếng Việt chuẩn, không còn text người dùng nhìn thấy bằng tiếng Anh thô hoặc raw technical enum/value.
- **D-54:** Ngày giờ, tiền tệ, kỳ tính tiền và trạng thái nghiệp vụ hiển thị theo chuẩn Việt Nam, nhất quán giữa list/detail/modal.
- **D-55:** Layout không vỡ ở `1920`, `1600`, `1440`, `1366`, `1280`, `1024`, `768`, `390`.
- **D-56:** Content area tận dụng màn hình lớn tốt hơn, không bị bó cứng 1200px gây dư trắng vô lý.
- **D-57:** Bảng nhiều cột có scroll ngang trong vùng bảng, có `min-width`, action cell vẫn dùng được.
- **D-58:** Mobile 390px không có text/button/badge/input/card/table kéo vỡ trang hoặc đè lên nhau.
- **D-59:** Toolbar/filter/action group wrap có kiểm soát; không có cụm nút hoặc input bị ép hẹp đến mức khó dùng.
- **D-60:** Loading, empty, error states của các màn chính rõ ràng, ngắn gọn, tiếng Việt, có hành động tiếp theo nếu phù hợp.
- **D-61:** `npm run build` và `npm run lint` phải pass sau khi execute phase.

### Definition of Done
- **D-62:** Scope/file thực tế của từng module đã được rà và cập nhật trong plan trước khi sửa code.
- **D-63:** Có checklist responsive theo 8 breakpoint bắt buộc và được dùng trong verification.
- **D-64:** Mỗi module chính có list/detail/modal/table hoặc equivalent layout đạt production dashboard: gọn, rõ, dễ scan, không rối.
- **D-65:** Các presentation helper hiện có được tái sử dụng hoặc chuẩn hóa để không còn nhiều nguồn dịch label mâu thuẫn.
- **D-66:** Không có regression rõ ở route `/owner/...` cho các màn trong scope.
- **D-67:** Phase kết thúc với build/lint pass và ghi nhận các vấn đề còn lại nếu có trong UAT/review.

### the agent's Discretion
- Planner/executor được quyết định cụ thể màn nào dùng table, card compact, split workspace, tab, sheet hoặc modal, miễn là giữ đúng nguyên tắc scan nhanh và responsive.
- Planner/executor được tách phase thành nhiều wave theo module/domain để kiểm soát rủi ro, vì scope rộng.
- Có thể thêm shared helper cho format/label nếu giảm lặp đáng kể; không bắt buộc nếu sửa tại helper hiện có đủ an toàn.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project instructions
- `AGENTS.md` - project architecture, commands, route namespaces, Supabase/service/React Query flow, Vietnamese/i18n convention, layout expectations.

### Codebase audit
- `.planning/codebase/CONVENTIONS.md` - naming, import, error handling and local coding conventions.
- `.planning/codebase/FRONTEND_SRC_AUDIT.md` - current frontend ownership drift, route namespace notes, feature-slice direction, and structural risks.

### Prior frontend phase
- `.planning/phases/16-buildings-rooms-frontend-audit/16-PLAN.md` - established dashboard SaaS layout contracts for SmartStay: fluid admin content, `min-w-0`, responsive breakpoints, Vietnamese label contract, field consistency.

### Prior domain contexts
- `.planning/phases/8-CONTEXT.md` - assets domain semantics, especially `assets` master catalog vs `room_assets` assignment.
- `.planning/phases/9-CONTEXT.md` - tenant domain semantics, tenant profile boundaries, contract/invoice/payment relationships.
- `.planning/phases/10-CONTEXT.md` - contract domain decisions if present for contract/module flow.
- `.planning/phases/11-CONTEXT.md` - finance/payment/invoice decisions if present for finance module behavior.
- `.planning/phases/12-CONTEXT.md` - utility billing decisions if present for policies/runs/overrides.
- `.planning/phases/13-CONTEXT.md` - tickets/services/amenities decisions if relevant to module behavior.

### Design findings
- `.codex/skills/sketch-findings-smartstay/SKILL.md` - validated SmartStay design direction for dense operational UI and contract split workspace.
- `.planning/sketches/001-contract-party-selection/README.md` - contract creation split workspace reference.
- `.planning/sketches/themes/default.css` - validated visual theme source from sketch work.

</canonical_refs>

<code_context>
## Existing Code Insights

### Routes
- `src/routes/ownerRoutes.tsx` wires the active admin/owner routes for all modules in scope. The live namespace is `/owner/...`, while folders still use `views/admin/...`.
- Utility pages are nested under `/owner/settings/...` for `utility-policies`, `utility-overrides`, and `billing-runs`; `utility-billing` is a top-level owner route.

### Reusable Assets
- `src/components/ui/*` - shadcn-based primitives for buttons, cards, inputs, badges, tabs, dialogs, skeleton/status states.
- `src/components/invoices/InvoiceFilterBar.tsx` and `src/components/invoices/InvoiceAdvancedFilter.tsx` - existing invoice filter patterns.
- `src/components/invoices/modals/CreateInvoiceModal.tsx` and `src/components/invoices/modals/BulkInvoiceModal.tsx` - invoice modal flows to polish for responsive forms.
- `src/components/shared/modals/RecordPaymentModal.tsx` - shared payment recording modal.
- `src/components/contracts/*` - contract badges, timeline, date/price display, tabs, modals and wizard components.
- `src/components/contracts/wizard/*` - contract creation split workflow and preview sidebar.
- `src/components/services/*` - service detail, price history and update price modal.
- `src/components/assets/AssetModal.tsx` - asset create/edit modal.
- `src/components/tickets/*` and `src/features/tickets/*` - strongest existing domain presentation slice for tickets.
- `src/components/tenants/detail/*` - tenant detail tabs and modal components.

### Established Patterns
- Services map database rows to frontend models; UI should not consume raw DB enum values directly.
- Existing presentation helpers already exist for some domains:
  - `src/lib/contractPresentation.ts`
  - `src/lib/utilityPresentation.ts`
  - `src/features/tickets/ticketPresentation.ts`
  - `src/features/tickets/ticketMetadata.ts`
  - `src/lib/assetMappers.ts`
  - `src/lib/assetBilling.ts`
- React Query and service methods remain the data flow boundary. This phase should not bypass services from UI just to format labels.
- Vietnamese is primary UI language; `src/i18n/vi/common.json` may need updates where shell/menu/breadcrumb labels are centralized.

### Primary Files To Scout And Plan

#### Shell/layout shared by scope
- `src/components/layout/AdminLayout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Topbar.tsx`
- `src/i18n/vi/common.json`
- `src/routes/ownerRoutes.tsx`

#### Assets
- `src/views/admin/assets/AssetCatalog.tsx`
- `src/components/assets/AssetModal.tsx`
- `src/services/assetService.ts`
- `src/models/Asset.ts`
- `src/schemas/assetSchema.ts`
- `src/lib/assetMappers.ts`
- `src/lib/assetBilling.ts`

#### Amenities
- `src/views/admin/settings/AmenityManagementPage.tsx`
- `src/views/admin/staff/AmenityCheckin.tsx`
- `src/services/amenityAdminService.ts`
- `src/services/portalAmenityService.ts`

#### Tenants
- `src/views/admin/tenants/TenantList.tsx`
- `src/views/admin/tenants/TenantDetail.tsx`
- `src/components/forms/TenantFormModal.tsx`
- `src/components/tenants/detail/ProfileTab.tsx`
- `src/components/tenants/detail/ContactTab.tsx`
- `src/components/tenants/detail/ContractTab.tsx`
- `src/components/tenants/detail/InvoiceTab.tsx`
- `src/components/tenants/detail/FeedbackTab.tsx`
- `src/components/tenants/detail/OnboardingTab.tsx`
- `src/components/tenants/detail/MessageTenantModal.tsx`
- `src/services/tenantService.ts`
- `src/models/Tenant.ts`

#### Contracts and addendums
- `src/views/admin/contracts/ContractList.tsx`
- `src/views/admin/contracts/ContractDetail.tsx`
- `src/views/admin/contracts/CreateContractWizard.tsx`
- `src/views/admin/contracts/AddendumListPage.tsx`
- `src/components/contracts/ContractStatusBadge.tsx`
- `src/components/contracts/AddendumStatusBadge.tsx`
- `src/components/contracts/ContractTimelineBar.tsx`
- `src/components/contracts/tabs/OverviewTab.tsx`
- `src/components/contracts/tabs/OccupantsTab.tsx`
- `src/components/contracts/tabs/InvoicesTab.tsx`
- `src/components/contracts/tabs/AddendumsTab.tsx`
- `src/components/contracts/tabs/TransfersTab.tsx`
- `src/components/contracts/modals/CreateAddendumModal.tsx`
- `src/components/contracts/modals/ExtendContractModal.tsx`
- `src/components/contracts/modals/TerminateContractModal.tsx`
- `src/components/contracts/modals/LiquidationModal.tsx`
- `src/components/contracts/modals/TransferContractModal.tsx`
- `src/components/contracts/modals/AddOccupantModal.tsx`
- `src/components/contracts/wizard/*`
- `src/services/contractService.ts`
- `src/services/portalAddendumService.ts`
- `src/models/Contract.ts`
- `src/schemas/contractSchema.ts`
- `src/lib/contractPresentation.ts`
- `src/lib/contractAddendums.ts`

#### Utility billing, policies, overrides, billing runs
- `src/views/admin/settings/UtilityHubPage.tsx`
- `src/views/admin/settings/UtilityPoliciesPage.tsx`
- `src/views/admin/settings/UtilityOverridesPage.tsx`
- `src/views/admin/settings/BillingRunsPage.tsx`
- `src/services/utilityBillingService.ts`
- `src/services/utilityAdminService.ts`
- `src/lib/utilityBilling.ts`
- `src/lib/utilityPresentation.ts`

#### Services
- `src/views/admin/services/ServiceCatalog.tsx`
- `src/components/services/ServiceDetailModal.tsx`
- `src/components/services/UpdatePriceModal.tsx`
- `src/components/services/PriceHistoryTable.tsx`
- `src/services/serviceService.ts`
- `src/schemas/serviceSchema.ts`

#### Invoices and payments
- `src/views/admin/finance/InvoiceList.tsx`
- `src/views/admin/finance/InvoiceDetail.tsx`
- `src/views/admin/finance/PaymentList.tsx`
- `src/views/admin/finance/PaymentDetail.tsx`
- `src/views/admin/finance/WebhookLogs.tsx`
- `src/components/invoices/InvoiceFilterBar.tsx`
- `src/components/invoices/InvoiceAdvancedFilter.tsx`
- `src/components/invoices/modals/CreateInvoiceModal.tsx`
- `src/components/invoices/modals/BulkInvoiceModal.tsx`
- `src/components/shared/modals/RecordPaymentModal.tsx`
- `src/services/invoiceService.ts`
- `src/services/paymentService.ts`
- `src/hooks/useAdminFinanceRealtime.ts`
- `src/models/Invoice.ts`
- `src/models/Payment.ts`
- `src/lib/invoiceItems.ts`

#### Tickets
- `src/views/admin/tickets/TicketList.tsx`
- `src/views/admin/tickets/TicketDetail.tsx`
- `src/views/admin/tickets/StaffRatings.tsx`
- `src/views/admin/staff/StaffMyTickets.tsx`
- `src/components/forms/TicketFormModal.tsx`
- `src/components/tickets/TicketKanban.tsx`
- `src/components/tickets/TicketAdvancedFilter.tsx`
- `src/components/tickets/TicketAttachmentGallery.tsx`
- `src/components/tickets/StaffMyTicketsView.tsx`
- `src/features/tickets/ticketMetadata.ts`
- `src/features/tickets/ticketPresentation.ts`
- `src/services/ticketService.ts`
- `src/models/Ticket.ts`

</code_context>

<specifics>
## Specific Ideas

- Dashboard phải "người lớn tuổi hoặc người không rành công nghệ vẫn nhìn là biết dùng".
- Ưu tiên ít phải đoán: label rõ, action rõ, trạng thái rõ, không hiển thị thuật ngữ kỹ thuật.
- Content rộng fluid, tránh dư trắng trên màn lớn.
- Bảng dài không cố nhét vào viewport; dùng scroll ngang có kiểm soát.
- Không dùng zoom browser 50% để tự đánh giá responsive.
- Scope rộng nên phase nên được chia wave theo nhóm domain để tránh làm một PR quá lớn.

</specifics>

<deferred>
## Deferred Ideas

- Refactor toàn bộ frontend sang feature-first architecture. Đây là hướng dài hạn trong `.planning/codebase/FRONTEND_SRC_AUDIT.md`, nhưng không thuộc phase polish UI này.
- Thêm nghiệp vụ mới cho contracts, payments, tickets, utility billing hoặc amenities. Phase này chỉ làm rõ và polish luồng hiện có.
- Thiết kế lại portal/public/landing. Chỉ sửa nếu shared helper/label thay đổi làm ảnh hưởng trực tiếp.

</deferred>

---

*Phase: 17-frontend-dashboard-refinement*
*Context gathered: 2026-04-29*
