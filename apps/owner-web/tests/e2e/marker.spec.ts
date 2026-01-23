import { test, expect } from '@playwright/test';

test('owner flow: temp unlock then final unlock', async ({ page, request }) => {
  const code = 'ABC123';
  await page.goto(`/markers/${code}`);

  // initial page should show unlock button
  await expect(page.locator('button', { hasText: '解除（仮）' })).toBeVisible();

  // click temporary unlock
  await page.click('button:has-text("解除（仮）")');
  await expect(page.locator('text=仮解除しました')).toBeVisible();

  // force eligible in test store
  const setRes = await request.post(
    `/api/owner/markers/${code}/__test__/set-eligible-past`
  );
  expect(setRes.ok()).toBeTruthy();

  // perform final unlock
  await page.click('button:has-text("本解除を実行")');
  await expect(page.locator('text=本解除が完了しました')).toBeVisible();

  // status should be resolved on page
  await page.reload();
  await expect(page.locator('text=resolved')).toBeVisible();
});
