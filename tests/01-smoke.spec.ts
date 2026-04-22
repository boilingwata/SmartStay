import { test, expect } from '@playwright/test';

/**
 * SMOKE TEST: Kiểm tra các luồng quan trọng nhất một cách nhanh chóng.
 * Mục tiêu: Đảm bảo các trang chính vẫn tải được và dữ liệu lõi hiển thị.
 */

test.describe.serial('SmartStay Smoke Tests', () => {

  test('Critical Path: Dashboard & Navigation', async ({ page }) => {
    // 1. Dashboard
    await page.goto('/owner/dashboard');
    await expect(page).toHaveURL(/.*\/owner\/dashboard/);
    await expect(page.getByText(/Tổng quan/i).first()).toBeVisible({ timeout: 10000 });
    console.log('✓ Dashboard loaded');

    // 2. Building List
    await page.goto('/owner/buildings');
    await expect(page.locator('.card-container').first()).toBeVisible({ timeout: 15000 });
    const buildingCount = await page.locator('.card-container').count();
    console.log(`✓ Buildings loaded (${buildingCount} found)`);

    // 3. Room List
    await page.goto('/owner/rooms');
    await expect(page.locator('.card-container').first()).toBeVisible({ timeout: 15000 });
    const roomCount = await page.locator('.card-container').count();
    console.log(`✓ Rooms loaded (${roomCount} found)`);
  });

  test('UI Interaction: Modals rendering', async ({ page }) => {
    await page.goto('/owner/buildings');
    
    // Mở modal thêm toà nhà
    await page.locator('button').filter({ hasText: 'Thêm toà nhà mới' }).click();
    const modal = page.locator('form');
    await expect(modal).toBeVisible({ timeout: 10000 });
    
    // Đóng modal (click ra ngoài hoặc nút huỷ nếu có)
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
    console.log('✓ Create Modal opens/closes correctly');
  });

  test('Data Integrity: Detail Page deep link', async ({ page }) => {
    await page.goto('/owner/buildings');
    const firstBuilding = page.locator('.card-container').first();
    const href = await firstBuilding.getAttribute('href');
    
    if (href) {
      await page.goto(href);
      await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 15000 });
      console.log(`✓ Detail page loaded: ${href}`);
    } else {
      console.log('! No building found to test detail page.');
    }
  });

});
