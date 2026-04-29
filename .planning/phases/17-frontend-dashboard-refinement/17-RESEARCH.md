# Phase 17: Frontend Dashboard Refinement - Research

**Researched:** 2026-04-29
**Status:** Ready for plan-phase

## Scope

Nghiên cứu frontend cho các module:

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

Inputs đã đọc:

- `.planning/phases/17-frontend-dashboard-refinement/17-CONTEXT.md`
- `.planning/sketches/004-operations-dashboard-modules/SKETCH.md`
- `.planning/sketches/004-operations-dashboard-modules/README.md`
- `.planning/sketches/MANIFEST.md`
- Targeted code scan across shell, routes, list/detail pages, shared UI components, and presentation helpers.

## Findings Quan Trọng

### 1. Shell admin đã gần đúng, nhưng page-level wrappers vẫn tự bó layout

`src/components/layout/AdminLayout.tsx` đã dùng grid sidebar/main, `minmax(0, 1fr)`, `main min-w-0 flex-1`, và content wrapper `max-w-[1760px]`. `src/components/layout/Topbar.tsx` cũng dùng `max-w-[1760px]`.

Rủi ro còn lại nằm ở từng module tự bọc `mx-auto max-w-7xl` hoặc `max-w-[1440px]`, ví dụ:

- `src/views/admin/settings/UtilityHubPage.tsx`
- `src/views/admin/settings/BillingRunsPage.tsx`
- `src/views/admin/settings/UtilityPoliciesPage.tsx`
- `src/views/admin/settings/AmenityManagementPage.tsx`
- `src/views/admin/contracts/ContractList.tsx`
- `src/views/admin/contracts/AddendumListPage.tsx`

Plan-phase nên ưu tiên bỏ/nới các wrapper này trong scope phase 17. Nếu cần giới hạn, dùng `max-w-[1760px]` đồng bộ với shell hoặc để page content full width khi bảng nhiều cột.

### 2. Sketch 004 Variant A là pattern chính nên dùng

Sketch 004 chốt **Variant A: Bảng vận hành** làm default:

- header gọn
- một CTA chính
- metric row ngắn
- filter toolbar
- segment trạng thái
- bảng có `overflow-x-auto` và `min-width`
- rail phụ cho cảnh báo/việc ưu tiên khi desktop đủ rộng
- action nguy hiểm tách khỏi toolbar chính

Áp dụng trực tiếp cho list pages: `AssetCatalog`, `TenantList`, `ContractList`, `AddendumListPage`, `BillingRunsPage`, `ServiceCatalog`, `UtilityPoliciesPage`, `UtilityOverridesPage`, `InvoiceList`, `PaymentList`, `TicketList`, `StaffMyTickets`.

### 3. Nhiều màn hiện nghiêng về decorative dashboard hơn operational dashboard

Các utility/service pages có nhiều `rounded-[28px]`, `rounded-[32px]`, gradient, shadow lớn, H1 lớn, card nhiều tầng. Điều này làm UI nặng và gần marketing/dashboard showcase hơn dashboard vận hành.

Files có tín hiệu rõ:

- `UtilityHubPage.tsx`: hero gradient, rounded 32, nhiều card lớn.
- `BillingRunsPage.tsx`: hero nền tối, H1 lớn, card run history dạng grid; lịch sử chạy nên thành bảng scan nhanh hơn.
- `ServiceCatalog.tsx`: icon hero xoay, CTA style lớn, card radius lớn.
- `AmenityManagementPage.tsx`: nhiều khối form/card lớn, còn thuật ngữ `policy`.

Plan-phase nên giảm radius về khoảng `8px-16px`, bỏ hero/gradient lớn, giữ surface trắng/xám nhạt, tăng mật độ scan.

### 4. Table overflow có nhưng chưa đủ contract

