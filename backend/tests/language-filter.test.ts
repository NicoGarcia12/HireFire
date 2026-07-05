import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Job } from '../src/domain/jobs/entities/job.entity.js';
import type { AllowedLanguagePreference } from '../src/domain/matching/interfaces/allowed-language-preference.interface.js';
import type { EnglishLevel } from '../src/domain/matching/enums/language-level.enum.js';
import type { LanguageFilteredJob } from '../src/domain/matching/interfaces/language-filtered-job.interface.js';

interface LanguageFilterOptions {
  allowedLanguages: AllowedLanguagePreference[];
}

interface EnglishFilterOptions {
  allowEnglishRequirements: boolean;
  maxEnglishLevelEnabled: boolean;
  maxEnglishLevel?: EnglishLevel;
}

interface LanguageFilterModule {
  compareEnglishLevels(requested: string, allowed: string): number;
  detectEnglishRequirement(description: string): { requiresEnglish: boolean; level?: EnglishLevel };
  filterJobsByEnglishPreference(jobs: Job[], options: EnglishFilterOptions): Job[];
  filterJobsByLanguagePreferences(
    jobs: Job[],
    options: LanguageFilterOptions,
  ): LanguageFilteredJob[];
}

async function loadLanguageFilter(): Promise<LanguageFilterModule> {
  return (await import('../src/modules/matching/language-filter.js')) as LanguageFilterModule;
}

function job(id: string, description: string): Job {
  return {
    id,
    title: `Oferta ${id}`,
    company: 'ACME',
    location: 'Remoto',
    remote: true,
    description,
    url: `https://example.com/${id}`,
  };
}

