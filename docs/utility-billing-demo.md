# SmartStay Utility Billing Demo

Tai lieu nay mo ta bo demo utility hien tai va cach dung no cho test end-to-end.

Luu y lon:

- Day la `demo dataset`
- Day khong phai cau hinh utility that de run billing production
- Policy demo hien tai co amount = `0`, nen utility demo chu yeu di qua override

## 1. Muc tieu demo

Bo seed hien tai giu 1 bo du lieu toi gian de demo utility flow:

- 1 building: `Demo Utility Building`
- 1 room: `D-2000`
- 1 tenant: `Khach Demo Utility 2000`
- 1 contract active: `DEMO-UTILITY-2000`
- 1 fixed service: `Internet Demo 500`
- 1 system utility policy demo: `DEMO-UTILITY-SYSTEM`
- 1 utility override cho ky `2026-04`

Muc tieu demo mong doi:

- tien thue: `500`
- internet: `500`
- tien dien: `500`
- tien nuoc: `500`
- tong invoice: `2.000 VND`

## 2. Reset seed

Neu muon nap lai demo local:

```bash
supabase db reset
```

Repo hien tai da cau hinh de seed bang `supabase/seed.sql`.

## 3. Quy trinh demo chuan

1. Mo admin va kiem tra contract `DEMO-UTILITY-2000`
2. Mo man tao utility invoice thu cong
3. Chon:
   - contract: `DEMO-UTILITY-2000`
   - billing period: `2026-04`
   - due date: `2026-04-15`
4. Preview invoice
5. Ket qua mong doi:
   - `Tien thue thang 2026-04 = 500`
   - `Internet Demo 500 thang 2026-04 = 500`
   - `Tien dien thang 2026-04 = 500`
   - `Tien nuoc thang 2026-04 = 500`
   - `Tong = 2.000`
6. Bam tao invoice
7. Mo contract detail va invoice detail de verify:
   - contract van active
   - invoice duoc tao
   - invoice_items co du 4 dong chinh
   - invoice utility moi co snapshot cong thuc utility

## 4. Logic tinh tien trong demo

Tong invoice demo duoc tao theo cong thuc:

`monthly_rent + fixed_services + electric_final + water_final`

Voi bo demo hien tai:

- `contracts.monthly_rent = 500`
- `contract_services.fixed_price = 500`
- `invoice_utility_overrides.electric_final_override = 500`
- `invoice_utility_overrides.water_final_override = 500`

Can hieu dung:

- policy demo khong tinh utility that
- override dang ep utility ve `500` / `500`

## 5. Cach sua demo de tu test

Neu muon doi tong invoice demo, sua 4 diem sau trong seed:

1. `smartstay.contracts.monthly_rent`
2. `smartstay.contract_services.fixed_price`
3. `smartstay.invoice_utility_overrides.electric_final_override`
4. `smartstay.invoice_utility_overrides.water_final_override`

Cong 4 so nay lai se ra tong invoice.

## 6. Neu muon test utility theo policy that

Neu muon bo override va de system tu tinh utility, can sua:

1. `smartstay.utility_policies.electric_base_amount`
2. `smartstay.utility_policies.water_base_amount`
3. `smartstay.utility_policies.water_per_person_amount`
4. `smartstay.utility_policies.electric_hot_season_multiplier`
5. `smartstay.utility_policies.location_multiplier`
6. `smartstay.utility_policies.season_months`
7. `smartstay.utility_policies.rounding_increment`
8. `smartstay.utility_policies.min_electric_floor`
9. `smartstay.utility_policies.min_water_floor`
10. `smartstay.utility_policy_device_adjustments`
11. `smartstay.contracts.occupants_for_billing`
12. `smartstay.rooms.amenities`

Khong doc `contracts.terms -> occupants_for_billing` nua de coi do la source of truth.
Source of truth hien tai phai la `contracts.occupants_for_billing`.

## 7. Nhung gioi han cua demo hien tai

Demo nay khong chung minh duoc billing production readiness.

Ly do:

- utility policy demo hien tai amount = `0`
- override dang dong vai tro chinh de ep ra ket qua demo
- neu function live `create_policy_utility_invoice` chua fix bug `meter_reading_id` thi create invoice that se fail tren DB live

Vi vay demo chi dung de:

- check UI flow
- check preview payload
- check invoice detail rendering

Khong duoc lay demo nay de ket luan production utility da san sang.
