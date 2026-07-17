import { test, expect } from '@playwright/test';

// Setting a passcode encrypts entries at rest: after a reload the app
// gates behind the lock screen and unlocks with the passcode.
test('passcode locks and unlocks the journal', async ({ page }) => {
  await page.goto('/?seed');

  // Go to Settings and set a passcode.
  await page.keyboard.press('Alt+KeyT');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

  await page.getByLabel('New passcode').fill('open-sesame');
  await page.getByRole('button', { name: 'Set', exact: true }).click();
  await expect(page.getByText(/keep it safe/)).toBeVisible();

  // Reload → the lock gate should appear (entries are encrypted).
  await page.reload();
  const gate = page.getByPlaceholder('Passcode');
  await expect(gate).toBeVisible();
  await expect(page.getByLabel('Journal entry')).toBeHidden();

  // Wrong passcode is rejected.
  await gate.fill('wrong');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.getByText(/Wrong passcode/)).toBeVisible();

  // Correct passcode unlocks and the seeded entry is readable again.
  await page.getByPlaceholder('Passcode').fill('open-sesame');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.getByText('Today', { exact: true })).toBeVisible();

  await page.keyboard.press('ArrowLeft');
  await expect(page.getByLabel('Journal entry')).toHaveValue(/Cut the first two pages/);
});
