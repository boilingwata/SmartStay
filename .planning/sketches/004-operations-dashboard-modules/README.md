---
sketch: 004
name: operations-dashboard-modules
question: "Pattern frontend nào nên dùng để tinh chỉnh các module vận hành assets, amenities, tenants, contracts, addendums, utility-billing, billing-runs, services, utility-policies, utility-overrides, invoices, payments và tickets?"
winner: A
tags: [dashboard, operations, responsive, tables, vietnamese, phase-17]
---

# Sketch 004: Operations Dashboard Modules

## Design Question

SmartStay nên dùng pattern frontend nào cho nhóm module vận hành rộng của phase 17 để vừa giống dashboard SaaS production, vừa dễ dùng, rõ CTA, không rối và responsive tốt?

## How to View

Mở `.planning/sketches/004-operations-dashboard-modules/index.html`.

## Variants

- **A: Bảng vận hành** — hướng khuyến nghị. Dùng bảng/list làm trung tâm, toolbar gọn, metric vừa đủ, rail phụ cho cảnh báo và việc cần làm.
- **B: Command center theo nhóm** — gom module thành các cụm nghiệp vụ lớn như Tài chính, Hợp đồng, Cư dân, Vận hành, Tiện ích.
- **C: Split workspace** — layout nhiều bước có step rail, bảng chính và summary rail, phù hợp với luồng tạo/chạy/kiểm tra phức tạp.

## Winner

**Variant A: Bảng vận hành** là hướng nên dùng làm default cho code thật.

Lý do:

- Phù hợp nhất với dashboard vận hành SaaS: scan nhanh, thao tác nhanh, ít phải đoán.
- Dùng lại tốt cho nhiều module có dữ liệu dạng list/table: `assets`, `tenants`, `contracts`, `addendums`, `billing-runs`, `invoices`, `payments`, `tickets`.
- Dễ kiểm soát responsive bằng `overflow-x-auto`, `min-width`, `min-w-0`, toolbar wrap và rail phụ chuyển xuống dưới ở màn hẹp.
- CTA chính luôn rõ; thao tác nguy hiểm được tách khỏi toolbar chính.

## What to Look For

- Header có đủ rõ module hiện tại và CTA chính không.
- Bảng có đủ dày để scan nhanh nhưng không rối không.
- Rail phụ có giúp người dùng thấy việc cần ưu tiên không.
- Ở viewport 390px, bảng cuộn ngang trong vùng của nó, không kéo vỡ toàn trang.
- Variant B và C có ý nào nên mượn mà không làm UI thật nặng lên không.

