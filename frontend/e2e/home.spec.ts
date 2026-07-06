import { expect, test } from '@playwright/test';
import { fillProfile, mockCommonRoutes, mockSearch, searchResultsResponse } from './fixtures';

test.describe('HireFire — flujo principal', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page);
    await mockSearch(page, searchResultsResponse);
    await page.goto('/');
  });

  test('muestra el título HireFire en la página', async ({ page }) => {
    await expect(page.locator('h1', { hasText: 'HireFire' })).toBeVisible();
  });

  test('el formulario de búsqueda está deshabilitado sin perfil guardado', async ({ page }) => {
    await expect(page.locator('[data-testid="search-submit"]')).toBeDisabled();
  });

  test('guarda el perfil y habilita la búsqueda', async ({ page }) => {
    await fillProfile(page);

    await expect(page.getByText('Guardado ✓')).toBeVisible();
    await expect(page.locator('[data-testid="search-submit"]')).toBeEnabled();
  });

  test('ejecuta una búsqueda y muestra los resultados', async ({ page }) => {
    await fillProfile(page);

    await page.locator('[data-testid="search-keywords"]').fill('angular');
    await page.locator('[data-testid="search-submit"]').click();

    await expect(page.locator('[data-testid="results-section"]')).toBeVisible();
    await expect(page.getByText('Senior Angular Developer')).toBeVisible();
    await expect(page.getByText('Frontend Engineer')).toBeVisible();
  });

  test('el stepper avanza al guardar perfil y al buscar', async ({ page }) => {
    await expect(page.locator('.hf-stepper__step').first()).toHaveClass(/hf-stepper__step--active/);

    await fillProfile(page, 'Dev');

    await expect(page.locator('.hf-stepper__step').first()).toHaveClass(/hf-stepper__step--done/);

    await page.locator('[data-testid="search-keywords"]').fill('angular');
    await page.locator('[data-testid="search-submit"]').click();
    await expect(page.locator('[data-testid="results-section"]')).toBeVisible();

    await expect(page.locator('.hf-stepper__step').last()).toHaveClass(/hf-stepper__step--done/);
  });
});
