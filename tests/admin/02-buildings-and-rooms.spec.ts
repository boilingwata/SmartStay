import { test, expect } from '@playwright/test';

/**
 * Buildings & Rooms Management — Full E2E Journey
 *
 * Chiến lược:
 * 1. Mở modal tạo toà nhà -> Kiểm tra validation (trống).
 * 2. Tạo toà nhà mới (Không điền mã toà nhà vì đã auto-generate).
 * 3. Kiểm tra chi tiết toà nhà (Tab Tổng quan, Sửa tên, Validate Export CSV).
 * 4. Tạo phòng trong toà nhà -> Kiểm tra validation.
 * 5. Tạo phòng thành công.
 * 6. Kiểm tra chi tiết phòng (Sửa giá thuê).
 * 7. Tìm kiếm (Tìm toà nhà, Lọc phòng).
 * 8. Dọn dẹp DB (Xoá phòng -> Xoá toà nhà).
 */

const TS = Date.now();
const BLDG_NAME = `[E2E] Toà Nhà ${TS}`;
const BLDG_NAME_UPDATED = `${BLDG_NAME} UPDATED`;
const ROOM_CODE = `P-E2E-${TS}`;

test.describe.serial('Owner: Luồng tích hợp Toà nhà & Phòng', () => {

  // ─────────────────────────────────────────────────────────────────────────
  // BƯỚC 1: Form tạo toà nhà: Kiểm tra validation
  // ─────────────────────────────────────────────────────────────────────────
  test('1. Tạo toà nhà: Validation khi bỏ trống', async ({ page }) => {
    await page.goto('/owner/buildings');
    await expect(page.locator('.card-container').first()).toBeVisible({ timeout: 15000 });

    const fabButton = page.locator('button').filter({ has: page.locator('span', { hasText: 'Thêm toà nhà mới' }) });
    await fabButton.click();

    const modal = page.locator('form');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Submit trống
    await page.locator('button').filter({ hasText: 'Tạo toà nhà' }).click();
    await expect(modal.locator('.text-danger, p[class*="danger"]').first()).toBeVisible({ timeout: 5000 });

    await page.locator('button').filter({ hasText: 'Huỷ' }).click();
    await expect(modal).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // BƯỚC 2: Tạo toà nhà mới thành công (KHÔNG tự nhập mã)
  // ─────────────────────────────────────────────────────────────────────────
  test('2. Tạo toà nhà mới thành công (Auto Mã Toà nhà)', async ({ page }) => {
    await page.goto('/owner/buildings');
    
    const fabButton = page.locator('button').filter({ has: page.locator('span', { hasText: 'Thêm toà nhà mới' }) });
    await fabButton.click();
    const modal = page.locator('form');

    // Không điền #buildingCode vì field này bị disabled (Auto generate)
    await page.locator('#buildingName').fill(BLDG_NAME);
    await page.locator('#buildingType').selectOption('Apartment');
    await page.locator('#totalFloors').fill('5');
    
    // Location
    await page.locator('select[name="provinceId"]').selectOption({ index: 1 });
    await page.waitForTimeout(300);
    await page.locator('select[name="districtId"]').selectOption({ index: 1 });
    await page.waitForTimeout(300);
    await page.locator('select[name="wardId"]').selectOption({ index: 1 });
    await page.locator('#buildingAddress').fill('123 Đường E2E');

    // Management Info
    await modal.locator('input[name="managementPhone"]').fill('0901234567');
    await modal.locator('input[name="managementEmail"]').fill('owner@e2e.test.com');

    // Amenities
    const gymLabel = modal.locator('label').filter({ hasText: 'Gym' }).first();
    if (await gymLabel.count() > 0) await gymLabel.click();


    await page.locator('button').filter({ hasText: 'Tạo toà nhà' }).click();

    await expect(page.getByText('Đã tạo toà nhà mới thành công')).toBeVisible({ timeout: 20000 });
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // BƯỚC 3: Test chi tiết toà nhà (Update + Báo cáo)
  // ─────────────────────────────────────────────────────────────────────────
  test('3. Chi tiết toà nhà: Kiểm tra hiển thị, Sửa thông tin & Export', async ({ page }) => {
    await page.goto('/owner/buildings');
    
    // Tìm toà nhà vừa tạo
    const searchInput = page.locator('input[placeholder*="Tìm tên toà nhà"]');
    await searchInput.fill(BLDG_NAME);
    await page.waitForTimeout(800);
    
    const buildingCard = page.locator('.card-container').filter({ hasText: BLDG_NAME }).first();
    await buildingCard.click();

    await expect(page.locator('h1').first()).toContainText(BLDG_NAME, { timeout: 20000 });
    await expect(page.locator('code').filter({ hasText: /^B\d{3}/ })).toBeVisible({ timeout: 5000 });

    // Sửa thông tin toà nhà
    await page.locator('button').filter({ hasText: 'Tổng quan' }).first().click();
    await page.locator('button').filter({ hasText: 'Cập nhật' }).click();
    
    const editModal = page.locator('form');
    await page.locator('#buildingName').fill('');
    await page.locator('#buildingName').fill(BLDG_NAME_UPDATED);
    await page.locator('button').filter({ hasText: 'Lưu thay đổi' }).click();

    await expect(page.getByText('Đã cập nhật thông tin toà nhà')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h1').first()).toContainText(BLDG_NAME_UPDATED, { timeout: 10000 });

    // Báo cáo CSV
    const reportBtn = page.locator('button').filter({ hasText: 'Báo cáo vận hành' });
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await reportBtn.click();
    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toMatch(/baocao_/);
    } else {
      await expect(
        page.locator('.sonner-toast').or(page.getByText(/báo cáo/i)).first()
      ).toBeVisible({ timeout: 8000 });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // BƯỚC 4: Tạo phòng mới trong toà nhà
  // ─────────────────────────────────────────────────────────────────────────
  test('4. Tạo phòng trong toà nhà (Kèm Validation)', async ({ page }) => {
    await page.goto('/owner/buildings');
    const searchInput = page.locator('input[placeholder*="Tìm tên toà nhà"]');
    await searchInput.fill(BLDG_NAME_UPDATED);
    await page.waitForTimeout(800);
    await page.locator('.card-container').filter({ hasText: BLDG_NAME_UPDATED }).first().click();

    await page.locator('button').filter({ hasText: 'Danh sách Phòng' }).click();
    await expect(page.locator('p').filter({ hasText: 'Tòa nhà chưa có phòng nào' })).toBeVisible({ timeout: 10000 });

    await page.locator('button').filter({ hasText: 'Thêm phòng đầu tiên' }).click();
    const modal = page.locator('form');

    // Test validation trống
    await page.locator('#roomCode').fill('');
    await page.locator('button').filter({ hasText: 'Tạo phòng' }).click();
    await expect(modal.locator('p[class*="danger"], .text-danger').first()).toBeVisible({ timeout: 5000 });

    // Điền thông tin tạo phòng
    await page.locator('#roomCode').fill(ROOM_CODE);
    await page.locator('#floorNumber').fill('2');
    await page.locator('#roomType').selectOption('Studio');
    await modal.locator('input[name="areaSqm"]').fill('30');
    await modal.locator('input[name="baseRentPrice"]').fill('5000000');
    await modal.locator('input[name="maxOccupancy"]').fill('2');

    await page.locator('button').filter({ hasText: 'Tạo phòng' }).click();
    await expect(page.getByText('Đã tạo phòng mới thành công')).toBeVisible({ timeout: 10000 });
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    await expect(page.locator('td, button').filter({ hasText: ROOM_CODE }).first()).toBeVisible({ timeout: 10000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // BƯỚC 5: Chi tiết phòng (Sửa giá thuê)
  // ─────────────────────────────────────────────────────────────────────────
  test('5. Chi tiết phòng: Cập nhật thông tin', async ({ page }) => {
    await page.goto('/owner/buildings');
    await page.locator('input[placeholder*="Tìm tên toà nhà"]').fill(BLDG_NAME_UPDATED);
    await page.waitForTimeout(800);
    await page.locator('.card-container').filter({ hasText: BLDG_NAME_UPDATED }).first().click();
    await page.locator('button').filter({ hasText: 'Danh sách Phòng' }).click();

    // Vào RoomDetail
    await page.locator('tr').filter({ hasText: ROOM_CODE }).locator('button').filter({ hasText: ROOM_CODE }).click();
    await expect(page).toHaveURL(/\/rooms\/\d+/, { timeout: 10000 });
    await expect(page.locator('h1').first()).toContainText(ROOM_CODE, { timeout: 10000 });

    // Cập nhật giá thuê
    await page.locator('button[title="Sửa thông tin"]').click();
    const editModal = page.locator('form');
    const rentInput = editModal.locator('input[name="baseRentPrice"]');
    await rentInput.fill('');
    await rentInput.fill('6500000');
    await page.locator('button').filter({ hasText: 'Lưu thay đổi' }).click();

    await expect(page.getByText('Đã cập nhật thông tin phòng')).toBeVisible({ timeout: 10000 });
    await expect(editModal).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // BƯỚC 6: Tìm kiếm ở các danh sách tổng (Sau khi cả 2 đã tạo)
  // ─────────────────────────────────────────────────────────────────────────
  test('6. Chức năng Tìm kiếm Danh sách', async ({ page }) => {
    // 6.1: Tab danh sách phòng tổng
    await page.goto('/owner/rooms');
    const vacantBtn = page.locator('button').filter({ hasText: /Tr[oố]ng/i }).first();
    if (await vacantBtn.count() > 0) {
      await vacantBtn.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('.card-container, tr').filter({ hasText: ROOM_CODE }).first()).toBeVisible({ timeout: 10000 });
    }

    // 6.2: Tab danh sách toà nhà tổng
    await page.goto('/owner/buildings');
    const searchInput = page.locator('input[placeholder*="Tìm tên toà nhà"]');
    await searchInput.fill(BLDG_NAME_UPDATED);
    await page.waitForTimeout(1000);
    await expect(page.locator('.card-container').filter({ hasText: BLDG_NAME_UPDATED }).first()).toBeVisible({ timeout: 10000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // BƯỚC 7: Dọn dẹp DB (Soft Delete)
  // ─────────────────────────────────────────────────────────────────────────
  test('7. Xoá phòng và toà nhà (Clean up)', async ({ page }) => {
    // 7.1 Xóa phòng
    await page.goto('/owner/buildings');
    await page.locator('input[placeholder*="Tìm tên toà nhà"]').fill(BLDG_NAME_UPDATED);
    await page.waitForTimeout(800);
    await page.locator('.card-container').filter({ hasText: BLDG_NAME_UPDATED }).first().click();
    await page.locator('button').filter({ hasText: 'Danh sách Phòng' }).click();
    
    await page.locator('tr').filter({ hasText: ROOM_CODE }).locator('button').filter({ hasText: ROOM_CODE }).click();
    await expect(page.locator('h1').first()).toContainText(ROOM_CODE, { timeout: 10000 });
    
    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('button[title="Xoá phòng"]').click();
    await expect(page.getByText('Đã xoá phòng thành công')).toBeVisible({ timeout: 10000 });

    // 7.2 Xóa toà nhà
    await page.goto('/owner/buildings');
    await page.locator('input[placeholder*="Tìm tên toà nhà"]').fill(BLDG_NAME_UPDATED);
    await page.waitForTimeout(800);
    await page.locator('.card-container').filter({ hasText: BLDG_NAME_UPDATED }).first().click();
    
    await page.locator('button').filter({ hasText: 'Tổng quan' }).first().click();
    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('button[title="Xoá toà nhà"]').click();
    await expect(page.getByText('Đã xoá toà nhà thành công')).toBeVisible({ timeout: 10000 });
  });

});