Một số bảng đã có `overflow-x-auto`, nhưng nhiều bảng chỉ dùng `min-w-full` hoặc `w-full`; ở mobile/tablet bảng vẫn có thể ép cột thay vì scroll hữu ích.

Ví dụ:

- `AssetCatalog.tsx` tốt hơn vì có `overflow-x-auto` + `table min-w-[1000px]`.
- `PaymentList.tsx` có `overflow-x-auto` nhưng table là `w-full`, cần `min-w-[1000px]` hoặc hơn.
- `TicketList.tsx` có `overflow-x-auto` nhưng table là `min-w-full`, cần min-width cụ thể.
- `Tenant detail` tabs/tables có `overflow-x-auto`, nhưng detail tabs và table width cần mobile contract rõ hơn.
- Shared `DataTable.tsx` bọc `overflow-auto`, nhưng table là `w-full`; nên thêm prop hoặc class để truyền `min-w-[...]`.

Plan-phase phải tạo table contract thống nhất: wrapper `overflow-x-auto`, table `min-w-[920px-1200px]`, action cell không co hẹp, text truncate/wrap có chủ đích.

### 5. Text/label chưa đạt 100% tiếng Việt chuẩn

Các điểm cần sửa chắc chắn:

- `CreateInvoiceModal.tsx` hiển thị raw `pending_payment`.
- `AmenityManagementPage.tsx` hiển thị `Tạo policy`, `Chỉnh sửa policy`, và fallback `item.status` raw.
- `TenantDetail.tsx` toast fallback còn không dấu: `Khong the cap nhat...`.
- `components/tenants/detail/OnboardingTab.tsx` còn không dấu: `Xac nhan thong tin ca nhan`, `Da xong`, `Theo doi`.
- `features/tickets/ticketPresentation.ts` fallback category hiện format raw technical string thành title case; cần mapping tiếng Việt hoặc fallback "Khác/Chưa phân loại", không expose raw category.
- `StatusBadge.tsx` có fallback `status || ''`; nếu thiếu translation sẽ show raw English/technical status.
- `utilityPresentation.ts` đã map nhiều backend messages, nhưng fallback vẫn trả raw input; warning label fallback cũng có thể show raw code.

Plan-phase phải có sweep label/presentation ở cuối, nhưng một số lỗi trên nên sửa trong wave domain tương ứng để tránh UI mới vẫn lộ technical value.

### 6. Existing formatter stack đủ dùng, không cần thư viện mới

`src/utils/index.ts` đã có:

- `formatDate(date, 'dd/MM/yyyy')`
- `formatVND`
- `formatRelativeTime`
- `date-fns` với locale `vi`

`features/tickets/ticketPresentation.ts` có `date-fns-tz` với `Asia/Ho_Chi_Minh`.

Không cần thêm thư viện date/currency mới. Plan-phase nên bắt các module dùng formatter hiện có hoặc thêm helper nhỏ cho domain nếu cần, tránh `toLocaleTimeString()` rời rạc vì có thể lệch format.

## Standard Stack

Giữ stack hiện có:

- React 18 + TypeScript + Vite.
- Tailwind CSS + shadcn-style UI primitives.
- Lucide React icons.
- React Query cho data state.
- Existing services as data boundary.
- Existing presentation helpers where available:
  - `src/lib/contractPresentation.ts`
  - `src/lib/utilityPresentation.ts`
  - `src/features/tickets/ticketPresentation.ts`
  - `src/features/tickets/ticketMetadata.ts`
  - `src/lib/assetMappers.ts`
  - `src/lib/assetBilling.ts`
  - `src/utils/index.ts`

Không thêm UI framework, table library mới, date library mới hoặc design system mới trong phase này.

## Architecture Patterns

### Page Layout Pattern

Use:

```tsx
<div className="min-w-0 space-y-4 md:space-y-5">
  <PageHeader />
  <MetricGrid />
  <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
    <MainOperationalTable />
    <PriorityRail />
  </section>
</div>
```

