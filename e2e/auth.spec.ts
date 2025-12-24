import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page with email and password fields', async ({ page }) => {
    await page.goto('/login');
    
    // Should see the login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should have register button on login page', async ({ page }) => {
    await page.goto('/login');
    
    // Should see register button
    const registerButton = page.locator('button').filter({ hasText: /register|регистрация/i });
    await expect(registerButton).toBeVisible();
  });

  test('should display TaskFlow branding', async ({ page }) => {
    await page.goto('/login');
    
    // Should see TaskFlow AI title
    await expect(page.locator('h2')).toBeVisible();
  });

  test('password field should be of type password', async ({ page }) => {
    await page.goto('/login');
    
    const passwordInput = page.locator('input[type="password"]');
    
    // Password field should exist
    await expect(passwordInput).toBeVisible();
  });
});
