import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 720 } });

test('Desktop Audit', async ({ page }) => {
  await page.goto('http://localhost:8080/franchise-manager');
  
  // Check Dashboard
  await expect(page.getByText('Franchise Control Tower')).toBeVisible();
  await page.screenshot({ path: 'screenshots/desktop-dashboard.png' });

  // Check Franchises
  await page.click('text=Franchises');
  await expect(page.getByText('Franchise Network')).toBeVisible();
  await page.click('text=Manage terms');
  await expect(page.getByText('Commercial terms')).toBeVisible();
  await page.click('text=Cancel');
  await page.screenshot({ path: 'screenshots/desktop-franchises.png' });

  // Check a generic page (e.g. Compliance)
  await page.click('text=Compliance');
  await expect(page.getByText('Compliance Monitor')).toBeVisible();
  await page.screenshot({ path: 'screenshots/desktop-compliance.png' });
});

test('Mobile Audit', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:8080/franchise-manager');

  // Check Sidebar Toggle
  await expect(page.locator('aside')).not.toBeVisible();
  await page.click('aria-label=Toggle navigation');
  await expect(page.getByText('Control Tower')).toBeVisible();
  await page.screenshot({ path: 'screenshots/mobile-sidebar.png' });

  // Check Dashboard on mobile
  await page.click('text=Control Tower');
  await expect(page.getByText('Franchise Control Tower')).toBeVisible();
  await page.screenshot({ path: 'screenshots/mobile-dashboard.png' });

  // Check Table on mobile
  await page.click('aria-label=Toggle navigation');
  await page.click('text=Compliance');
  await expect(page.getByText('Compliance Monitor')).toBeVisible();
  await page.screenshot({ path: 'screenshots/mobile-compliance-table.png' });
});
