# Sketch 004 - Design Notes For Plan Phase

## Recommended Direction

Chọn **Variant A: Bảng vận hành** làm pattern chính cho phase 17.

Đây là pattern thực dụng nhất cho dashboard SaaS của SmartStay: header gọn, CTA chính rõ, metric ngắn, filter toolbar, segment trạng thái, bảng có cuộn ngang và rail phụ cho cảnh báo/việc ưu tiên. Pattern này giúp người dùng vận hành quét nhanh dữ liệu mà không phải học interaction mới.

## Layout Pattern

### Desktop 1280px+

- Shell: sidebar trái, main content `flex-1 min-w-0`.
- Content: fluid width, `max-width` khoảng `1600px` đến `1760px`; các màn cần dữ liệu rất rộng có thể dùng full width.
- Header: breadcrumb nhỏ, H1 ngắn, action group bên phải.
- Metric row: 3-4 metric tối đa, chỉ giữ số liệu giúp quyết định thao tác.
- Main area: grid `minmax(0, 1fr) + 300-340px rail`.
- Rail phụ: việc cần ưu tiên, cảnh báo, quy tắc dữ liệu, không dùng để nhồi thêm form lớn.

### Tablet 768-1024px

- Sidebar có thể chuyển thành thanh ngang hoặc drawer theo shell hiện có.
- Main area chuyển thành 1 cột; rail phụ xuống dưới hoặc thành section phụ.
- Toolbar/filter chuyển từ 5-6 cột xuống 2 cột; search chiếm full row.
- Tabs/segments được phép cuộn ngang.

### Mobile 390px

- Header stack dọc, CTA chính full width nếu cần.
- Metric row 1 cột.
- Filter 1 cột; tránh label dài phá layout.
- Bảng nằm trong wrapper riêng `overflow-x-auto`; bảng có `min-width` khoảng `920px-1120px` tùy module.
- Không dùng tab desktop ép nhỏ. Dùng segment cuộn ngang, dropdown hoặc section list.

## Spacing And Visual Style

- Card/panel radius nên giữ ở `8px` cho dashboard vận hành.
- Section padding desktop `12-16px`, page padding responsive `12-28px`.
- Không dùng hero, decorative blob, gradient lớn hoặc card lồng card.
- Màu nền restrained: nền xám rất nhạt, surface trắng, border rõ nhẹ.
- Badge dùng tone theo nghĩa nghiệp vụ: xanh lá hoàn tất, vàng cần chú ý, đỏ quá hạn/nguy hiểm, xanh dương đang xử lý, xám trung tính.
- Typography nhỏ gọn, không dùng hero-scale type trong dashboard.

## Table Behavior

- Mọi bảng nhiều cột phải có wrapper `overflow-x-auto`.
- Table phải có `min-width`; không cố co mọi cột vào mobile.
- Cột đầu nên chứa mã + mô tả phụ trong 2 dòng.
- Cột đối tượng nên cho phép truncate có kiểm soát.
- Status/priority dùng badge không wrap lung tung.
- Action cell không được co quá hẹp. Nếu nhiều action, dùng 1 primary + 1 secondary hoặc menu.
- Sticky columns có thể cân nhắc sau, nhưng không bắt buộc trong phase nếu gây phức tạp.

## Card/Grid Behavior

- Dùng card compact cho overview/hub hoặc module có ít cột.
- Grid: mobile 1 cột, tablet 2 cột, desktop 3-4 cột tùy chiều rộng.
- Không dùng card lớn như landing page.
- Không nhồi quá 3-4 dòng metadata trong một card.

## CTA And Dangerous Actions

- Mỗi màn chỉ nên có một CTA chính nổi bật trong header hoặc toolbar.
- Action thường gặp để gần row hoặc toolbar.
- Action nguy hiểm như hủy hợp đồng, xóa tài sản, hủy hóa đơn, chấm dứt hợp đồng phải tách riêng trong detail/menu riêng và có xác nhận.
- Không đặt nút nguy hiểm cạnh nút chính nếu người dùng có thể bấm nhầm.

## Apply To Real Code

Nên áp dụng Variant A cho:

- `src/views/admin/assets/AssetCatalog.tsx`
- `src/views/admin/settings/AmenityManagementPage.tsx`
- `src/views/admin/tenants/TenantList.tsx`
- `src/views/admin/contracts/ContractList.tsx`
- `src/views/admin/contracts/AddendumListPage.tsx`
- `src/views/admin/settings/BillingRunsPage.tsx`
- `src/views/admin/services/ServiceCatalog.tsx`
- `src/views/admin/settings/UtilityPoliciesPage.tsx`
- `src/views/admin/settings/UtilityOverridesPage.tsx`
- `src/views/admin/finance/InvoiceList.tsx`
- `src/views/admin/finance/PaymentList.tsx`
- `src/views/admin/tickets/TicketList.tsx`
- `src/views/admin/staff/StaffMyTickets.tsx`

Nên áp dụng một phần Variant A cho detail pages:

- Header gọn.
- Status/summary rõ.
- CTA chính rõ.
- Bảng con có overflow.
- Dangerous actions tách riêng.

## Borrow From Other Variants

### Borrow From Variant B

Chỉ nên mượn ý tưởng nhóm nghiệp vụ cho `UtilityHubPage` hoặc một dashboard/hub cấp cao nếu cần:

- Tài chính: invoices + payments.
- Hợp đồng: contracts + addendums.
- Vận hành: assets + amenities + services + tickets.
- Tiện ích: utility billing + policies + overrides + runs.

Không nên dùng Variant B làm pattern chính cho list module vì nó thêm một lớp điều hướng và làm chậm thao tác hằng ngày.

### Borrow From Variant C

Nên dùng split workspace cho luồng nhiều bước hoặc màn cần kiểm tra dữ liệu:

- `CreateContractWizard`
- chạy utility billing run
- tạo phụ lục phức tạp
- detail có nhiều cảnh báo cần xác nhận trước khi lưu

Không nên dùng Variant C cho danh sách đơn giản như `PaymentList`, `ServiceCatalog` hoặc `AssetCatalog` nếu không có workflow nhiều bước.

## Do Not Implement

- Không implement command center Variant B cho tất cả module.
- Không biến mọi list page thành dashboard card hub.
- Không dùng split workspace cho mọi màn chỉ vì trông có cấu trúc.
- Không thêm business flow mới như phê duyệt, ký số, ví tenant, payment gateway hoặc automation.
- Không đổi schema/backend chỉ để làm UI giống sketch.

## Verification Checklist For Plan Phase

- Viewport: `1920`, `1600`, `1440`, `1366`, `1280`, `1024`, `768`, `390`.
- Main wrapper: có `flex-1 min-w-0` hoặc equivalent.
- Table wrapper: có `overflow-x-auto`.
- Table: có `min-width` thực tế.
- Toolbar: wrap có kiểm soát.
- CTA chính: dễ thấy và không tranh chấp với secondary actions.
- Dangerous actions: tách khỏi CTA chính.
- Text: 100% tiếng Việt chuẩn.
- Dates: `dd/MM/yyyy` hoặc `dd/MM/yyyy HH:mm`.
- Raw technical values: không xuất hiện trên UI.
