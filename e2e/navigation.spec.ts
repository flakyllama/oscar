import { test, expect } from '@playwright/test';

// The ⌥-layer shortcuts (read via e.code) move between the six views.
test('alt-layer shortcuts switch views', async ({ page }) => {
  await page.goto('/?seed');
  await expect(page.getByText('Today', { exact: true })).toBeVisible();

  await page.keyboard.press('Alt+KeyE');
  await expect(page.getByRole('heading', { name: 'Entries' })).toBeVisible();

  await page.keyboard.press('Alt+KeyS');
  await expect(page.getByRole('heading', { name: 'Stats' })).toBeVisible();

  await page.keyboard.press('Alt+KeyM');
  await expect(page.getByRole('heading', { name: 'Milestones' })).toBeVisible();

  await page.keyboard.press('Alt+KeyT');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

  await page.keyboard.press('Alt+KeyW');
  await expect(page.getByText('Today', { exact: true })).toBeVisible();
});

// The floating toolbar navigates too, and ← / → page through days.
test('toolbar navigation and day paging', async ({ page }) => {
  await page.goto('/?seed');
  await page.getByRole('button', { name: 'Entries', exact: false }).click();
  await expect(page.getByRole('heading', { name: 'Entries' })).toBeVisible();

  // Back to Write, then step to the previous (seeded) day.
  await page.keyboard.press('Alt+KeyW');
  await expect(page.getByText('Today', { exact: true })).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByText('Yesterday', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Journal entry')).toHaveValue(/Cut the first two pages/);
});
