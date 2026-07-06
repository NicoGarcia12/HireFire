import { expect, test } from '@playwright/test';
import { fillProfile, mockCommonRoutes } from './fixtures';

test.describe('HireFire — filtros de idioma', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page);
    await page.goto('/');
    await fillProfile(page);
  });

  test('muestra el selector de idioma con los idiomas soportados disponibles', async ({ page }) => {
    await expect(page.locator('[data-testid="language-select"]')).toBeVisible();
  });

  test('agrega un idioma y aparece en la lista de permitidos', async ({ page }) => {
    await page.locator('[data-testid="add-language-button"]').click();
    await expect(page.locator('[data-testid="allowed-language-english"]')).toBeVisible();
  });

  test('el botón de quitar idioma elimina el idioma de la lista', async ({ page }) => {
    await page.locator('[data-testid="add-language-button"]').click();
    await expect(page.locator('[data-testid="allowed-language-english"]')).toBeVisible();

    await page.locator('[data-testid="remove-language-english"]').click();
    await expect(page.locator('[data-testid="allowed-language-english"]')).toHaveCount(0);
  });

  test('oculta el selector cuando no quedan idiomas disponibles', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.locator('[data-testid="add-language-button"]').click();
    }

    await expect(page.locator('[data-testid="language-select"]')).toHaveCount(0);
  });

  test('incluye los idiomas permitidos en el payload de búsqueda', async ({ page }) => {
    const searchRequest = page.waitForRequest(
      (request) => request.url().includes('/api/search') && request.method() === 'POST',
    );

    await page.route('**/api/search', (route) => route.fulfill({ json: { count: 0, results: [] } }));

    await page.locator('[data-testid="add-language-button"]').click();
    await page.locator('[data-testid="search-keywords"]').fill('angular');
    await page.locator('[data-testid="search-submit"]').click();

    const request = await searchRequest;
    const body = request.postDataJSON() as { allowedLanguages: { language: string }[] };

    expect(body.allowedLanguages).toHaveLength(1);
    expect(body.allowedLanguages[0].language).toBe('english');
  });
});
