# SmartStay Utility, Contract, Billing Run, Snapshot, Amenity Standard

Tai lieu nay chot lai logic chuan cho SmartStay sau khi bo utility legacy kieu `meter_readings` / `per_unit` trong `contract_services`.

Tai lieu duoc chia thanh 2 lop:

- `Target standard`: logic nghiep vu dung ve lau dai
- `Current reality`: nhung diem DB / function live hien tai con lech va can xu ly

Muc tieu la de team khong tron lan:

- cai gi la chuan can giu
- cai gi dang ton tai tam thoi
- cai gi la blocker truoc khi run billing that

## 1. Boundary domain

SmartStay tach ro 3 domain:

- `Contract`: diem neo phap ly, xac dinh phong, tenant, thoi gian o, va du lieu dau vao billing
- `Utility`: tinh tien dien nuoc theo policy / override, tao invoice utility, va dong bang bang snapshot
- `Amenity`: policy tien ich dat cho, booking, exception, check-in, check-out

Khong duoc tron 3 domain nay voi nhau.

Quy tac boundary:

- `Contract` khong chua cong thuc utility
- `Utility` khong doc logic booking amenity
- `Amenity` khong chen vao utility formula
- `contract_services` chi chua dich vu co dinh, khong chua utility legacy

## 2. Contract la diem bat dau

Moi luong utility billing deu bat dau tu `smartstay.contracts`.

### 2.1 Truong du lieu bat buoc

Contract can co toi thieu:

- `id`
- `contract_code`
- `room_id`
- `start_date`
- `end_date`
- `status`
- `occupants_for_billing`
- `utility_billing_type`
- `utility_policy_id` neu muon pin rieng 1 policy cho contract

### 2.2 Dieu kien contract hop le de tinh utility

Mot contract chi duoc vao utility billing khi:

1. `status = 'active'`
2. `is_deleted = false`
3. contract giao nhau voi ky billing
4. `utility_billing_type = 'policy'`
5. `occupants_for_billing > 0`

Neu thieu 1 trong cac dieu kien tren thi contract phai bi skip, khong duoc lam crash ca billing run.

### 2.3 Quy tac voi `contract_services`

`contract_services` chi duoc chua dich vu co dinh, vi du:

- internet
- gui xe
- rac
- ve sinh

`contract_services` khong duoc chua:

- electricity
- water
- bat ky service `calc_type = per_unit` dung de mo phong utility kieu cu

Ly do:

- utility phai duoc tinh tu policy / override / snapshot
- neu utility nam trong `contract_services` thi se mat audit trail va de bi double-charge

## 3. Utility policy standard

## 3.1 Utility policy la nguon cau hinh goc

Bang goc la `smartstay.utility_policies`.

Policy hien tai co cac field nghiep vu chinh:

- `scope_type`
- `scope_id`
- `is_active`
- `electric_base_amount`
- `water_base_amount`
- `water_per_person_amount`
- `electric_hot_season_multiplier`
- `location_multiplier`
- `season_months`
- `rounding_increment`
- `min_electric_floor`
- `min_water_floor`
- `effective_from`
- `effective_to`

### 3.2 Scope hierarchy chuan

Enum `utility_policy_scope` da duoc verify trong DB va chi co 4 gia tri:

1. `system`
2. `building`
3. `room`
4. `contract`

Thu tu resolve policy tu uu tien cao xuong thap:

1. `invoice_utility_overrides`
2. `contracts.utility_policy_id` hoac `utility_policies scope_type = 'contract'`
3. `utility_policies scope_type = 'room'`
4. `utility_policies scope_type = 'building'`
5. `utility_policies scope_type = 'system'`

Neu contract co `utility_policy_id` thi coi nhu contract pin truc tiep vao policy do.

### 3.3 Effective date rule

Khi resolve policy cho `billing_period = YYYY-MM`:

- chi lay policy `is_active = true`
- `effective_from <= ngay dau ky billing`
- `effective_to` la null hoac `effective_to >= ngay dau ky billing`

Neu cung mot scope co nhieu policy hop le, lay policy moi nhat theo `effective_from`.

### 3.4 Mua nong va multiplier

Implementation hien tai chi luu:

- `electric_hot_season_multiplier`
- `season_months`

Logic dung trong code:

