# SmartStay Amenity Governance Spec

Tai lieu nay chot logic amenity cho SmartStay va tach han ra khoi utility.

## 1. Phan biet domain

SmartStay co 3 nhom can tach ro:

- `Amenity`: gym, ho boi, BBQ, san the thao, phong sinh hoat chung
- `Utility`: dien, nuoc tinh theo contract + policy + snapshot
- `Service`: internet, gui xe, rac, ve sinh, giat ui va cac phi co dinh

Amenity khong duoc tron voi utility.

## 2. Amenity catalog va governance la 2 lop khac nhau

### 2.1 Catalog

Catalog tra loi cau hoi:

- co amenity nao
- dang mo hay khong
- hien thi ten / mo ta / gia niem yet

Catalog co the map tu danh muc service hien co de hien thi cho tenant.

### 2.2 Governance

Governance moi la lop rule thuc te de van hanh amenity.

Bang nghiep vu amenity hien co:

- `amenity_policies`
- `amenity_policy_versions`
- `amenity_policy_notifications`
- `amenity_booking_exceptions`
- `amenity_bookings`
- `amenity_booking_checkins`

## 3. Amenity policy can chot gi

Mot policy amenity can xac dinh ro:

- amenity nao
- ap cho building nao hoac toan he thong
- kieu dat cho: `slot_based`, `capacity_based`, `open_access`
- suc chua toi da moi slot
- so ngay duoc dat truoc
- so gio toi thieu de duoc huy
- co can staff duyet hay khong
- co bat buoc check-in hay khong
- co waitlist hay khong
- co thu phi hay khong

Policy phai la source of truth cho booking rule.

## 4. Versioning rule

Moi lan sua policy amenity phai tao version moi.

Khong duoc ghi de am tham len policy cu.

Moi version can co:

- `status`
- `change_summary`
- snapshot day du cua rule tai thoi diem sua

Luong chuan:

1. Tao draft
2. Gui cho duyet
3. Owner duyet
4. Gui thong bao
5. Version moi moi co hieu luc

## 5. Exception rule

`amenity_booking_exceptions` chi ap cho khoang thoi gian cu the.

Exception dung de:

- dong amenity de bao tri
- khoa mot so khung gio
- tang / giam suc chua tam thoi
- doi gia tam thoi
- doi rule tam thoi

Exception khong duoc sua policy goc.

## 6. Booking va check-in flow

### 6.1 Booking

`amenity_bookings` can luu:

- ai dat
- amenity nao
- building nao
- ngay nao
- khung gio nao
- so luong nguoi
- trang thai booking
- policy version da duoc resolve

### 6.2 Check-in

`amenity_booking_checkins` can luu:

- ai check-in
- luc nao check-in
- luc nao check-out
- `no_show` hay `completed`
- staff nao xu ly

## 7. Thu tu resolve khi tenant dat amenity

1. Lay amenity catalog
2. Resolve policy amenity dang hieu luc theo amenity + building
3. Check exception trong khung thoi gian do
4. Check suc chua / slot hien tai
5. Neu hop le thi tao booking
6. Neu policy yeu cau thi cho staff duyet
7. Staff check-in / check-out theo flow van hanh

## 8. Nhung thu khong thuoc amenity

Nhung cai sau day khong duoc dat vao amenity domain:

- `utility.meter_reading_day`
- `billing.invoice_issue_day`
- `billing.max_overdue_days`
- `contract.deposit_per_person`
- bat ky cong thuc utility billing nao

Nhung setting nay phai nam trong `system_settings` hoac domain tuong ung.

## 9. Nguyen tac audit

Amenity governance phai audit duoc:

- policy nao co hieu luc tai thoi diem booking
- version nao da duoc ap
- exception nao da anh huong den booking
- ai duyet
- ai check-in
- ai check-out

Neu khong audit duoc 5 diem tren thi amenity governance chua dat chuan.

## 10. Ket luan

Thiet ke dung cho SmartStay la:

- tenant co the thay amenity catalog o UI
- owner/admin co lop policy governance rieng
- booking, approval, notification, exception, check-in, check-out deu audit duoc
- utility va amenity tach han domain, khong dung chung logic
