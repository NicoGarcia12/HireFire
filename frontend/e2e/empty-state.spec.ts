import { expect, test } from '@playwright/test';
import { fillProfile, mockCommonRoutes, mockSearch } from './fixtures';

test.describe('HireFire — estado vacío', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page);
    await mockSearch(page, { count: 0, results: [] });
    await page.goto('/');

    await fillProfile(page);
  });

  test('muestra el estado vacío cuando la búsqueda no retorna resultados', async ({ page }) => {
    await page.locator('[data-testid="search-keywords"]').fill('xyzxyz');
    await page.locator('[data-testid="search-submit"]').click();

    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.getByText('Sin resultados')).toBeVisible();
  });
});