- neu thang billing nam trong `season_months` thi `electric_season_multiplier = electric_hot_season_multiplier`
- neu khong nam trong `season_months` thi `electric_season_multiplier = 1.0`

Tuc la hien tai khong co field `electric_normal_season_multiplier` trong DB.

Day la logic chuan hien hanh va phai duoc document ro, khong duoc viet mo ho de team hieu nham la DB co 2 field.

## 4. Utility override standard

Bang goc la `smartstay.invoice_utility_overrides`.

Override chi dung de sua utility cho duy nhat 1 contract trong duy nhat 1 ky billing.

Override co the ton tai truoc khi invoice duoc tao, vi `invoice_id` la nullable.

Quy tac chuan:

- key nghiep vu cua override la `(contract_id, billing_period)`
- khong resolve override theo `invoice_id`
- `invoice_id` chi la lien ket audit sau khi invoice da duoc tao
- 1 contract / 1 billing period chi duoc co 1 override

Dieu nay da duoc xac nhan trong schema live bang unique constraint `(contract_id, billing_period)`.

Override khong duoc dung de sua policy goc.

## 5. Cong thuc utility chuan

Cong thuc utility phai tinh tren contract overlap trong billing period.

### 5.1 Proration

Cho `billing_period = YYYY-MM`:

- `days_in_period` = tong so ngay cua thang
- `occupied_days` = so ngay contract overlap voi billing period, tinh inclusive
- `prorate_ratio = occupied_days / days_in_period`

Neu `occupied_days <= 0` thi khong duoc tinh utility.

### 5.2 Device surcharge

Device surcharge duoc resolve tu:

- `rooms.amenities`
- `utility_policy_device_adjustments`

Code hien tai normalize thiet bi ve cac device code nhu:

- `aircon`
- `water_heater`
- `electric_stove`
- `dryer`
- `freezer`

Neu phong co thiet bi nhung policy khong co adjustment tuong ung thi system phai phat warning, khong duoc im lang.

### 5.3 Cong thuc dien

1. `electric_subtotal = electric_base_amount + electric_device_surcharge`
2. `electric_raw_amount = electric_subtotal * electric_season_multiplier * electric_location_multiplier * prorate_ratio`
3. `electric_rounded_amount = round(electric_raw_amount, rounding_increment)`
4. `electric_final_amount = max(electric_rounded_amount, min_electric_floor)`
5. Neu co `electric_final_override` thi gia tri override thay the ket qua sau floor

### 5.4 Cong thuc nuoc

1. `water_person_charge = water_per_person_amount * occupants_for_billing`
2. `water_subtotal = water_base_amount + water_person_charge`
3. `water_raw_amount = water_subtotal * water_location_multiplier * prorate_ratio`
4. `water_rounded_amount = round(water_raw_amount, rounding_increment)`
5. `water_final_amount = max(water_rounded_amount, min_water_floor)`
6. Neu co `water_final_override` thi gia tri override thay the ket qua sau floor

### 5.5 Cong thuc phai doc occupants tu dau

Thu tu resolve `occupants_for_billing`:

1. `invoice_utility_overrides.occupants_for_billing_override` neu co
2. `contracts.occupants_for_billing`

Neu gia tri cuoi cung `<= 0` thi khong duoc tao invoice utility.

## 6. Invoice payload standard

Khi tao utility invoice, payload phai gom:

- monthly rent neu contract co `monthly_rent > 0`
- tat ca `contract_services` hop le va khong phai utility legacy
- 1 dong tien dien
- 1 dong tien nuoc
- dong discount neu nguoi dung chon giam tru

Utility khong duoc lay tu `contract_services`.

### 6.1 Invoice items hien tai

Bang live `smartstay.invoice_items` hien tai chi co:

- `id`
- `invoice_id`
- `description`
- `quantity`
- `unit_price`
- `line_total`
- `sort_order`
- `created_at`

Bang live khong con `meter_reading_id`.

Vi vay moi logic / function tao invoice utility deu phai tuan theo schema nay.

## 7. Invoice snapshot standard

Bang goc la `smartstay.invoice_utility_snapshots`.

Snapshot la bat buoc, immutable, va la nguon audit duy nhat sau khi invoice da tao.

### 7.1 Muc tieu

Snapshot phai dam bao:

- invoice thang cu khong doi khi policy thang sau thay doi
- invoice detail co the hien cong thuc dung tai thoi diem tao
- support audit vi sao ra so tien cu the
- support reporting / dispute resolution

