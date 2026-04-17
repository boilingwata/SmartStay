# Quy trình hợp đồng chuẩn cho SmartStay

## 1. Luồng chuẩn từ lúc khách hỏi thuê đến lúc ở

1. Khách xem phòng hoặc tạo lịch hẹn xem phòng.
2. Nếu đồng ý thuê, tenant chính cung cấp CCCD và thông tin cá nhân.
3. Staff/Owner tạo hoặc cập nhật hồ sơ `tenants`.
4. Ảnh CCCD mặt trước/mặt sau được lưu trong `tenants.documents.cccd_images`.
5. Staff đối chiếu trực tiếp giấy tờ gốc trước khi tạo hợp đồng.
6. Staff tạo hợp đồng:
   - chọn tòa nhà, phòng
   - chọn `tenant chính`
   - thêm `occupant` nếu có
   - nhập kỳ hạn, giá thuê snapshot, tiền cọc, chu kỳ thanh toán
   - chọn dịch vụ
7. Hệ thống tạo:
   - `contracts`
   - `contract_tenants` chỉ cho tenant chính
   - `room_occupants` cho tenant chính và occupant
   - `contract_services`
   - `tenant_balances` nếu tenant chính chưa có
8. Sau khi hai bên ký tay hoặc ký số, owner/staff nên tải bản scan hợp đồng đã ký lên để tenant xem lại trong portal.

## 2. Phân vai đúng nghiệp vụ

- `tenant chính`: người chịu trách nhiệm pháp lý và tài chính.
- `occupant`: người ở cùng, không tự động có quyền pháp lý như tenant chính.
- Không dùng một hợp đồng đang active để chứa nhiều đời tenant chính.
- Khi tenant chính rời đi:
  - nếu còn occupant đủ điều kiện: tạo hợp đồng mới bằng luồng chuyển giao
  - nếu không còn ai thay thế: thanh lý hợp đồng

## 3. Cách xử lý CCCD an toàn

- Cách an toàn nhất: tenant cung cấp CCCD qua buổi hẹn trực tiếp hoặc portal riêng có phân quyền.
- Chỉ staff/owner có quyền xem đầy đủ dữ liệu CCCD.
- Danh sách tenant nên mask một phần CCCD; chỉ mở khi cần đối chiếu.
- Không gửi CCCD qua chat nhóm hoặc lưu rải rác trong form hợp đồng.
- Hợp đồng chỉ tham chiếu hồ sơ tenant đã xác minh, không nên upload CCCD tách rời ở form tạo hợp đồng.

## 4. Dịch vụ và tiện ích

- Dịch vụ cố định như internet, vệ sinh, gửi xe: snapshot vào `contract_services`.
- Điện nước theo đầu người hoặc policy: tính từ `room_occupants` active.
- Khi thêm hoặc bớt occupant, utility headcount sẽ đổi cho kỳ tiếp theo.

## 5. Gia hạn, thanh lý, chuyển giao

- Gia hạn: lưu renewal/addendum, không sửa mù lịch sử.
- Thanh lý:
  - chốt ngày rời đi
  - chốt utility kỳ cuối
  - bù trừ công nợ bằng tiền cọc
  - hoàn phần còn lại nếu có
- Chuyển giao:
  - hợp đồng cũ terminated
  - hợp đồng mới tạo cho tenant chính mới
  - lịch sử lưu ở `contract_transfers`

## 6. Những gì còn nên làm tiếp

- OCR CCCD:
  - hiện repo mới hỗ trợ upload ảnh và lưu metadata
  - chưa có service OCR tự động
  - nếu muốn OCR chuẩn, nên thêm một service tách riêng để trích xuất rồi cho staff xác nhận lại trước khi lưu
- Hẹn xem nhà / ký:
  - nên có module lịch hẹn hoặc tối thiểu `rental_applications` + ghi chú lịch
- Bản scan hợp đồng:
  - nên lưu file PDF đã ký vào storage và gắn vào `contracts.signed_file_url`
