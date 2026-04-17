# Hợp đồng 1 đại diện, nhiều occupant

## Logic chuẩn theo hình

- Mỗi hợp đồng chỉ có 1 `tenant chính` là người đại diện ký hợp đồng.
- Các `occupant` chỉ ở cùng phòng, không phải người ký hợp đồng.
- `room_occupants` là source of truth cho danh sách người đang ở / đã rời.
- `contract_transfers` lưu lịch sử chuyển hợp đồng khi tenant chính rời đi nhưng còn occupant ở lại.

## 3 tình huống bắt buộc

### 1. Occupant B rời đi

- Chỉ cập nhật `room_occupants.status = 'moved_out'`.
- Hợp đồng hiện tại không đổi.
- Nếu sau khi B rời mà không còn ai ở trong hợp đồng, hệ thống tự thanh lý.

### 2. Tenant chính A rời đi

- Nếu còn occupant ở lại:
  - Kết thúc hợp đồng cũ của A.
  - Tạo hợp đồng mới với B là tenant chính.
  - Carry-over tiền cọc sang hợp đồng mới.
  - Ghi lịch sử vào `contract_transfers`.
- Nếu không còn occupant ở lại:
  - Thanh lý hợp đồng.

### 3. A và B cùng rời đi

- Thanh lý hợp đồng.
- Đóng toàn bộ occupant còn active.
- Trả phòng về `available` nếu không còn hợp đồng active khác.

## Edge cases cần lưu ý

- Nhiều occupant:
  - Khi A rời, chọn 1 occupant nhận chuyển làm tenant chính mới.
  - Các occupant active còn lại được copy sang hợp đồng mới.
- Partial payments / công nợ:
  - Hóa đơn cũ vẫn thuộc hợp đồng cũ.
  - Không nên tự động chuyển công nợ sang hợp đồng mới nếu chưa có rule kế toán rõ ràng.
- Deposit handling:
  - Bản hiện tại triển khai `carry_over` để tránh hoàn cọc rồi thu lại trong cùng thao tác.
  - Nếu muốn refund/collect delta, mở rộng `contract_transfers.deposit_mode`.
- Room overlap:
  - Khi chuyển hợp đồng phải kết thúc hợp đồng cũ trước khi tạo hợp đồng mới, nếu không sẽ đụng exclusion constraint của phòng.
- Tenant portal access:
  - Hàm `private.is_contract_participant` đã được mở rộng để occupant vẫn xem được hợp đồng liên quan.

## Schema đã thêm

- `smartstay.contracts`
  - thêm `primary_tenant_id`
  - thêm `payment_due_day`
  - thêm `linked_contract_id`
  - thêm `terminated_at`
- `smartstay.room_occupants`
- `smartstay.contract_transfers`

SQL đầy đủ nằm ở:

- [20260415080824_contract_representative_occupants_flow.sql](/c:/Users/toduc/Downloads/SmartStay/supabase/migrations/20260415080824_contract_representative_occupants_flow.sql)

## RPC / Supabase queries chính

### Tạo hợp đồng mới

- RPC: `smartstay.create_contract_v2`
- Input chính:
  - `p_primary_tenant_id`
  - `p_occupant_ids`
  - `p_payment_due_day`

### Occupant rời đi

- RPC: `smartstay.remove_contract_occupant`
- Hành vi:
  - remove occupant phụ
  - tự thanh lý nếu không còn occupant active

### Chuyển hợp đồng

- RPC: `smartstay.transfer_contract_representative`
- Hành vi:
  - terminate hợp đồng cũ
  - tạo hợp đồng mới
  - copy occupant còn ở lại
  - ghi `contract_transfers`

### Thanh lý hợp đồng

- RPC: `smartstay.liquidate_contract`
- Hành vi:
  - terminate contract
  - chốt `contract_terminations`
  - đóng occupant
  - cập nhật phòng về `available` nếu phù hợp

## Frontend đã cập nhật

- `ContractDetail`:
  - tab tổng quan
  - tab quản lý occupant
  - tab lịch sử chuyển hợp đồng
  - tab hóa đơn
- `TransferContractModal`
- `LiquidationModal`
- `ContractList` hiển thị số người ở thay vì ngầm hiểu mọi tenant đều là người ký.

## File chính đã sửa

- [contractService.ts](/c:/Users/toduc/Downloads/SmartStay/src/services/contractService.ts)
- [ContractDetail.tsx](/c:/Users/toduc/Downloads/SmartStay/src/views/admin/contracts/ContractDetail.tsx)
- [TransferContractModal.tsx](/c:/Users/toduc/Downloads/SmartStay/src/components/contracts/modals/TransferContractModal.tsx)
- [LiquidationModal.tsx](/c:/Users/toduc/Downloads/SmartStay/src/components/contracts/modals/LiquidationModal.tsx)
- [create-contract edge function](/c:/Users/toduc/Downloads/SmartStay/supabase/functions/create-contract/index.ts)