### 7.2 Du lieu bat buoc trong snapshot

Snapshot phai chua toi thieu:

- `invoice_id`
- `contract_id`
- `room_id`
- `billing_run_id`
- `override_id`
- `resolved_policy_id`
- `billing_period`
- `period_start`
- `period_end`
- `policy_source_type`
- `occupants_for_billing`
- `occupied_days`
- `days_in_period`
- `prorate_ratio`
- `electric_base_amount`
- `electric_device_surcharge`
- `electric_subtotal`
- `electric_season_multiplier`
- `electric_location_multiplier`
- `electric_raw_amount`
- `electric_rounded_amount`
- `min_electric_floor`
- `electric_final_amount`
- `water_base_amount`
- `water_per_person_amount`
- `water_person_charge`
- `water_subtotal`
- `water_location_multiplier`
- `water_raw_amount`
- `water_rounded_amount`
- `min_water_floor`
- `water_final_amount`
- `rounding_increment`
- `resolved_device_surcharges_json`
- `warnings_json`
- `formula_snapshot_json`

### 7.3 Quy tac bat buoc

1. Snapshot insert that bai thi invoice creation phai rollback toan bo
2. Khong duoc sua snapshot sau khi invoice da tao
3. Sau khi invoice da tao, UI detail phai doc tu snapshot, khong duoc resolve policy nguoc lai

`policy_source_type` hop le gom:

- `invoice_override`
- `contract`
- `room`
- `building`
- `system`

## 8. Billing run standard

Bang goc la `smartstay.billing_runs`.

Muc dich:

- giu 1 row canonical cho 1 ky billing
- preview dry-run
- log summary / failures
- tranh race condition khi nhieu admin thao tac

Enum `billing_run_status` da duoc verify trong DB:

- `draft`
- `running`
- `completed`
- `failed`
- `cancelled`

Bang co `lock_version` de phuc vu optimistic concurrency.

### 8.1 Billing period mac dinh

Edge function `run-utility-billing` hien tai mac dinh:

- timezone: `Asia/Saigon`
- neu cron chay ngay dau thang, system se tao billing cho thang truoc

Vi du:

- neu cron chay ngay `2026-05-01` theo `Asia/Saigon`
- billing period mac dinh se la `2026-04`

### 8.2 Thu tu billing run chuan

1. Xac dinh `billing_period`
2. Xac dinh `due_date`
3. Lay contracts active giao nhau voi billing period
4. Validate contract
5. Tach contract khong hop le thanh danh sach skip
6. Kiem tra invoice da ton tai cho `(contract_id, billing_period)` va bo qua neu trung
7. Voi moi contract hop le:
   - resolve policy
   - resolve override
   - tinh utility snapshot
   - build invoice payload
   - goi RPC `create_policy_utility_invoice`
8. Cap nhat `billing_runs.status`
9. Ghi `summary_json`
10. Ghi `error_json` neu co contract fail

### 8.3 Dry run standard

Dry run chi duoc preview:

- tong so contracts giao ky
- so contracts `policy`
- danh sach contract bi skip
- danh sach contract da co invoice
- danh sach contract co the tao

Dry run tuyet doi khong duoc tao invoice that va khong duoc tao snapshot that.

## 9. RPC va transaction standard

RPC `smartstay.create_policy_utility_invoice` la diem persist invoice utility.

Target standard cua RPC:

1. Validate payload
2. Check duplicate invoice theo `(contract_id, billing_period)`
3. Insert `invoices`
4. Insert `invoice_items`
5. Insert `invoice_utility_snapshots`
6. Return `invoiceId`, `invoiceCode`

Tat ca buoc tren phai nam trong cung 1 transaction.

Neu `invoice_items` fail hoac `snapshot` fail thi invoice phai rollback.

## 10. Amenity standard

Amenity la domain rieng, khong lien quan den utility billing.

Bang amenity hien co:

- `amenity_policies`
- `amenity_policy_versions`
- `amenity_policy_notifications`
- `amenity_booking_exceptions`
- `amenity_bookings`
- `amenity_booking_checkins`

Luong amenity dung:

1. Quan ly policy amenity
2. Tao version moi khi doi rule
3. Ap exception theo khoang thoi gian
4. Resolve policy theo building / amenity
5. Tenant dat booking
6. Staff check-in
7. Staff check-out