Rules:

- Page root must be `min-w-0`.
- Use shell width; do not re-wrap every page with `max-w-7xl`.
- Keep page padding from `AdminLayout`; avoid duplicate large `px-8 py-10` unless needed.
- Use rail only when it has useful operational alerts or summary.

### Table Pattern

Use:

```tsx
<div className="min-w-0 overflow-hidden rounded-lg border bg-white">
  <div className="overflow-x-auto">
    <table className="min-w-[1080px] w-full text-left text-sm">
      ...
    </table>
  </div>
</div>
```

Rules:

- `min-w-[920px]` for modest tables.
- `min-w-[1080px]` for finance/contracts/tickets.
- `min-w-[1200px]` when table includes amount, date, owner, status, actions.
- Action cell must be `whitespace-nowrap` or fixed/min width.
- First cell should carry code + secondary context in two lines.
- Long object names use `truncate`, `max-w-*`, or controlled wrap.

### Filter Toolbar Pattern

Use:

- Desktop: search + 3-5 filters + action group.
- Tablet: search full row, filters 2 columns.
- Mobile: 1 column filters, segment tabs scroll horizontally.

Avoid:

- Oversized filter cards.
- Keeping every action visible on mobile.
- Primary and destructive actions in the same visual group.

### Detail Page Pattern

For detail pages, borrow only the useful part of Sketch 004 A:

- compact header
- status and key metadata near title
- CTA primary visible
- dangerous actions separated into detail menu/confirmation zone
- related child tables use table contract

Use Sketch 004 C only for real multi-step flows:

- `CreateContractWizard`
- utility billing run setup/review
- complex addendum creation

Do not use split workspace for simple lists.

## Don't Hand-Roll

- Do not create new date/currency formatting logic; use `formatDate`, `formatVND`, or domain helper wrappers.
- Do not create new raw status mapping inside each component when a presentation helper already exists.
- Do not create a second table abstraction unless shared `DataTable` cannot be safely extended.
- Do not create custom responsive breakpoints outside Tailwind conventions.
- Do not add schema/backend changes just to match the sketch.
- Do not rebuild sidebar/topbar; adjust shell only if a module cannot become responsive without shell changes.

## Common Pitfalls

### Container Pitfalls

- `AdminLayout` already has `max-w-[1760px]`; adding page-level `max-w-7xl` reintroduces desktop whitespace.
- `mx-auto max-w-[1440px]` is still too narrow for dense operational tables at 1600/1920.
- Duplicated padding from shell + page can make content feel narrower than CSS suggests.

### Table Pitfalls

- `overflow-x-auto` without table `min-width` does not guarantee useful scrolling.
- `min-w-full` is not enough; it lets columns compress to viewport width.
- Action buttons in every row can create visual noise; use one primary action plus menu/secondary when needed.
- Badge text needs `whitespace-nowrap` and max width discipline.

### Typography Pitfalls

- Hero-scale H1 (`text-4xl md:text-5xl`) is wrong for operational module pages.
- Letter spacing on small labels can worsen Vietnamese readability.
- Long Vietnamese labels need shorter business wording, not smaller viewport-scaled font.
- Do not use browser zoom as a responsive proxy.

### Presentation Pitfalls

- Generic `StatusBadge` can leak raw status if no `label` or i18n key exists.
- Backend error messages from Supabase/service must be translated or replaced with action-oriented Vietnamese.
- Ticket category fallback must not title-case raw DB values.
- Utility warnings should not show raw warning code if mapping missing.

## Layout Risks

### High Risk

- Utility pages use page-level `max-w-7xl`, large hero sections, many rounded large cards. This conflicts most strongly with the sketch direction.
- Finance tables need explicit min-width and action-cell rules; invoices/payments are operationally dense.
- Contracts/addendums currently mix grid/card/list patterns. The plan must decide default table/list density per screen.

