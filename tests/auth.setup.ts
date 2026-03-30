import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_STATE = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate as admin', async ({ page }) => {
  // Go to login page
  await page.goto('/public/login', { waitUntil: 'networkidle', timeout: 30000 });

  // Fill in the login form using credentials found in LoginPage.tsx
  const emailInput = page.getByPlaceholder('admin@smartstay.vn');
  await expect(emailInput).toBeVisible({ timeout: 15000 });
  await emailInput.fill('admin@smartstay.vn');
  
  const passwordInput = page.getByPlaceholder('••••••••');
  await passwordInput.fill('Admin@123456');

  // Click login button
  console.log('Attempting login...');
  await page.getByRole('button', { name: /Đăng nhập ngay/i }).click();

  // Wait for redirect to dashboard with much longer timeout for slow local DB
  await expect(page).toHaveURL(/.*\/admin\/dashboard/, { timeout: 30000 });
  console.log('Login successful, saving session state...');

  // End of authentication
  await page.context().storageState({ path: STORAGE_STATE });
});
