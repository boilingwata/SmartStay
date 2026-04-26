import { expect, test } from '@playwright/test';

test.describe('Owner Tickets', () => {
  test('hien bang du lieu ticket tren man owner tickets', async ({ page }) => {
    await page.goto('/owner/tickets', { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: 'Điều phối yêu cầu hỗ trợ' })).toBeVisible();

    await expect
      .poll(async () => page.locator('tbody tr').count(), {
        message: 'Bảng ticket phải có ít nhất một dòng dữ liệu.',
        timeout: 15000,
      })
      .toBeGreaterThan(0);

    await expect(page.locator('thead')).toContainText('Mã ticket');
    await expect(page.locator('thead')).toContainText('Nội dung');
    await expect(page.locator('thead')).toContainText('Trạng thái');
    await expect(page.getByText('Không có ticket phù hợp')).toHaveCount(0);
  });
});
