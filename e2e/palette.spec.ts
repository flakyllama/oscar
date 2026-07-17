import { test, expect } from '@playwright/test';

// ⌘K opens the command palette; it exposes proper dialog/listbox roles
// and traps focus in the input.
test('command palette opens with accessible roles', async ({ page }) => {
  await page.goto('/?seed');
  await page.keyboard.press('ControlOrMeta+k');

  const dialog = page.getByRole('dialog', { name: 'Command menu' });
  await expect(dialog).toBeVisible();

  const combobox = dialog.getByRole('combobox');
  await expect(combobox).toBeFocused();
  await expect(dialog.getByRole('listbox')).toBeVisible();
  await expect(dialog.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');

  // Esc closes it.
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

// The palette parses a natural-language date and jumps to that day.
test('palette jumps to a parsed date', async ({ page }) => {
  await page.goto('/?seed');
  await page.keyboard.press('ControlOrMeta+k');
  const combobox = page.getByRole('combobox');
  await combobox.fill('yesterday');

  // The first option is the "Go to …" date jump; run it.
  await page.getByRole('option').first().click();

  await expect(page.getByText('Yesterday', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Journal entry')).toHaveValue(/Cut the first two pages/);
});
