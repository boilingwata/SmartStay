import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_STATE = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate as owner', async ({ page }) => {
  console.log('Starting authentication setup...');
  
  // Go directly to /login to avoid redirects
  await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Wait for the form to be ready
  // Based on LoginPage.tsx, email input has type="text" and placeholder "name@smartstay.vn"
  const emailInput = page.getByPlaceholder(/smartstay.vn/);
  const passwordInput = page.getByPlaceholder(/\*{4,}/);
  const submitButton = page.locator('button[type="submit"]');

  console.log('Filling login form...');
  await expect(emailInput).toBeVisible({ timeout: 15000 });
  await emailInput.fill('admin@smartstay.vn');
  await passwordInput.fill('Admin@123456');

  console.log('Attempting login...');
  await submitButton.click();

  // Wait for redirect to dashboard
  console.log('Waiting for post-login redirect...');
  // The login page navigates to getAuthenticatedHomePath(user)
  // Owner dashboard is at /owner/dashboard
  await expect(page).toHaveURL(/.*\/owner\/.*/, { timeout: 30000 });
  
  console.log('Login successful, saving session state...');

  // End of authentication
  await page.context().storageState({ path: STORAGE_STATE });
});
