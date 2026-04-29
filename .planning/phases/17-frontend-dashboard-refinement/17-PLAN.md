---
phase: 17
phase_name: frontend-dashboard-refinement
plan: 17-frontend-dashboard-refinement
type: implementation
wave_count: 6
depends_on:
  - .planning/phases/17-frontend-dashboard-refinement/17-CONTEXT.md
  - .planning/phases/17-frontend-dashboard-refinement/17-RESEARCH.md
  - .planning/sketches/004-operations-dashboard-modules/SKETCH.md
  - .planning/sketches/004-operations-dashboard-modules/README.md
  - .planning/sketches/MANIFEST.md
autonomous: true
requirements_addressed:
  - frontend-dashboard-production-ui
  - vietnamese-user-facing-copy
  - responsive-fluid-layout
  - operational-table-contract
  - mobile-tablet-desktop-verification
files_modified:
  - src/components/layout/AdminLayout.tsx
  - src/components/layout/Sidebar.tsx
  - src/components/layout/Topbar.tsx
  - src/components/shared/DataTable.tsx
  - src/components/ui/StatusBadge.tsx
  - src/components/ui/StatusStates.tsx
  - src/utils/index.ts
  - src/i18n/vi/common.json
  - src/views/admin/assets/AssetCatalog.tsx
  - src/components/assets/AssetModal.tsx
  - src/views/admin/settings/AmenityManagementPage.tsx
  - src/views/admin/staff/AmenityCheckin.tsx
  - src/views/admin/tenants/TenantList.tsx
  - src/views/admin/tenants/TenantDetail.tsx
  - src/components/tenants/detail/*
  - src/views/admin/contracts/ContractList.tsx
  - src/views/admin/contracts/ContractDetail.tsx
  - src/views/admin/contracts/CreateContractWizard.tsx
  - src/views/admin/contracts/AddendumListPage.tsx
  - src/components/contracts/*
  - src/lib/contractPresentation.ts
  - src/views/admin/settings/UtilityHubPage.tsx
  - src/views/admin/settings/UtilityPoliciesPage.tsx
  - src/views/admin/settings/UtilityOverridesPage.tsx
  - src/views/admin/settings/BillingRunsPage.tsx
  - src/lib/utilityPresentation.ts
  - src/views/admin/services/ServiceCatalog.tsx
  - src/components/services/*
  - src/views/admin/finance/InvoiceList.tsx
  - src/views/admin/finance/InvoiceDetail.tsx
  - src/views/admin/finance/PaymentList.tsx
  - src/views/admin/finance/PaymentDetail.tsx
  - src/components/invoices/*
  - src/components/shared/modals/RecordPaymentModal.tsx
  - src/views/admin/tickets/TicketList.tsx
  - src/views/admin/tickets/TicketDetail.tsx
  - src/views/admin/staff/StaffMyTickets.tsx
  - src/components/tickets/*
  - src/components/forms/TicketFormModal.tsx
  - src/features/tickets/*
---

# Phase 17 - Plan

## Tên phase

Tinh chỉnh frontend dashboard SaaS cho các module vận hành: `assets`, `amenities`, `tenants`, `contracts`, `addendums`, `utility-billing`, `billing-runs`, `services`, `utility-policies`, `utility-overrides`, `invoices`, `payments`, `tickets`.

## Trạng thái

Planned

## Đầu vào đã dùng

- `17-CONTEXT.md`: khóa scope, in-scope/out-of-scope, nguyên tắc layout responsive, tiếng Việt, định dạng ngày giờ Việt Nam, acceptance criteria và definition of done.
- `17-RESEARCH.md`: dùng các findings về shell đã gần đúng nhưng page wrapper còn bó layout, table thiếu `min-width`, nhiều trang utility/service còn decorative, một số raw value như `pending_payment`, `policy`, text không dấu và fallback kỹ thuật còn lọt ra UI.
- `Sketch 004 - SKETCH.md`: dùng Variant A "Bảng vận hành" làm pattern chính cho list pages; chỉ mượn Variant B cho `UtilityHubPage`, Variant C cho workflow nhiều bước như `CreateContractWizard` hoặc chạy utility billing.
- `Sketch 004 - README.md`: dùng các rule về layout desktop/tablet/mobile, spacing, table behavior, card/grid behavior, CTA và dangerous actions.
- `MANIFEST.md`: dùng hướng thiết kế SmartStay là dashboard vận hành dày thông tin nhưng rõ thứ bậc, ít trang trí, thao tác nhanh.
- Code scan hiện tại: xác nhận các file chính tồn tại và ghi nhận các dấu hiệu như `max-w-7xl`, `max-w-[1440px]`, `rounded-[32px]`, `text-4xl`, `min-w-full`, `pending_payment`, `policy`, text không dấu trong các module thuộc scope.

## Quyết định thiết kế đã chốt

### Pattern chính

Chọn **Sketch 004 Variant A - Bảng vận hành** làm mặc định cho các màn danh sách:

- Header gọn, H1 ngắn, mô tả phụ chỉ khi giúp hiểu nghiệp vụ.
- Một CTA chính rõ nhất trên màn.
- Metric row chỉ 3-4 chỉ số có giá trị vận hành.
- Toolbar filter gọn, wrap có kiểm soát.
- Segment trạng thái có thể cuộn ngang ở mobile.
- Bảng/list là trung tâm, có `overflow-x-auto` và `min-width` thực tế.
- Rail phụ chỉ dùng khi có cảnh báo, việc ưu tiên hoặc summary có ích.
- Action nguy hiểm tách khỏi CTA chính và luôn có xác nhận.

### Pattern chỉ mượn có điều kiện

- Variant B chỉ dùng nhẹ cho hub cấp cao như `UtilityHubPage`, nơi cần gom nhóm "Tài chính", "Hợp đồng", "Vận hành", "Tiện ích".
- Variant C chỉ dùng cho workflow nhiều bước hoặc cần kiểm tra dữ liệu: `CreateContractWizard`, chạy utility billing, tạo phụ lục phức tạp nếu đã có flow tương ứng.
- Không biến tất cả list page thành command center hoặc split workspace.

<objective>
Hoàn thiện frontend các module vận hành trong phase 17 theo chuẩn dashboard SaaS production: đơn giản, rõ, dễ scan, tiếng Việt chuẩn, fluid width hợp lý, không vỡ layout ở 390-1920px, bảng nhiều cột có scroll ngang kiểm soát, và các trạng thái/loading/empty/error đủ rõ cho người dùng không rành công nghệ.
</objective>

<audit_current_ui>

## Audit UI hiện tại

### Layout và container

- `AdminLayout.tsx` và `Topbar.tsx` đã có nền tốt: `max-w-[1760px]`, `minmax(0,1fr)`, `min-w-0`, `flex-1`.
- Rủi ro chính nằm ở page-level wrapper tự bó lại: `UtilityHubPage.tsx`, `BillingRunsPage.tsx`, `UtilityPoliciesPage.tsx`, `AmenityManagementPage.tsx`, `ContractList.tsx`, `ContractDetail.tsx`, `AddendumListPage.tsx`, `CreateContractWizard.tsx` còn dùng kiểu `max-w-7xl`, `max-w-[1440px]`, `mx-auto`.
- Một số trang cộng thêm padding lớn trong page sau khi shell đã có padding, làm nội dung có cảm giác hẹp dù shell đủ rộng.

### Spacing và visual density

- `UtilityHubPage.tsx`, `BillingRunsPage.tsx`, `ServiceCatalog.tsx`, các modal invoice/ticket/tenant/asset còn nhiều `rounded-[28px]`, `rounded-[32px]`, `rounded-[40px]`, shadow lớn, gradient hoặc hero lớn.
- Các màn này đang gần showcase hơn dashboard vận hành, làm giảm khả năng scan nhanh.
- Card lồng card và section lớn cần giảm về panel gọn: radius khoảng `8px-16px`, padding `12-16px` cho panel dữ liệu, chỉ giữ spacing lớn ở nơi thực sự cần.

### Table

- Một số bảng đã có `overflow-x-auto`, nhưng còn nhiều nơi chỉ dùng `min-w-full` hoặc `w-full`, khiến cột bị ép thay vì tạo scroll hữu ích.
- `AssetCatalog.tsx` có hướng tốt hơn vì đã có `overflow-x-auto` và `min-w-[1000px]`.
- `PaymentList.tsx`, `TicketList.tsx`, `BillingRunsPage.tsx`, các bảng trong detail cần explicit `min-w-[920px-1200px]` theo số cột.
- Shared `DataTable.tsx` nên có cách truyền `minWidthClassName` hoặc `tableClassName` để không phải mỗi view tự chế contract khác nhau.

### Grid và card

- Grid cần thống nhất: mobile 1 cột, tablet 2 cột, desktop 3-4 cột hoặc `minmax` theo nội dung.
- Các card metric chỉ nên chứa số liệu vận hành quan trọng, không nhồi nhiều dòng phụ.
- Hub page có thể dùng card nhóm, nhưng list page phải ưu tiên table/list compact.

### Typography

- Tránh H1/metric hero scale như `text-4xl md:text-5xl` trong dashboard vận hành.
- Không dùng chữ quá dài trong badge/nút; dùng label ngắn, rõ nghĩa.
- Text dài trong cell dùng `truncate`, `max-w-*`, hoặc wrap có kiểm soát; không giảm font theo viewport.
- Letter spacing lớn trên tiếng Việt cần hạn chế vì giảm khả năng đọc.

### Button, badge và action hierarchy

- Mỗi màn có một CTA chính. Secondary actions dùng outline/ghost/menu.
- Dangerous actions như xóa, hủy hóa đơn, hủy hợp đồng, chấm dứt hợp đồng, xóa tài sản phải tách khỏi nhóm action chính và có confirm.
- Badge trạng thái phải `whitespace-nowrap`, tone theo nghiệp vụ, không hiện raw enum khi thiếu mapping.

### Empty, loading, error states

- Loading nên dùng skeleton gọn theo shape thật của table/card, không dùng block quá cao.
- Empty state phải nói rõ tiếp theo nên làm gì: tạo mới, đổi bộ lọc, chọn tòa nhà, hoặc kiểm tra dữ liệu.
- Error state phải dịch lỗi kỹ thuật sang tiếng Việt dễ hiểu; không show raw Supabase/service message nếu đã có mapping.

</audit_current_ui>

<layout_contracts>

## Container strategy

- Shell admin giữ hướng `flex-1 min-w-0` cho main content cạnh sidebar.
- Content root của page trong scope phải là `min-w-0`.
- Không dùng page wrapper kiểu `max-w-7xl` hoặc `max-w-[1440px]` cho các màn table/list dày.
- Mặc định tận dụng shell width `max-w-[1760px]`; page chỉ dùng max-width riêng khi có lý do rõ.
- Với bảng nhiều cột hoặc màn vận hành dày, page để fluid theo shell, không tự `mx-auto` bó nhỏ.
- Tránh padding kép: nếu shell đã có padding, page chỉ dùng spacing nội bộ `space-y-4 md:space-y-5`.

## Breakpoint strategy

- `1920px`: content không thành đảo hẹp giữa màn; bảng và rail vẫn cân đối, không kéo text quá dài.
- `1600px`: layout desktop rộng chính; rail phụ nếu có giữ 300-340px.
- `1440px`: desktop baseline; tất cả page phải tốt ở mức này.
- `1366px`: laptop phổ biến; toolbar không wrap xấu, action không chen lên filter.
- `1280px`: rail có thể giữ hoặc stack tùy màn; grid giảm cột hợp lý.
- `1024px`: main area về 1 cột; filter 2 cột; tabs/segment cho phép cuộn ngang.
- `768px`: tablet portrait; toolbar stack rõ; sidebar/topbar không che content.
- `390px`: mobile hẹp; header stack dọc, CTA full width nếu cần, filter 1 cột, table scroll nội bộ.

## Table strategy

- Wrapper: `min-w-0 overflow-hidden rounded-lg border bg-white`.
- Scroll container: `overflow-x-auto`.
- Table: `w-full text-left text-sm` kèm min-width cụ thể.
- Min-width đề xuất:
  - `min-w-[920px]`: bảng ít cột, ví dụ tiện ích hoặc dịch vụ đơn giản.
  - `min-w-[1080px]`: tenants, contracts, tickets, invoices cơ bản.
  - `min-w-[1200px]`: finance/utility bảng nhiều số tiền, ngày, trạng thái, hành động.
- Action cell: `whitespace-nowrap`, width/min-width ổn định, không bị ép.
- First cell: mã + mô tả phụ 2 dòng.
- Cell dài: `max-w-* truncate` hoặc wrap có kiểm soát, không đẩy vỡ table.

## Text strategy

- 100% user-facing text trong scope là tiếng Việt chuẩn, có dấu.
- Không hiện raw enum/service/Supabase value như `pending_payment`, `policy`, `in_progress`, `billing_runs`, `room_asset_auto`.
- Label ưu tiên ngắn và cụ thể: "Chờ thanh toán", "Đã thanh toán một phần", "Chính sách", "Ghi đè", "Kỳ tính tiền", "Cảnh báo".
- Badge/nút không chứa câu dài. Nếu cần giải thích, đưa vào helper text hoặc tooltip/small text.
- Ngày giờ dùng `dd/MM/yyyy`, `dd/MM/yyyy HH:mm`; tiền dùng `formatVND`; relative time dùng locale Việt Nam.

## Action hierarchy

- Primary action: một nút chính trên header/toolbar, ví dụ "Tạo hóa đơn", "Thêm tài sản", "Tạo hợp đồng".
- Secondary actions: export, refresh, filter nâng cao, xem lịch sử dùng outline/ghost hoặc menu.
- Row actions: một hành động rõ nhất + menu phụ nếu nhiều lựa chọn.
- Dangerous actions: tách khu vực/menu riêng, màu destructive, có confirm dialog, không đặt sát CTA chính.

</layout_contracts>

<wave_plan>

## Wave 1 - Audit frontend hiện tại

Mục tiêu: lập bản đồ vấn đề UI thực tế trước khi sửa code để tránh làm mù trong scope rộng.

### Tasks

1. Audit route và file ownership
   - Files: `src/routes/ownerRoutes.tsx`, các views/components trong frontmatter.
   - Action: đối chiếu module user liệt kê với route thực tế `/owner/...` và file đang render.
   - Verify: có danh sách file/page/component cuối cùng trước khi sửa.
   - Acceptance: không bỏ sót module `assets`, `amenities`, `tenants`, `contracts`, `addendums`, `utility-billing`, `billing-runs`, `services`, `utility-policies`, `utility-overrides`, `invoices`, `payments`, `tickets`.

2. Audit layout/container
   - Files: shell + toàn bộ list/detail/modal trong scope.
   - Action: tìm `max-w-7xl`, `max-w-[1440px]`, `mx-auto`, padding kép, thiếu `min-w-0`, thiếu `overflow-x-auto`.
   - Verify: ghi nhận theo nhóm "sửa ngay", "theo dõi", "không chạm".
   - Acceptance: xác định rõ màn nào bị bó width, màn nào có nguy cơ ép cột.

3. Audit visual density
   - Files: utility, services, contracts, finance modals, tenant/ticket/asset modals.
   - Action: rà `rounded-[28px+]`, gradient, shadow lớn, hero H1, card lồng card.
   - Verify: chỉ đánh dấu trong scope admin/owner, không mở sang public/portal trừ shared helper ảnh hưởng trực tiếp.
   - Acceptance: có danh sách khu vực cần giảm decorative styling.

4. Audit Vietnamese and formatter
   - Files: presentation helpers, i18n, status badges, target views/modals.
   - Action: tìm raw enum, English technical text, text không dấu, `toLocale*` rời rạc, fallback raw.
   - Verify: các lỗi chắc chắn từ research được đưa vào danh sách sửa: `pending_payment`, `policy`, `Khong...`, `Xac nhan...`, ticket fallback raw, utility fallback raw.
   - Acceptance: không để các lỗi đã biết biến mất khỏi plan execute.

## Wave 2 - Áp dụng layout shell/container responsive

Mục tiêu: chốt nền layout để các module bên dưới không tự bó width hoặc làm vỡ content.

### Tasks

1. Giữ và kiểm tra shell contract
   - Files: `AdminLayout.tsx`, `Topbar.tsx`, `Sidebar.tsx`.
   - Action: bảo toàn `flex-1 min-w-0`, `minmax(0,1fr)`, `max-w-[1760px]`; chỉ chỉnh nếu audit phát hiện sidebar/topbar ép sai content.
   - Verify: desktop/mobile sidebar không che content; content không overflow toàn trang.
   - Acceptance: main content cạnh sidebar luôn có `flex-1 min-w-0`.

2. Gỡ wrapper hẹp ở page-level
   - Files ưu tiên: `UtilityHubPage.tsx`, `BillingRunsPage.tsx`, `UtilityPoliciesPage.tsx`, `UtilityOverridesPage.tsx`, `AmenityManagementPage.tsx`, `ContractList.tsx`, `ContractDetail.tsx`, `AddendumListPage.tsx`, `CreateContractWizard.tsx`.
   - Action: thay wrapper `mx-auto max-w-7xl/max-w-[1440px]` bằng root `min-w-0 space-y-4 md:space-y-5`, dựa vào shell width.
   - Verify: ở 1600/1920 content không còn đảo hẹp bất hợp lý.
   - Acceptance: không còn page trong scope bị khóa 1200-1440px nếu là màn vận hành dày.

3. Chuẩn hóa page header
   - Files: list/detail pages trong scope.
   - Action: header compact, H1 vừa phải, action group responsive, description ngắn.
   - Verify: 390px header stack đẹp, CTA không tràn.
   - Acceptance: không dùng hero marketing cho page vận hành.

4. Chuẩn hóa responsive grid base
   - Files: pages có metric/cards/rails.
   - Action: dùng `grid-cols-1 md:grid-cols-2 xl:grid-cols-*` hoặc `grid-cols-[minmax(0,1fr)_320px]` ở desktop; rail stack dưới ở <=1024.
   - Verify: 1024/768 rail không ép main table.
   - Acceptance: mobile 1 cột, tablet 2 cột khi phù hợp, desktop nhiều cột hợp lý.

## Wave 3 - Refactor grid/card/table/form/action

Mục tiêu: đưa các module về pattern vận hành thực dụng, ưu tiên scan nhanh và thao tác ít đoán.

### Tasks

1. Shared table contract
   - Files: `src/components/shared/DataTable.tsx`, target tables trong scope.
   - Action: thêm hoặc tận dụng prop/class để truyền min-width; áp dụng wrapper `overflow-x-auto` + table min-width cụ thể.
   - Verify: `AssetCatalog`, `PaymentList`, `TicketList`, `BillingRunsPage`, invoice/payment/tenant/detail child tables không ép cột.
   - Acceptance: mọi bảng nhiều cột có scroll ngang nội bộ và action cell usable.

2. Assets và amenities
   - Files: `AssetCatalog.tsx`, `AssetModal.tsx`, `AmenityManagementPage.tsx`, `AmenityCheckin.tsx`.
   - Action: giữ asset list theo table compact; làm rõ tài sản master vs gán phòng; thay "policy" bằng "quy định/chính sách sử dụng" theo ngữ cảnh; giảm modal/card quá bo tròn.
   - Verify: mobile table scroll nội bộ; amenity labels không còn raw status/policy.
   - Acceptance: người dùng hiểu đang quản lý tài sản/dịch vụ tiện ích nào và hành động chính ở đâu.

3. Tenants
   - Files: `TenantList.tsx`, `TenantDetail.tsx`, `TenantFormModal.tsx`, `components/tenants/detail/*`.
   - Action: list theo operational table/card compact; detail tab responsive; form modal gọn hơn; thông tin chính/phụ rõ.
   - Verify: tenant detail ở 1024/768/390 không ép tab desktop; text không dấu được sửa.
   - Acceptance: hồ sơ cư dân, liên hệ, phòng/hợp đồng, onboarding, hóa đơn liên quan scan được nhanh.

4. Contracts và addendums
   - Files: `ContractList.tsx`, `ContractDetail.tsx`, `CreateContractWizard.tsx`, `AddendumListPage.tsx`, `components/contracts/*`, `contractPresentation.ts`.
   - Action: list/addendum list đi theo Variant A; detail header gọn; wizard giữ split workspace Variant C; dangerous actions tách riêng.
   - Verify: contract/addendum statuses, type labels, timeline/tab không leak raw type.
   - Acceptance: hợp đồng/phụ lục có status, thời hạn, phòng, người thuê, tiền thuê/cọc, dịch vụ, hóa đơn liên quan rõ ràng.

5. Utility billing, policies, overrides, billing runs
   - Files: `UtilityHubPage.tsx`, `BillingRunsPage.tsx`, `UtilityPoliciesPage.tsx`, `UtilityOverridesPage.tsx`, `utilityPresentation.ts`.
   - Action: `UtilityHubPage` mượn Variant B nhẹ; policies/overrides/runs chuyển sang table/list scan-first; giảm hero gradient; warnings/errors dùng mapping tiếng Việt.
   - Verify: run history có table min-width; warning không hiện raw code; source/status labels rõ.
   - Acceptance: người dùng thấy rõ quan hệ chính sách, ghi đè, kỳ chạy, cảnh báo và việc cần sửa.

6. Services
   - Files: `ServiceCatalog.tsx`, `ServiceDetailModal.tsx`, `UpdatePriceModal.tsx`, `PriceHistoryTable.tsx`.
   - Action: chuyển từ decorative catalog sang danh mục dịch vụ vận hành/price-list; lịch sử giá có table rõ; modal form responsive.
   - Verify: tiền/ngày dùng format Việt Nam; CTA cập nhật giá rõ; không có hero/icon trang trí quá nổi.
   - Acceptance: staff đọc được dịch vụ, nhóm, giá hiện tại, hiệu lực, trạng thái nhanh.

7. Invoices và payments
   - Files: `InvoiceList.tsx`, `InvoiceDetail.tsx`, `PaymentList.tsx`, `PaymentDetail.tsx`, invoice modals, `RecordPaymentModal.tsx`.
   - Action: table min-width rõ; modals giảm radius/hero; trạng thái thanh toán dùng nhãn Việt; action ghi nhận/xem chi tiết rõ; dangerous actions tách.
   - Verify: không còn `pending_payment` hiển thị; không còn "Mã policy" nếu nên dịch thành "Mã chính sách"; table finance không ép cột.
   - Acceptance: hóa đơn/thanh toán scan theo trạng thái, kỳ/hạn, người thuê/phòng, số tiền, còn nợ, thời điểm.

8. Tickets
   - Files: `TicketList.tsx`, `TicketDetail.tsx`, `StaffMyTickets.tsx`, `TicketKanban.tsx`, `TicketFormModal.tsx`, `features/tickets/*`.
   - Action: giữ domain slice hiện có; bổ sung table/kanban min-width; giảm modal styling quá trang trí; fix fallback category/status/priority.
   - Verify: ticket status/category/priority luôn tiếng Việt; mobile không vỡ kanban/table.
   - Acceptance: ticket list/detail ưu tiên trạng thái xử lý, mức ưu tiên, phòng/người gửi, phụ trách, hạn/cập nhật, hành động tiếp theo.

## Wave 4 - Việt hóa text, trạng thái, ngày giờ, thuật ngữ

Mục tiêu: loại toàn bộ raw technical value và chuẩn hóa ngôn ngữ hiển thị.

### Tasks

1. Presentation helper sweep
   - Files: `contractPresentation.ts`, `utilityPresentation.ts`, `ticketPresentation.ts`, `ticketMetadata.ts`, `assetMappers.ts`, `assetBilling.ts`, `utils/index.ts`.
   - Action: thêm mapping còn thiếu; fallback unknown chuyển sang nhãn an toàn tiếng Việt như "Khác", "Chưa xác định", "Cần kiểm tra" thay vì raw.
   - Verify: grep raw enum phổ biến không còn xuất hiện trong JSX/user-facing strings.
   - Acceptance: UI không hiện technical enum/service value.

2. i18n và hardcoded text sweep
   - Files: `src/i18n/vi/common.json`, target views/components.
   - Action: sửa text không dấu, English labels, error/toast/message; thống nhất tên module.
   - Verify: các lỗi đã biết trong research được sửa hoặc có task rõ nếu phụ thuộc file khác.
   - Acceptance: 100% text nhìn thấy trong scope là tiếng Việt chuẩn.

3. Date/time/currency sweep
   - Files: target views/components.
   - Action: dùng `formatDate`, `formatVND`, domain formatter hiện có; tránh logic format mới rời rạc.
   - Verify: ngày `dd/MM/yyyy` hoặc `dd/MM/yyyy HH:mm`, tiền VND thống nhất.
   - Acceptance: ngày, tháng, năm, giờ theo chuẩn Việt Nam.

4. User-friendly service errors
   - Files: utility/invoice/payment/ticket/contract presentation helpers và states.
   - Action: dịch lỗi kỹ thuật sang thông báo hành động được: đổi bộ lọc, chọn tòa nhà, thử lại, kiểm tra chính sách.
   - Verify: error states không show raw Supabase/service message khi đã map được.
   - Acceptance: người không rành công nghệ vẫn hiểu cần làm gì tiếp.

## Wave 5 - Responsive polish + loading/empty/error states

Mục tiêu: hoàn thiện trải nghiệm thực tế ở tablet/mobile và các trạng thái dữ liệu.

### Tasks

1. Responsive polish theo breakpoint
   - Files: toàn bộ module trong scope.
   - Action: kiểm tra header, toolbar, filters, tabs, grid, table, modals ở `1920`, `1600`, `1440`, `1366`, `1280`, `1024`, `768`, `390`.
   - Verify: dùng viewport thật, không dùng browser zoom 50%.
   - Acceptance: không có overflow ngang ngoài table, không text/button/badge đè nhau.

2. Toolbar/filter polish
   - Files: list pages, advanced filter components.
   - Action: search full row khi cần, filters 1-2 cột ở mobile/tablet, action group wrap đúng.
   - Verify: 1366/1024/768/390 không có nút bị ép nhỏ hoặc label tràn.
   - Acceptance: người dùng lọc được nhanh, ít đoán.

3. Empty/loading/error states
   - Files: pages và shared states.
   - Action: skeleton theo shape thật, empty state ngắn và có next action, error state rõ tiếng Việt.
   - Verify: trạng thái loading/empty/error của từng module chính được xem qua.
   - Acceptance: không còn màn trống hoặc lỗi kỹ thuật thô.

4. Modal/form polish
   - Files: asset, tenant, contract/addendum, invoice/payment, service, ticket modals.
   - Action: form 1 cột mobile, 2 cột desktop khi đủ rộng, footer action sticky nếu modal dài, label không tràn.
   - Verify: 390px modal usable; primary/cancel/danger rõ.
   - Acceptance: form không vỡ, không phải đoán trường nào cần nhập.

## Wave 6 - Verify lint/build/responsive

Mục tiêu: khóa chất lượng trước khi kết thúc phase.

### Tasks

1. Static verification
   - Command: `npm run lint`
   - Acceptance: pass không warning theo cấu hình repo.

2. Build verification
   - Command: `npm run build`
   - Acceptance: TypeScript build và Vite production build pass.

3. Responsive verification matrix
   - Viewports: `1920`, `1600`, `1440`, `1366`, `1280`, `1024`, `768`, `390`.
   - Routes/modules: assets, amenities, tenants, contracts, addendums, utility hub, billing runs, utility policies, utility overrides, services, invoices, payments, tickets.
   - Acceptance: ghi nhận pass/fail theo module; mọi fail layout chính phải sửa trước khi Done.

4. Copy and raw-value verification
   - Action: grep và manual scan các raw strings đã biết.
   - Acceptance: không còn `pending_payment`, raw policy/status/category/type lộ ra UI trong scope.

5. Regression smoke
   - Action: mở list/detail/modal chính của từng nhóm domain.
   - Acceptance: route `/owner/...` vẫn hoạt động, không phá data fetching, không phá action chính.

</wave_plan>

<threat_model>

## Threat model

Phase này chủ yếu là UI/layout/copy, không dự kiến thay schema, RLS, auth, payment gateway hoặc Supabase edge functions.

Rủi ro cần kiểm soát:

- Không expose raw lỗi kỹ thuật chứa thông tin nội bộ khi dịch error state.
- Không bypass service layer từ UI để lấy dữ liệu chỉ nhằm format label.
- Không làm mất confirm cho dangerous actions.
- Không đổi route/auth guard ngoài scope.
- Không làm modal/action finance dễ bấm nhầm do đặt destructive action cạnh CTA chính.

Mức rủi ro bảo mật dự kiến: thấp đến trung bình. Verification cần smoke test các action nhạy cảm như hủy hóa đơn, chấm dứt hợp đồng, xóa tài sản nếu các button/action liên quan bị động tới.

</threat_model>

<verification>

## Verification

### Responsive checklist bắt buộc

| Viewport | Điều cần kiểm tra |
|---|---|
| `1920px` | Content không bị bó hẹp; không dư trắng vô lý; table/rail cân đối. |
| `1600px` | Desktop rộng ổn định; header/action không quá xa nhau. |
| `1440px` | Desktop baseline; page đạt trạng thái tối ưu. |
| `1366px` | Laptop phổ biến; toolbar không wrap xấu; sidebar không ép content. |
| `1280px` | Grid/rail chuyển hợp lý; bảng vẫn usable. |
| `1024px` | Rail stack; filters 2 cột; tab/segment scroll được. |
| `768px` | Tablet portrait; table scroll nội bộ; sidebar/topbar không che content. |
| `390px` | Mobile hẹp; header stack, CTA rõ, badge/nút/text không tràn, table không kéo vỡ page. |

### Module verification

- `assets`: list, modal thêm/sửa, trạng thái, master vs room assignment label.
- `amenities`: quản lý tiện ích, staff check-in nếu bị ảnh hưởng, status/policy wording.
- `tenants`: list, detail tabs, form/modal, onboarding text.
- `contracts`: list, detail, wizard, tabs, dangerous actions.
- `addendums`: list, modal tạo/sửa nếu có, type/status labels.
- `utility-billing`: hub, run setup/review nếu có, warnings.
- `billing-runs`: run history, progress, snapshot/detail table.
- `services`: catalog, detail modal, update price modal, price history.
- `utility-policies`: list/form/status/source labels.
- `utility-overrides`: list/form/scope labels.
- `invoices`: list, detail, create/bulk modals, status and utility snapshot labels.
- `payments`: list, detail, record payment modal.
- `tickets`: list, detail, kanban, staff my tickets, ticket form modal.

### Commands

- `npm run lint`
- `npm run build`

### Manual checks

- Không có raw technical value trong UI.
- Không có user-facing English thô trong scope.
- Ngày giờ và tiền tệ theo chuẩn Việt Nam.
- Action chính/phụ/nguy hiểm đúng thứ bậc.
- Empty/loading/error states rõ và có next action khi phù hợp.

</verification>

<success_criteria>

- Tất cả module trong scope có layout dashboard vận hành: đơn giản, rõ, ít trang trí, scan nhanh.
- Content fluid theo shell, không bị bó cứng 1200-1440px gây dư trắng trên màn lớn.
- Main content cạnh sidebar giữ `flex-1 min-w-0`; page roots và wrapper ngang quan trọng có `min-w-0`.
- Bảng nhiều cột có `overflow-x-auto` và `min-width` cụ thể; horizontal scroll chỉ nằm trong bảng.
- Grid responsive đúng: mobile 1 cột, tablet 2 cột khi phù hợp, desktop nhiều cột hợp lý.
- Card, badge, nút, input, toolbar và action cell căn hàng đều, không tràn viền, không đè lên nhau.
- 100% text nhìn thấy trong scope là tiếng Việt chuẩn, có dấu.
- Không còn enum/raw value/service technical value lộ ra UI.
- Ngày giờ, tiền tệ, kỳ tính tiền hiển thị theo chuẩn Việt Nam.
- Primary/secondary/dangerous actions được phân cấp rõ.
- Loading, empty, error states gọn, rõ, tiếng Việt và có hướng xử lý.
- Responsive pass ở `1920`, `1600`, `1440`, `1366`, `1280`, `1024`, `768`, `390`.
- `npm run lint` và `npm run build` pass.

</success_criteria>

<definition_of_done>

- Scope file/page/component thực tế được audit trước khi sửa code.
- Variant A từ Sketch 004 được áp dụng làm pattern chính cho list pages; Variant B/C chỉ dùng đúng chỗ đã chốt.
- Các page wrappers hẹp trong scope được gỡ hoặc nới theo shell `max-w-[1760px]`.
- Shared table contract hoặc equivalent được áp dụng nhất quán.
- Các lỗi text đã biết từ research được xử lý.
- UI không vỡ ở mobile/tablet/laptop/desktop/màn lớn theo 8 breakpoint.
- Không thêm landing page, marketing layout, business flow mới, schema Supabase mới hoặc refactor kiến trúc rộng ngoài scope.
- Build/lint pass và kết quả responsive/manual verification được ghi lại trong summary khi execute phase.

</definition_of_done>
