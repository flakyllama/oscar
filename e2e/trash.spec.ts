import { test, expect } from '@playwright/test';

// These specs start on an empty editor, so skip the first-run welcome
// (they model a returning writer who simply has no entry today).
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('daybook.welcomed', '1');
    } catch {
      /* ignore */
    }
  });
});

// Clearing a day is a soft delete: it leaves the editor, lands in the
// Settings trash, and can be restored intact.
test('clear a day from the palette, then restore it from Settings', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByLabel('Journal entry');
  await editor.fill('Something I will clear and then want back.');

  // The clear action only appears when there is something to clear.
  await page.keyboard.press('ControlOrMeta+k');
  const clear = page.getByRole('option', { name: /Clear this day/ });
  await expect(clear).toBeVisible();
  await clear.click();

  // Editor empties and the app says where the text went.
  await expect(editor).toHaveValue('');
  await expect(page.getByRole('status')).toContainText('restore it from Settings');

  // The cleared day is listed in the trash.
  await page.keyboard.press('Alt+KeyT');
  await expect(page.getByText(/1 page in the trash/)).toBeVisible();
  await expect(page.getByText('Something I will clear and then want back.')).toBeVisible();

  // Restoring puts the text back on the day it came from. (Scope to the
  // trash row's per-day button — the Backup card also has a "Restore".)
  await page.getByRole('button', { name: /Restore \d{4}-\d{2}-\d{2}/ }).click();
  await expect(page.getByText(/Cleared pages land here/)).toBeVisible(); // trash now empty
  await page.keyboard.press('Alt+KeyW');
  await expect(page.getByLabel('Journal entry')).toHaveValue('Something I will clear and then want back.');
});

// Permanent delete removes it from the trash for good.
test('delete a trashed day permanently', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Journal entry').fill('Gone for good.');

  await page.keyboard.press('ControlOrMeta+k');
  await page.getByRole('option', { name: /Clear this day/ }).click();

  await page.keyboard.press('Alt+KeyT');
  await expect(page.getByText(/1 page in the trash/)).toBeVisible();

  await page.getByRole('button', { name: /forever/ }).click();
  await expect(page.getByText(/Cleared pages land here/)).toBeVisible();
  await expect(page.getByText('Gone for good.')).toBeHidden();
});

// The clear action is hidden when the day is already empty.
test('no clear action on an empty day', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('ControlOrMeta+k');
  await expect(page.getByRole('option', { name: /Go to today/ })).toBeVisible();
  await expect(page.getByRole('option', { name: /Clear this day/ })).toHaveCount(0);
});