describe('language filter', () => {
  it('excludes jobs that require English when English requirements are not allowed', async () => {
    const { filterJobsByEnglishPreference } = await loadLanguageFilter();

    const result = filterJobsByEnglishPreference(
      [
        job('english', 'Requirements: English B1'),
        job('spanish', 'Requisitos: Node.js y TypeScript'),
      ],
      { allowEnglishRequirements: false, maxEnglishLevelEnabled: false },
    );

    assert.deepEqual(
      result.map((j) => j.id),
      ['spanish'],
    );
  });

  it('keeps a B1 job when the configured maximum English level is B1', async () => {
    const { filterJobsByEnglishPreference } = await loadLanguageFilter();

    const result = filterJobsByEnglishPreference([job('b1', 'English B1 required')], {
      allowEnglishRequirements: true,
      maxEnglishLevelEnabled: true,
      maxEnglishLevel: 'B1',
    });

    assert.deepEqual(
      result.map((j) => j.id),
      ['b1'],
    );
  });

  it('keeps a B1 job when the configured maximum English level is B2', async () => {
    const { filterJobsByEnglishPreference } = await loadLanguageFilter();

    const result = filterJobsByEnglishPreference([job('b1', 'English B1 required')], {
      allowEnglishRequirements: true,
      maxEnglishLevelEnabled: true,
      maxEnglishLevel: 'B2',
    });

    assert.deepEqual(
      result.map((j) => j.id),
      ['b1'],
    );
  });

  it('excludes a B1 job when the configured maximum English level is A2', async () => {
    const { filterJobsByEnglishPreference } = await loadLanguageFilter();

    const result = filterJobsByEnglishPreference([job('b1', 'English B1 required')], {
      allowEnglishRequirements: true,
      maxEnglishLevelEnabled: true,
      maxEnglishLevel: 'A2',
    });

    assert.deepEqual(
      result.map((j) => j.id),
      [],
    );
  });

  it('compares English levels case-insensitively', async () => {
    const { compareEnglishLevels } = await loadLanguageFilter();

    assert.equal(compareEnglishLevels('b1', 'B1'), 0);
  });

  it('orders English levels from A1 to C2', async () => {
    const { compareEnglishLevels } = await loadLanguageFilter();

    assert.equal(
      compareEnglishLevels('A1', 'A2') < 0 &&
        compareEnglishLevels('A2', 'B1') < 0 &&
        compareEnglishLevels('B1', 'B2') < 0 &&
        compareEnglishLevels('B2', 'C1') < 0 &&
        compareEnglishLevels('C1', 'C2') < 0,
      true,
    );
  });

  it('detects English requirements from natural language text', async () => {
    const { detectEnglishRequirement } = await loadLanguageFilter();

    assert.deepEqual(
      detectEnglishRequirement('Requisitos: inglés intermedio para llamadas con clientes'),
      {
        requiresEnglish: true,
        level: 'B1',
      },
    );
  });

  it('excludes jobs written in English when English is not in the allowed languages list', async () => {
    const { filterJobsByLanguagePreferences } = await loadLanguageFilter();

    const result = filterJobsByLanguagePreferences(
      [
        job(
          'english-copy',
          'We are looking for a backend developer to build APIs and collaborate with product teams.',
        ),
        job(
          'neutral-copy',
          'ACME. Puesto: Backend Developer. Stack: Node.js, TypeScript, PostgreSQL.',
        ),
      ],
      { allowedLanguages: [] },
    );

    assert.deepEqual(
      result.map((j) => j.id),
      ['neutral-copy'],
    );
  });

  it('excludes jobs written in Portuguese when Portuguese is not in the allowed languages list', async () => {
    const { filterJobsByLanguagePreferences } = await loadLanguageFilter();

    const result = filterJobsByLanguagePreferences(
      [
        job(
          'portuguese-copy',
          'Procuramos pessoa desenvolvedora backend para construir APIs e colaborar com times de produto.',
        ),
        job(
          'neutral-copy',
          'ACME. Puesto: Backend Developer. Stack: Node.js, TypeScript, PostgreSQL.',
        ),
      ],
      { allowedLanguages: [] },
    );

    assert.deepEqual(
      result.map((j) => j.id),
      ['neutral-copy'],
    );
  });

  it('excludes jobs written in Spanish when Spanish is not in the allowed languages list', async () => {
    const { filterJobsByLanguagePreferences } = await loadLanguageFilter();

    const result = filterJobsByLanguagePreferences(
      [
        job(
          'spanish-copy',
          'Buscamos developer backend para construir APIs y colaborar con producto.',
        ),
        job(
          'neutral-copy',
          'ACME. Puesto: Backend Developer. Stack: Node.js, TypeScript, PostgreSQL.',
        ),
      ],
      { allowedLanguages: [] },
    );

    assert.deepEqual(
      result.map((j) => j.id),
      ['neutral-copy'],
    );
  });

  it('excludes jobs written in French when French is not in the allowed languages list', async () => {
    const { filterJobsByLanguagePreferences } = await loadLanguageFilter();

    const result = filterJobsByLanguagePreferences(
      [
        job(
          'french-copy',
          'Nous recherchons un développeur backend pour collaborer avec les équipes produit.',
        ),
        job(
          'neutral-copy',
          'ACME. Puesto: Backend Developer. Stack: Node.js, TypeScript, PostgreSQL.',
        ),
      ],
      { allowedLanguages: [] },
    );

    assert.deepEqual(
      result.map((j) => j.id),
      ['neutral-copy'],
    );
  });

  it('excludes jobs written in German when German is not in the allowed languages list', async () => {
    const { filterJobsByLanguagePreferences } = await loadLanguageFilter();

    const result = filterJobsByLanguagePreferences(
      [
        job(
          'german-copy',
          'Wir suchen eine Backend-Entwicklerin, die mit Produktteams zusammenarbeiten kann.',
        ),
        job(
          'neutral-copy',
          'ACME. Puesto: Backend Developer. Stack: Node.js, TypeScript, PostgreSQL.',
        ),
      ],
      { allowedLanguages: [] },
    );

    assert.deepEqual(
      result.map((j) => j.id),
      ['neutral-copy'],
    );
  });

  it('keeps mandatory Portuguese requirements up to B1 and excludes mandatory Portuguese requirements above B1', async () => {
    const { filterJobsByLanguagePreferences } = await loadLanguageFilter();

    const result = filterJobsByLanguagePreferences(
      [
        job('pt-a2', 'Requisitos obrigatorios: português A2'),
        job('pt-b1', 'Requisito obrigatório: portugues B1'),
        job('pt-b2', 'Requisito obrigatório: português B2'),
      ],
      { allowedLanguages: [{ language: 'portuguese', maxLevel: 'B1' }] },
    );

    assert.deepEqual(
      result.map((j) => j.id),
      ['pt-a2', 'pt-b1'],
    );
  });

  it('keeps jobs with desirable language requirements but adds a language warning', async () => {
    const { filterJobsByLanguagePreferences } = await loadLanguageFilter();

    // Un requisito deseable debe llegar a UI como warning; solo los obligatorios excluyen ofertas.
    const result = filterJobsByLanguagePreferences(
      [job('english-plus', 'Requisitos: Node.js. Inglés C1 deseable para contacto con clientes.')],
      { allowedLanguages: [{ language: 'english', maxLevel: 'B1' }] },
    );

    assert.deepEqual(
      result.map((j) => j.id),
      ['english-plus'],
    );
    assert.deepEqual(result[0]?.languageWarnings, [
      {
        language: 'english',
        requestedLevel: 'C1',
        allowedLevel: 'B1',
        reason: 'desirable-language-level-exceeds-allowed',
      },
    ]);
  });

  it('excludes jobs with mandatory language requirements when the language is not allowed', async () => {
    const { filterJobsByLanguagePreferences } = await loadLanguageFilter();

    const result = filterJobsByLanguagePreferences(
      [job('english-required', 'Requisito excluyente: inglés B1 para reuniones con stakeholders.')],
      { allowedLanguages: [] },
    );

    assert.deepEqual(
      result.map((j) => j.id),
      [],
    );
  });

  it('keeps backward compatibility with the previous English-only contract', async () => {
    const { filterJobsByEnglishPreference } = await loadLanguageFilter();

    const result = filterJobsByEnglishPreference([job('b1', 'English B1 required')], {
      allowEnglishRequirements: true,
      maxEnglishLevelEnabled: true,
      maxEnglishLevel: 'B1',
    });

    assert.deepEqual(
      result.map((j) => j.id),
      ['b1'],
    );
  });
});