Amenity khong duoc:

- doc `meter_readings`
- chen vao utility formula
- chen utility vao `contract_services` roi goi do la amenity

## 11. Mapping vao UI

### 11.1 `/owner/settings/utility-policies`

Noi quan ly utility policy theo 4 scope:

- system
- building
- room
- contract

### 11.2 `/owner/settings/utility-overrides`

Noi tao / sua override theo:

- 1 contract
- 1 billing period

Khong sua policy goc o day.

### 11.3 `/owner/settings/billing-runs`

Noi:

- dry run preview
- run billing that
- xem contract success
- xem contract skipped
- xem contract failed

### 11.4 `/owner/utility-billing`

Day la hub giai thich utility billing.

No khong phai noi giu source of truth.

Source of truth phai nam o:

- utility policy
- utility override
- billing run
- invoice snapshot

### 11.5 `/owner/amenities`

Noi quan ly amenity governance.

### 11.6 `/owner/staff/amenity-checkin`

Noi van hanh booking amenity cho staff.

## 12. Current reality trong DB va code live

Day la phan quan trong nhat de tranh nham lan giua target standard va he thong dang chay.

### 12.1 Nhung diem da dung

- `contracts` da co `occupants_for_billing`, `utility_billing_type`, `utility_policy_id`
- tat ca active contracts hien tai deu `utility_billing_type = 'policy'`
- `contract_services` hien tai khong con gan `Electricity` / `Water`
- enum `utility_policy_scope` dung 4 gia tri `system/building/room/contract`
- enum `billing_run_status` dung 5 gia tri `draft/running/completed/failed/cancelled`
- `invoice_utility_overrides` dung key `(contract_id, billing_period)`
- code utility hien tai da document ro normal season multiplier = `1.0`

### 12.2 Nhung diem dang lech, khong duoc bo qua

1. Con 4 active contracts co `occupants_for_billing = 0`
2. `services` id `1` va `2` (`Electricity`, `Water`) van `is_active = true`
3. DB live hien tai chi co 1 utility policy demo va tat ca amount deu `0`
4. `billing_runs` hien tai chua co row nao
5. `invoice_utility_snapshots` hien tai chua co row nao
6. Co `327` invoices da ton tai nhung `0` snapshot utility
7. Function live `create_policy_utility_invoice` van insert `meter_reading_id` vao `invoice_items`, trong khi bang live khong con cot nay

### 12.3 Y nghia cua cac lech nay

- active contract co `occupants_for_billing = 0` se bi skip khi billing run
- de `Electricity` / `Water` active trong `services` tao rui ro UI gan lai utility legacy vao contract moi
- policy demo amount = 0 nghia la neu fix RPC xong ma run billing that thi utility van ra `0`
- `327` invoices cu khong co snapshot nghia la khong audit duoc cong thuc utility cua du lieu lich su
- bug `meter_reading_id` trong RPC la blocker nghiem trong, vi tao invoice that se fail ngay tai buoc insert `invoice_items`

## 13. Thu tu fix dung nhat

Neu muon dua he thong ve trang thai "chuan va chay duoc", phai di theo thu tu sau:

1. Fix RPC `create_policy_utility_invoice` de bo `meter_reading_id`
2. Tao test xac nhan RPC tao duoc `invoice + invoice_items + snapshot` trong 1 transaction
3. Tat `services.is_active` cho `Electricity` va `Water`
4. Sua 4 contracts dang `occupants_for_billing = 0`
5. Expire contract nao da het han nhung van `status = active`
6. Tao utility policy that thay cho policy demo amount = 0
7. Chay dry run billing
8. Chi khi dry run sach moi duoc chay billing that
9. Sau khi co invoice moi, verify invoice detail doc tu snapshot thay vi recompute

## 14. Definition of done

Chi duoc coi la utility system da chuan khi dong thoi dung tat ca dieu kien sau:

- khong con contract active nao `occupants_for_billing <= 0`
- khong con utility legacy active trong `services`
- co it nhat 1 utility policy that co amount hop le
- dry run tra summary dung va khong co blocker logic
- run billing that tao duoc invoice thanh cong
- moi invoice utility moi deu co dung 1 snapshot
- invoice detail hien utility tu snapshot
- amenity flow van doc lap, khong bi tron vao utility
