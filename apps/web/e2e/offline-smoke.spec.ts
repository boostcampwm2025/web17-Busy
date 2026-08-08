import { expect, test } from '@playwright/test';

test('renders the offline page in a browser', async ({ page }) => {
  await page.goto('/offline');

  await expect(page.getByRole('heading', { name: 'Connection lost' })).toBeVisible();
  await expect(page.getByText('VIBR could not reach the network')).toBeVisible();
});
