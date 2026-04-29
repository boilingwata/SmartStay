---
phase: 17
reviewers: [codex]
reviewed_at: 2026-04-30T00:00:00+07:00
plans_reviewed:
  - .planning/phases/17-frontend-dashboard-refinement/17-PLAN.md
inputs_reviewed:
  - .planning/phases/17-frontend-dashboard-refinement/17-CONTEXT.md
  - .planning/phases/17-frontend-dashboard-refinement/17-RESEARCH.md
  - .planning/sketches/004-operations-dashboard-modules/SKETCH.md
  - .planning/sketches/004-operations-dashboard-modules/README.md
  - .planning/sketches/MANIFEST.md
mode: codex
---

# Cross-AI Plan Review - Phase 17

## Codex Review

### Summary

Plan phase 17 đạt mục tiêu chính của bước planning: đã chứng minh đọc và dùng `CONTEXT.md`, `RESEARCH.md`, `SKETCH.md`, `README.md`, `MANIFEST.md`; đã chốt hướng Sketch 004 Variant A làm pattern chính; đã bao phủ các lỗi trọng tâm về dư trắng màn lớn, bảng thiếu `min-width`, content/sidebar cần `flex-1 min-w-0`, text tiếng Việt, ngày giờ Việt Nam và verification 8 breakpoint. Không thấy blocker lớn trước khi execute. Rủi ro còn lại chủ yếu là scope quá rộng trong Wave 3 và verification cần cụ thể hóa route/evidence để khi execute không bỏ sót module.

### Strengths

- Plan dùng đầy đủ tài liệu đầu vào: phần "Đầu vào đã dùng" nêu rõ `17-CONTEXT.md`, `17-RESEARCH.md`, Sketch 004, README và MANIFEST; phần quyết định thiết kế chốt rõ Variant A là default, Variant B/C chỉ mượn có điều kiện.
- Lỗi dư trắng màn lớn được xử lý đúng hướng: plan nêu page-level wrapper `max-w-7xl`, `max-w-[1440px]`, `mx-auto` là nguồn rủi ro và Wave 2 yêu cầu gỡ/nới wrapper theo shell `max-w-[1760px]`.
- Layout cạnh sidebar được chốt rõ: container strategy yêu cầu shell/main `flex-1 min-w-0`, page root `min-w-0`, không tự bó page theo container hẹp.
- Bảng được xử lý chặt: table strategy yêu cầu wrapper `overflow-x-auto`, table có `min-width` cụ thể, action cell không co hẹp, min-width theo nhóm `920px`, `1080px`, `1200px`.
- Breakpoint coverage đủ theo yêu cầu: plan có đủ `1920`, `1600`, `1440`, `1366`, `1280`, `1024`, `768`, `390` trong strategy và verification matrix.
- Text strategy đủ mạnh: cấm raw enum/service/Supabase value, yêu cầu tiếng Việt chuẩn, formatter `dd/MM/yyyy`, `dd/MM/yyyy HH:mm`, `formatVND`, và sweep helper/fallback.
- UI complexity được kiểm soát: plan không chọn command center hoặc split workspace làm mặc định; chỉ dùng Variant B cho hub và Variant C cho workflow nhiều bước.

### Concerns

- **MEDIUM - Wave 3 quá rộng để execute an toàn trong một lượt.** Wave 3 gom assets, amenities, tenants, contracts, addendums, utility billing, services, invoices, payments, tickets và shared table contract vào cùng một wave. Điều này đúng về mặt scope nhưng dễ làm executor bỏ sót chi tiết hoặc tạo PR quá lớn. Nên tách checkpoint trong Wave 3 theo nhóm domain hoặc biến thành sub-waves khi execute.

- **MEDIUM - Verification route/evidence chưa đủ cụ thể.** Plan có module verification và 8 breakpoint, nhưng chưa liệt kê URL/route cụ thể cho từng module và chưa yêu cầu ghi evidence dạng bảng pass/fail/screenshot note. Với scope rộng, chỉ nói "mở list/detail/modal" có thể chưa đủ để chống bỏ sót.

- **MEDIUM - `DataTable.tsx` là shared component nhưng blast radius chưa khóa đủ.** Plan đề xuất thêm prop/class cho min-width, nhưng chưa yêu cầu audit tất cả consumers ngoài scope và giữ default behavior tương thích. Nếu sửa shared table trực tiếp, có nguy cơ ảnh hưởng settings/users hoặc màn khác không thuộc phase.

- **LOW - Plan chặt về "không hiện raw value", nhưng nên thêm danh sách raw tokens bắt buộc grep sau execute.** Hiện plan nêu ví dụ `pending_payment`, `policy`, raw status/category/type. Nên bổ sung grep list cụ thể hơn cho execute summary: `pending_payment`, `partially_paid`, `in_progress`, `billing_runs`, `utility_policy`, `room_asset_auto`, `AssetAssignment`, `RoomAssetAuto`, `RentChange`.

- **LOW - Typography/visual simplification đúng hướng nhưng chưa đặt ngưỡng đủ cụ thể cho execute.** Plan nói giảm radius về `8px-16px`, tránh hero-scale, tránh shadow/gradient lớn. Nên yêu cầu executor không thay toàn bộ design system, chỉ sửa các page trong scope và giữ tone SmartStay hiện tại để tránh polish quá tay.

### Suggestions

- Thêm vào plan hoặc execute instructions một checklist sub-wave cho Wave 3:
  - shared table contract
  - finance + utility
  - contracts + tenants
  - assets + amenities + services + tickets

- Bổ sung verification matrix theo route thực tế, ví dụ mỗi module có hàng: route, view cần mở, breakpoints cần check, result, note.

- Khi sửa `DataTable.tsx`, thêm acceptance: default rendering không đổi nếu consumer không truyền `minWidthClassName`; audit bằng `rg "<DataTable"` trước và sau.

- Bổ sung grep verification bắt buộc cho raw technical tokens từ context/research, không chỉ manual scan.

- Trong execute phase, yêu cầu ghi lại module nào chưa thể verify bằng browser và lý do, thay vì chỉ kết luận chung.

### Risk Assessment

Overall risk: **MEDIUM**.

Lý do: plan đúng hướng và đủ tiêu chuẩn responsive/copy/layout, nhưng phase có scope rất rộng và chạm nhiều shared UI/presentation helpers. Rủi ro không nằm ở thiết kế plan mà ở execution discipline: nếu không có route checklist, sub-wave checkpoint và evidence rõ, rất dễ sửa tốt một vài module nhưng bỏ sót module khác.

## Consensus Summary

Chỉ có một reviewer theo flag `--codex`, nên không có consensus đa reviewer.

### Agreed Strengths

- Plan đã dùng đúng context, research và sketch.
- Container, table, breakpoint, tiếng Việt và action hierarchy đều được chốt rõ.
- Hướng dashboard SaaS production được bảo vệ tốt, không trượt sang landing/marketing.

### Agreed Concerns

- Scope execute rất rộng, cần checkpoint nhỏ hơn.
- Verification cần route/evidence cụ thể hơn để chống bỏ sót.
- Shared `DataTable` cần kiểm soát blast radius.

### Divergent Views

Không có divergent views vì chỉ chạy Codex review.
