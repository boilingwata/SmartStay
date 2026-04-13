## Supabase baseline reset

Repo hien da duoc squash ve mot migration nen duy nhat tai `supabase/migrations/20260407153245_base_app_schema.sql`.

Nguon cua migration nay:

- dump schema remote cua cac schema `public`, `private`, `smartstay`
- bo sung thu cong bucket `smartstay-files` va cac policy tren `storage.objects`

Cac migration cu da duoc chuyen sang:

- `supabase/migrations_archive/pre_baseline_20260407`

Muc tieu:

- `db reset` tren local khong con phu thuoc vao mot schema `smartstay` co san
- repo co mot diem bat dau sach de seed va demo utility billing

Dieu can luu y:

- project remote hien van giu migration history cu
- vi vay `supabase migration list` se cho thay local va remote khong con cung lich su
- dieu nay khong chan viec reset local, nhung ban khong nen push migration moi len remote cu ma chua lam buoc chuan hoa history

Quy trinh nen dung:

1. Chay local reset tren mot moi truong local moi hoac database moi.
2. Kiem tra seed demo bang `supabase/seed.sql`.
3. Neu muon dong bo mot project remote dang chay that voi baseline moi, hay tao project Supabase moi roi apply baseline tu dau, hoac dung quy trinh migration repair co kiem soat.
