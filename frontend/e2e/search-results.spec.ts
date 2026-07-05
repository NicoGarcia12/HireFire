import { expect, test } from '@playwright/test';
import { fillProfile, mockCommonRoutes, mockSearch, searchResultsResponse } from './fixtures';

test.describe('HireFire — resultados de búsqueda', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonRoutes(page);
    await mockSearch(page, searchResultsResponse);
    await page.goto('/');

    await fillProfile(page);
    await page.locator('[data-testid="search-keywords"]').fill('angular');
    await page.locator('[data-testid="search-submit"]').click();
    await expect(page.locator('[data-testid="results-section"]')).toBeVisible();
  });

  test('muestra el score de cada resultado', async ({ page }) => {
    await expect(page.getByText('87')).toBeVisible();
    await expect(page.getByText('52')).toBeVisible();
  });

  test('muestra las razones del match', async ({ page }) => {
    await expect(page.getByText('Dominio de Angular')).toBeVisible();
  });

  test('muestra los gaps', async ({ page }) => {
    await expect(page.getByText('Falta experiencia con NX')).toBeVisible();
  });

  test('el botón exportar CSV está disponible', async ({ page }) => {
    await expect(page.getByText('Exportar CSV')).toBeVisible();
  });

  test('el slider de score mínimo filtra resultados', async ({ page }) => {
    await expect(page.locator('[data-testid="results-section"]')).toBeVisible();
    await expect(page.locator('.hf-results__count')).toHaveText('2');
  });
});

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
