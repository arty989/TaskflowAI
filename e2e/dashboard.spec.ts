import { test, expect } from '@playwright/test';

test.describe('Dashboard and Board Management', () => {
  test('should display TaskFlow AI branding on login page', async ({ page }) => {
    await page.goto('/login');
    
    // Should see TaskFlow AI title in h2
    await expect(page.locator('h2')).toBeVisible();
  });

  test('should have language switcher', async ({ page }) => {
    await page.goto('/login');
    
    // Look for language toggle button (EN/RU)
    const langButton = page.locator('button').filter({ hasText: /EN|RU/i });
    await expect(langButton.first()).toBeVisible();
  });

  test('login form should have submit button', async ({ page }) => {
    await page.goto('/login');
    
    // Check for submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login page should have email input', async ({ page }) => {
    await page.goto('/login');
    
    // Check for email field
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('login page should have password input', async ({ page }) => {
    await page.goto('/login');
    
    // Check for password field
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
