import { test, expect } from '@playwright/test';

// These specs exercise the editor on a blank slate, so skip the first-run
// welcome (they model a returning writer who simply has no entry today).
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('daybook.welcomed', '1');
    } catch {
      /* ignore */
    }
  });
});

// Writing an entry persists it to localStorage and survives a reload.
test('typing an entry persists across a reload', async ({ page }) => {
  await page.goto('/'); // start empty (no ?seed)
  const editor = page.getByLabel('Journal entry');
  await editor.click();
  await editor.fill('A quiet first line, then a second.');

  // The word-count chip reflects what we typed (7 words).
  await expect(page.getByLabel('Number of words')).toContainText('7');

  await page.reload();
  await expect(page.getByLabel('Journal entry')).toHaveValue('A quiet first line, then a second.');
});

// The word-count chip tracks the running count as the entry grows.
test('the word-count chip tracks the running count', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByLabel('Journal entry');
  const count = page.getByLabel('Number of words');
  await editor.fill('one two three');
  await expect(count).toContainText('3');
  await editor.fill('one two three four five');
  await expect(count).toContainText('5');
});
