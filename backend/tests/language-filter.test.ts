import { describe, expect, it } from 'vitest';
import type { Job } from '../src/domain/jobs/entities/job.entity.js';
import type { AllowedLanguagePreference } from '../src/domain/matching/interfaces/allowed-language-preference.interface.js';
import type { EnglishLevel } from '../src/domain/matching/enums/language-level.enum.js';
import type { LanguageFilteredJob } from '../src/domain/matching/interfaces/language-filtered-job.interface.js';
import {
  compareEnglishLevels,
  detectEnglishRequirement,
  filterJobsByEnglishPreference,
  filterJobsByLanguagePreferences,
} from '../src/modules/matching/language-filter.js';

interface LanguageFilterOptions {
  allowedLanguages: AllowedLanguagePreference[];
}

interface EnglishFilterOptions {
  allowEnglishRequirements: boolean;
  maxEnglishLevelEnabled: boolean;
  maxEnglishLevel?: EnglishLevel;
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
  it('excludes jobs that require English when English requirements are not allowed', () => {
    const options: EnglishFilterOptions = {
      allowEnglishRequirements: false,
      maxEnglishLevelEnabled: false,
    };
    const result = filterJobsByEnglishPreference(
      [
        job('english', 'Requirements: English B1'),
        job('spanish', 'Requisitos: Node.js y TypeScript'),
      ],
      options,
    );

    expect(result.map((j) => j.id)).toEqual(['spanish']);
  });

  it('keeps a B1 job when the configured maximum English level is B1', () => {
    const result = filterJobsByEnglishPreference([job('b1', 'English B1 required')], {
      allowEnglishRequirements: true,
      maxEnglishLevelEnabled: true,
      maxEnglishLevel: 'B1',
    });

    expect(result.map((j) => j.id)).toEqual(['b1']);
  });

  it('keeps a B1 job when the configured maximum English level is B2', () => {
    const result = filterJobsByEnglishPreference([job('b1', 'English B1 required')], {
      allowEnglishRequirements: true,
      maxEnglishLevelEnabled: true,
      maxEnglishLevel: 'B2',
    });

    expect(result.map((j) => j.id)).toEqual(['b1']);
  });

  it('excludes a B1 job when the configured maximum English level is A2', () => {
    const result = filterJobsByEnglishPreference([job('b1', 'English B1 required')], {
      allowEnglishRequirements: true,
      maxEnglishLevelEnabled: true,
      maxEnglishLevel: 'A2',
    });

    expect(result.map((j) => j.id)).toEqual([]);
  });

  it('compares English levels case-insensitively', () => {
    expect(compareEnglishLevels('b1', 'B1')).toBe(0);
  });

  it('orders English levels from A1 to C2', () => {
    expect(
      compareEnglishLevels('A1', 'A2') < 0 &&
        compareEnglishLevels('A2', 'B1') < 0 &&
        compareEnglishLevels('B1', 'B2') < 0 &&
        compareEnglishLevels('B2', 'C1') < 0 &&
        compareEnglishLevels('C1', 'C2') < 0,
    ).toBe(true);
  });

  it('detects English requirements from natural language text', () => {
    expect(
      detectEnglishRequirement('Requisitos: inglés intermedio para llamadas con clientes'),
    ).toEqual({
      requiresEnglish: true,
      level: 'B1',
    });
  });

  it('excludes jobs written in English when English is not in the allowed languages list', () => {
    const options: LanguageFilterOptions = { allowedLanguages: [] };
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
      options,
    );

    expect(result.map((j) => j.id)).toEqual(['neutral-copy']);
  });

  it('excludes jobs written in Portuguese when Portuguese is not in the allowed languages list', () => {
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

    expect(result.map((j) => j.id)).toEqual(['neutral-copy']);
  });

  it('excludes jobs written in Spanish when Spanish is not in the allowed languages list', () => {
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

    expect(result.map((j) => j.id)).toEqual(['neutral-copy']);
  });

  it('excludes jobs written in French when French is not in the allowed languages list', () => {
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

    expect(result.map((j) => j.id)).toEqual(['neutral-copy']);
  });

  it('excludes jobs written in German when German is not in the allowed languages list', () => {
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

    expect(result.map((j) => j.id)).toEqual(['neutral-copy']);
  });

  it('keeps mandatory Portuguese requirements up to B1 and excludes mandatory Portuguese requirements above B1', () => {
    const result = filterJobsByLanguagePreferences(
      [
        job('pt-a2', 'Requisitos obrigatorios: português A2'),
        job('pt-b1', 'Requisito obrigatório: portugues B1'),
        job('pt-b2', 'Requisito obrigatório: português B2'),
      ],
      { allowedLanguages: [{ language: 'portuguese', maxLevel: 'B1' }] },
    );

    expect(result.map((j) => j.id)).toEqual(['pt-a2', 'pt-b1']);
  });

  it('keeps jobs with desirable language requirements but adds a language warning', () => {
    // Un requisito deseable debe llegar a UI como warning; solo los obligatorios excluyen ofertas.
    const result = filterJobsByLanguagePreferences(
      [job('english-plus', 'Requisitos: Node.js. Inglés C1 deseable para contacto con clientes.')],
      { allowedLanguages: [{ language: 'english', maxLevel: 'B1' }] },
    );

    expect(result.map((j) => j.id)).toEqual(['english-plus']);
    expect((result[0] as LanguageFilteredJob).languageWarnings).toEqual([
      {
        language: 'english',
        requestedLevel: 'C1',
        allowedLevel: 'B1',
        reason: 'desirable-language-level-exceeds-allowed',
      },
    ]);
  });

  it('excludes jobs with mandatory language requirements when the language is not allowed', () => {
    const result = filterJobsByLanguagePreferences(
      [job('english-required', 'Requisito excluyente: inglés B1 para reuniones con stakeholders.')],
      { allowedLanguages: [] },
    );

    expect(result.map((j) => j.id)).toEqual([]);
  });

  it('keeps backward compatibility with the previous English-only contract', () => {
    const result = filterJobsByEnglishPreference([job('b1', 'English B1 required')], {
      allowEnglishRequirements: true,
      maxEnglishLevelEnabled: true,
      maxEnglishLevel: 'B1',
    });

    expect(result.map((j) => j.id)).toEqual(['b1']);
  });
});
