# Utility Billing Demo

Bo seed moi chi giu 1 bo du lieu toi gian de demo end-to-end:

- 1 building: `Demo Utility Building`
- 1 room: `D-2000`
- 1 tenant: `Khach Demo Utility 2000`
- 1 contract active: `DEMO-UTILITY-2000`
- 1 service co dinh: `Internet Demo 500`
- 1 utility policy system: `DEMO-UTILITY-SYSTEM`
- 1 utility override cho ky `2026-04`

Muc tieu demo:

- Tien phong: `500`
- Internet: `500`
- Tien dien: `500`
- Tien nuoc: `500`
- Tong hoa don: `2.000 VND`

## Reset seed

Chay lai local database de xoa seed cu va nap bo demo moi:

```bash
supabase db reset
```

Repo da duoc cau hinh de chi dung `supabase/seed.sql`.

## Quy trinh demo chuan

1. Mo trang admin va kiem tra contract `DEMO-UTILITY-2000`.
2. Mo tao hoa don utility thu cong.
3. Chon:
   - Contract: `DEMO-UTILITY-2000`
   - Billing period: `2026-04`
   - Due date: `2026-04-15`
4. Preview hoa don.
5. Ket qua mong doi:
   - `Tien thue thang 2026-04 = 500`
   - `Internet Demo 500 thang 2026-04 = 500`
   - `Tien dien thang 2026-04 = 500`
   - `Tien nuoc thang 2026-04 = 500`
   - `Tong = 2.000`
6. Bam tao hoa don.
7. Mo contract detail va invoice detail de xem:
   - contract van active
   - invoice da duoc tao
   - invoice_items du 4 dong
   - invoice_utility_snapshots co snapshot cong thuc utility

## Logic tinh tien

Cong thuc seed demo dang la:

- Tong hoa don = `monthly_rent`
  + tong `contract_services.fixed_price * quantity`
  + `electric_final_amount`
  + `water_final_amount`

Voi demo nay:

- `contracts.monthly_rent = 500`
- `contract_services.fixed_price = 500`
- `invoice_utility_overrides.electric_final_override = 500`
- `invoice_utility_overrides.water_final_override = 500`

## Cach tu doi de tu test

Neu ban muon tu doi tong hoa don, sua 4 diem sau trong seed:

1. `smartstay.contracts.monthly_rent`
2. `smartstay.contract_services.fixed_price`
3. `smartstay.invoice_utility_overrides.electric_final_override`
4. `smartstay.invoice_utility_overrides.water_final_override`

Cong 4 so nay lai se ra tong invoice.

Neu ban muon bo override va de he thong tu tinh utility theo policy, sua:

1. `smartstay.utility_policies.electric_base_amount`
2. `smartstay.utility_policies.water_base_amount`
3. `smartstay.utility_policies.water_per_person_amount`
4. `smartstay.utility_policies.min_electric_floor`
5. `smartstay.utility_policies.min_water_floor`
6. `smartstay.utility_policy_device_adjustments`
7. `contracts.terms -> occupants_for_billing`
8. `rooms.amenities`

## Luu y

- Bang `meter_readings` van con trong schema cu, nhung luong utility moi hien tai khong con phu thuoc vao bang nay.
- Migration `20260407201500_cleanup_legacy_demo_seed_data.sql` dung de don cac invoice demo 2.000 VND cu dang ton tai trong DB tu truoc.
