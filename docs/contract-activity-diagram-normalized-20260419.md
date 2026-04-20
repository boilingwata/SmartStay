# SmartStay Contract Activity Diagram Normalization

Tài liệu này là bản chuẩn hóa override cho nhóm flow:
- AD-19 Tạo hợp đồng
- AD-20 Thêm occupant vào hợp đồng
- AD-21 Xóa occupant khỏi hợp đồng
- AD-22 Chuyển người đại diện hợp đồng
- AD-23 Thanh lý hợp đồng
- AD-24 Tạo phụ lục hợp đồng thủ công
- AD-25 Tạo phụ lục hợp đồng tự động từ room asset

## AD-19 Tạo hợp đồng

Actor:
- Workspace Owner/Admin
- Staff
- System

Luồng chuẩn:
1. Người quản lý mở `CreateContractWizard`.
2. Chọn phòng, người đại diện, danh sách occupant, thời hạn, giá thuê, tiền cọc, kỳ thanh toán, ngày đến hạn, chính sách điện nước, dịch vụ.
3. UI kiểm tra dữ liệu bắt buộc và chồng lấn hợp đồng theo `room_id + khoảng ngày`.
4. UI gọi `contractService.createContract`.
5. Hệ thống gọi Edge Function `create-contract` hoặc RPC `create_contract_v3`.
6. RPC kiểm tra phòng hợp lệ, người đại diện hợp lệ, hợp đồng không chồng lấn, occupant không vượt sức chứa và occupant bổ sung không active ở hợp đồng khác.
7. Hệ thống tạo `contracts`, `contract_tenants`, `room_occupants`, `contract_services`, `tenant_balances`, cập nhật `rooms.status='occupied'`, ghi `audit_logs`.
8. UI điều hướng sang contract detail.

Ghi chú:
- Tenant không phải actor của flow này.
- Hợp đồng bắt buộc có trạng thái, người đại diện và danh sách occupant.

## AD-20 Thêm occupant vào hợp đồng

Actor:
- Workspace Owner/Admin
- Staff
- System

Luồng chuẩn:
1. Mở `AddOccupantModal`.
2. Nhập `tenantId`, `moveInDate`, `relationshipToPrimary`, `note`.
3. UI gọi `contractService.addOccupant`.
4. RPC `add_contract_occupant` kiểm tra hợp đồng đang `active|pending_signature`, tenant không phải người đại diện, không trùng occupant active, không active ở hợp đồng khác, ngày vào ở hợp lệ và không vượt `rooms.max_occupants`.
5. Hệ thống `INSERT room_occupants`, cập nhật `occupants_for_billing`, ghi `audit_logs`.

Ghi chú:
- Không dùng `upsert` vì sẽ làm sai lịch sử occupant.

## AD-21 Xóa occupant khỏi hợp đồng

Actor:
- Workspace Owner/Admin
- Staff
- System

Luồng chuẩn:
1. Chọn occupant cần ghi nhận rời phòng.
2. Nhập `moveOutDate`, `note`.
3. UI gọi `contractService.removeOccupant`.
4. RPC `remove_contract_occupant` kiểm tra occupant đang active và không phải người đại diện.
5. Hệ thống cập nhật `room_occupants.status='moved_out'`, `move_out_at`, `note`.
6. Hệ thống cập nhật lại `occupants_for_billing` và ghi `audit_logs`.

Ghi chú:
- Flow này không tự động thanh lý hợp đồng.
- Nếu người đại diện rời đi, phải dùng AD-22 hoặc AD-23.

## AD-22 Chuyển người đại diện hợp đồng

Actor:
- Workspace Owner/Admin
- Staff
- System

Luồng chuẩn:
1. Mở `TransferContractModal`.
2. Chọn `toTenantId`, `transferDate`, `note`.
3. UI gọi `contractService.transferContract`.
4. RPC `transfer_contract_representative` kiểm tra người nhận chuyển là occupant active và khác người đại diện cũ.
5. Hệ thống chấm dứt hợp đồng cũ, tạo hợp đồng mới, sao chép term cần thiết, tạo `contract_transfers`, cập nhật `linked_contract_id`, ghi `contract_terminations` và `audit_logs`.

Ghi chú:
- Đây là flow tạo hợp đồng mới, không đổi người đại diện trên cùng bản ghi.

## AD-23 Thanh lý hợp đồng

Actor:
- Workspace Owner/Admin
- Staff
- System

Luồng chuẩn:
1. Mở `LiquidationModal`.
2. Nhập `terminationDate`, `reason`, `depositUsed`, `additionalCharges`.
3. UI gọi `contractService.liquidateContract`.
4. RPC `liquidate_contract` kiểm tra không còn hóa đơn chưa thanh toán.
5. Hệ thống move out occupant active, cập nhật `contracts.status='terminated'`, upsert `contract_terminations`, cập nhật `rooms.status='available'` nếu phù hợp và ghi `audit_logs`.

## AD-24 Tạo phụ lục hợp đồng thủ công

Actor:
- Workspace Owner/Admin
- Staff
- System

Luồng chuẩn:
1. Mở `CreateAddendumModal`.
2. Nhập loại phụ lục, tiêu đề, nội dung, ngày hiệu lực, trạng thái, file đính kèm nếu có.
3. UI upload file qua `portalAddendumService.uploadAddendumFile`.
4. UI gọi `portalAddendumService.createAddendum`.
5. Service gọi RPC `create_contract_addendum`.
6. RPC kiểm tra hợp đồng tồn tại, dữ liệu hợp lệ, tạo `contract_addendums` với `source_type='manual'`, tính `version_no`, gắn `parent_addendum_id` khi cần, ghi `audit_logs`.

## AD-25 Tạo phụ lục hợp đồng tự động từ room asset

Actor:
- Workspace Owner/Admin
- Staff
- System

Luồng chuẩn:
1. Người dùng thêm hoặc sửa `room_assets` theo hướng làm thay đổi billing.
2. Trigger `trg_room_assets_create_addendum` gọi `create_room_asset_contract_addendum()`.
3. Function tìm hợp đồng `active|pending_signature` phù hợp.
4. Function xác định loại thay đổi `asset_assignment | asset_repricing | asset_status_change`.
5. Function gọi `create_contract_addendum` với `source_type='room_asset_auto'`.
6. Hệ thống chống trùng theo `room_asset_id + addendum_type + effective_date`, tự quản version và ghi audit.
