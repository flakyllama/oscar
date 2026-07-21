import { test, expect } from '@playwright/test';

// First-run onboarding: a brand-new visitor meets Oscar, names themselves,
// and is handed off into the editor. The hand-off animation runs a while,
// so this test is given extra room.
test('first run shows the welcome, then hands off to the editor', async ({ page }) => {
  test.setTimeout(40_000);
  await page.goto('/'); // empty, no welcomed flag → first run

  await expect(page.getByText(/Meet your writing companion/)).toBeVisible();

  await page.getByLabel('Your name').fill('Sara');
  await page.getByRole('button', { name: 'Start writing' }).click();

  // The welcome is marked seen the instant the hand-off begins.
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('daybook.welcomed')))
    .toBe('1');

  // The hand-off finishes in the editor, focused and ready to type; the
  // name was captured on the way.
  const editor = page.getByLabel('Journal entry');
  await expect(editor).toBeVisible({ timeout: 25_000 });
  await expect(editor).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem('daybook.name'))).toBe('Sara');
});

// A returning writer (already welcomed) goes straight to the editor.
test('a returning writer skips the welcome', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('daybook.welcomed', '1'));
  await page.goto('/');

  await expect(page.getByLabel('Journal entry')).toBeVisible();
  await expect(page.getByText(/Meet your writing companion/)).toHaveCount(0);
});