### Medium Risk

- Tenant detail tabs and cards may remain visually heavy; must make mobile tab behavior explicit.
- ServiceCatalog and AmenityManagementPage include forms and cards; risks are vertical length and unclear CTA hierarchy.
- Shared `DataTable` may need an API/className extension; changing it affects settings/users and any other consumer.

### Lower Risk

- Tickets already has `features/tickets` presentation helpers and table/kanban structure. Main work is density, table min-width, and avoiding raw status leakage.
- Assets already has table overflow + explicit min-width in list; main work is tone, labels, dangerous action separation, and master/assignment clarity.

## Responsive Risks

Verification must cover:

- `1920`: no narrow centered island; content uses shell width.
- `1600`: table + rail still balanced.
- `1440`: primary desktop state.
- `1366`: common laptop; toolbar must not wrap badly.
- `1280`: rail can remain or stack depending page density.
- `1024`: rail should stack; filters should become 2 columns; tabs scroll.
- `768`: sidebar/topbar should not cover content; table scroll must be contained.
- `390`: no text/button/badge overflow; table scroll is internal; CTA stack is readable.

Plan-phase should include screenshot/manual QA for all 8 widths after each wave or at least after each module group.

## Sketch Decisions Nên Dùng

Use from Sketch 004 Variant A:

- Operational table as default center.
- Metrics limited to 3-4 useful signals.
- Filter toolbar, not filter-heavy side panel.
- Segment tabs for status buckets.
- Secondary rail only for alerts/priority summary.
- Action danger separation.
- Table min-width and overflow contract.
- Radius closer to `8px`; avoid 32/40px production dashboard surfaces.

Borrow from Variant B only for:

- `UtilityHubPage` or other high-level hub where grouping helps navigation.
- Group labels: Tài chính, Hợp đồng, Cư dân, Vận hành, Tiện ích.

Borrow from Variant C only for:

- `CreateContractWizard`.
- Utility billing setup/run review.
- Complex addendum or data validation flows.

Do not implement:

- command center cards for every list page.
- split workspace for simple lists.
- new business flows.
- landing-page/marketing styling.

## Module Recommendations For Plan Phase

### Wave 1 - Shell and shared contracts

Files:

- `src/components/layout/AdminLayout.tsx`
- `src/components/layout/Topbar.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/shared/DataTable.tsx`
- `src/components/ui/StatusBadge.tsx`
- `src/components/ui/StatusStates.tsx`
- `src/utils/index.ts`

Tasks:

- Preserve shell `max-w-[1760px]`, `min-w-0`, and grid behavior.
- Add/standardize table min-width support, either through shared classes or `DataTable` props.
- Make `StatusBadge` safer: if unknown status, require explicit `label` or return Vietnamese fallback.
- Ensure shared empty/error states are compact and Vietnamese.
- Avoid broad i18n refactor; fix labels in scope.

### Wave 2 - Finance and utility billing

Files:

- `src/views/admin/finance/InvoiceList.tsx`
- `src/views/admin/finance/PaymentList.tsx`
- `src/views/admin/finance/InvoiceDetail.tsx`
- `src/views/admin/finance/PaymentDetail.tsx`
- `src/components/invoices/modals/CreateInvoiceModal.tsx`
- `src/components/invoices/modals/BulkInvoiceModal.tsx`
- `src/components/shared/modals/RecordPaymentModal.tsx`
- `src/views/admin/settings/UtilityHubPage.tsx`
- `src/views/admin/settings/BillingRunsPage.tsx`
- `src/views/admin/settings/UtilityPoliciesPage.tsx`
- `src/views/admin/settings/UtilityOverridesPage.tsx`
- `src/lib/utilityPresentation.ts`

Tasks:

