import type { Page } from '@playwright/test';

export const profileResponse = {
  id: 'profile-test-1',
  headline: 'Frontend Developer',
  summary: 'Experienced developer',
  skills: ['Angular', 'TypeScript'],
  experience: [],
  preferences: { locations: [], remote: true },
};

export const searchResultsResponse = {
  count: 2,
  results: [
    {
      id: 'job-1',
      title: 'Senior Angular Developer',
      company: 'TechCorp',
      location: 'Buenos Aires',
      remote: true,
      description: 'Angular role',
      url: 'https://example.com/job/1',
      score: 87,
      reasons: ['Dominio de Angular', 'TypeScript avanzado'],
      gaps: ['Falta experiencia con NX'],
    },
    {
      id: 'job-2',
      title: 'Frontend Engineer',
      company: 'StartupAR',
      location: 'Córdoba',
      remote: false,
      description: 'React role',
      url: 'https://example.com/job/2',
      score: 52,
      reasons: ['Experiencia con SPAs'],
      gaps: ['React requerido', 'Node.js avanzado'],
    },
  ],
};

export async function mockCommonRoutes(page: Page): Promise<void> {
  await page.route('**/api/profile', (route) =>
    route.fulfill({ json: profileResponse }),
  );
  await page.route('**/api/saved-searches*', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/history*', (route) => route.fulfill({ json: [] }));
}

export async function mockSearch(page: Page, body: unknown): Promise<void> {
  await page.route('**/api/search', (route) => route.fulfill({ json: body }));
}

async function fillMaterialInput(page: Page, testId: string, value: string): Promise<void> {
  // .fill() skips the "receives pointer events" actionability check that .click() requires,
  // which the mat-form-field notched-outline overlay would otherwise intercept.
  await page.locator(`[data-testid="${testId}"]`).fill(value);
}

export async function fillProfile(page: Page, headline = 'Frontend Developer'): Promise<void> {
  await fillMaterialInput(page, 'profile-headline', headline);
  await fillMaterialInput(page, 'exp-title-0', 'Dev');
  await fillMaterialInput(page, 'exp-company-0', 'Acme');
  await page.locator('[data-testid="save-profile-btn"]').click();
  await page.getByText('Guardado').waitFor();
}