- Remove `pending_payment` visible text from invoice modal.
- Convert invoice/payment lists to explicit table min-width.
- Make `BillingRunsPage` history a scan-first table or dense list, not primarily card grid.
- Reduce utility hero styling; make `UtilityHubPage` a practical hub using Variant B lightly.
- Translate utility fallback warning/error codes defensively.

### Wave 3 - Contracts, addendums, tenants

Files:

- `src/views/admin/contracts/ContractList.tsx`
- `src/views/admin/contracts/AddendumListPage.tsx`
- `src/views/admin/contracts/ContractDetail.tsx`
- `src/views/admin/contracts/CreateContractWizard.tsx`
- `src/components/contracts/*`
- `src/lib/contractPresentation.ts`
- `src/views/admin/tenants/TenantList.tsx`
- `src/views/admin/tenants/TenantDetail.tsx`
- `src/components/tenants/detail/*`

Tasks:

- Nới contract/addendum list wrappers from `max-w-[1440px]` to shell width.
- Prefer list/table mode for operational scan; keep card/grid as optional if already useful but not default.
- Fix unaccented tenant strings.
- Make detail tabs mobile behavior explicit.
- Keep contract wizard split workspace; do not redesign it into card hub.

### Wave 4 - Assets, amenities, services, tickets

Files:

- `src/views/admin/assets/AssetCatalog.tsx`
- `src/components/assets/AssetModal.tsx`
- `src/views/admin/settings/AmenityManagementPage.tsx`
- `src/views/admin/staff/AmenityCheckin.tsx`
- `src/views/admin/services/ServiceCatalog.tsx`
- `src/components/services/*`
- `src/views/admin/tickets/TicketList.tsx`
- `src/views/admin/tickets/TicketDetail.tsx`
- `src/views/admin/staff/StaffMyTickets.tsx`
- `src/components/tickets/*`
- `src/features/tickets/*`

Tasks:

- Keep AssetCatalog table direction; ensure asset master vs room assignment label clarity.
- Replace amenity `policy` wording with Vietnamese business terms.
- Make ServiceCatalog less decorative and more price-list oriented.
- Add explicit min-width to ticket/staff ticket tables.
- Fix ticket category fallback and ensure all status/category/priority labels are Vietnamese.

### Wave 5 - Text, responsive QA, and cleanup

Tasks:

- Sweep raw technical terms across scope.
- Verify all dates use Vietnamese formatter.
- Check dangerous actions are separated.
- Run `npm run build` and `npm run lint`.
- Manual viewport pass at 8 required widths.

## Code Examples

### Recommended Page Wrapper

```tsx
export default function OperationalListPage() {
  return (
    <div className="min-w-0 space-y-4">
      <PageHeader />
      <MetricRow />
      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 overflow-hidden rounded-lg border bg-white">
          <Toolbar />
          <TableSection />
        </div>
        <PriorityRail />
      </section>
    </div>
  );
}
```

### Recommended Table Wrapper

```tsx
<div className="min-w-0 overflow-x-auto">
  <table className="min-w-[1080px] w-full text-left text-sm">
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</div>
```

### Recommended Action Group

```tsx
<div className="flex flex-wrap items-center justify-end gap-2">
  <Button variant="outline">Xuất file</Button>
  <Button>Thao tác chính</Button>
</div>
```

Danger actions should move to a separated menu or confirmation zone:

```tsx
<DropdownMenuItem className="text-destructive">
  Hủy hóa đơn
</DropdownMenuItem>
```

## Acceptance For Research

- Findings important: captured above.
- Layout risks: captured by risk level and file groups.
- Responsive risks: captured by breakpoint checklist.
- Sketch decisions: Variant A default, B/C limited borrowing.
- Plan-phase recommendations: wave plan and target files included.

## Confidence

High confidence for layout/presentation direction because it is derived from phase context, Sketch 004, shell code, and targeted scans of current module files.

Medium confidence for exact per-line implementation effort because many target files are large and some existing working-tree edits are already present. Plan-phase should re-open target files before writing tasks.
