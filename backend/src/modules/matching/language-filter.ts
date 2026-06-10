import type { Job } from '../../domain/jobs/entities/job.entity.js';
import type { EnglishLevel, LanguageLevel } from '../../domain/matching/enums/language-level.enum.js';
import type { SupportedLanguage } from '../../domain/matching/enums/supported-language.enum.js';
import type { AllowedLanguagePreference } from '../../domain/matching/interfaces/allowed-language-preference.interface.js';
import type { LanguageFilteredJob } from '../../domain/matching/interfaces/language-filtered-job.interface.js';
import type { LanguageWarning } from '../../domain/matching/interfaces/language-warning.interface.js';

export interface EnglishFilterOptions {
  allowEnglishRequirements: boolean;
  maxEnglishLevelEnabled: boolean;
  maxEnglishLevel?: EnglishLevel;
}

export interface LanguageFilterOptions {
  allowedLanguages: AllowedLanguagePreference[];
}

interface LanguageRequirementDetection {
  requiresLanguage: boolean;
  level?: LanguageLevel;
  requirementType: 'mandatory' | 'desirable';
}

interface EnglishRequirementDetection {
  requiresEnglish: boolean;
  level?: EnglishLevel;
}

const LANGUAGE_LEVELS: readonly LanguageLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

const LANGUAGE_LABELS: Record<SupportedLanguage, RegExp> = {
  english: /\b(ingl[eé]s|english)\b/iu,
  portuguese: /\b(portugu[eê]s|portugues|portuguese)\b/iu,
};

const LEVEL_BY_NATURAL_LANGUAGE: ReadonlyArray<readonly [RegExp, LanguageLevel]> = [
  [/\b(intermedio\s+alto|upper[-\s]?intermediate)\b/iu, 'B2'],
  [/\b(biling[uü]e|bilingual|nativo|native|fluido|fluent|fluente)\b/iu, 'C2'],
  [/\b(avanzado|advanced|avançado)\b/iu, 'C1'],
  [/\b(intermedio|intermediate|intermedi[aá]rio)\b/iu, 'B1'],
  [/\b(b[aá]sico|basic|beginner|elemental|básico)\b/iu, 'A2'],
];

const EXPLICIT_LEVEL_PATTERN = /\b(A1|A2|B1|B2|C1|C2)\b/iu;
const MANDATORY_REQUIREMENT_PATTERN = /\b(required|mandatory|excluyente|obligatorio|obrigat[oó]rio|must\s+have|advanced\s+english\s+required)\b/iu;
const DESIRABLE_REQUIREMENT_PATTERN = /\b(desirable|nice\s+to\s+have|plus|valorado|deseable|desej[aá]vel|no\s+excluyente|ser[aá]\s+un\s+plus)\b/iu;

const ENGLISH_COPY_MARKERS: readonly RegExp[] = [
  /\b(we\s+are\s+looking\s+for|we're\s+looking\s+for|requirements?|responsibilities|experience\s+with|collaborate\s+with|product\s+teams?|build\s+apis?)\b/iu,
];

const PORTUGUESE_COPY_MARKERS: readonly RegExp[] = [
  /\b(procuramos|pessoa\s+desenvolvedora|desenvolvedor(?:a)?|obrigat[oó]rios?|colaborar\s+com|times?\s+de\s+produto)\b/iu,
];

// Los markers detectan avisos escritos íntegramente en otro idioma aunque no digan
// "English required" / "português obrigatório" explícitamente.

function normalizeLanguageLevel(level: string): LanguageLevel | undefined {
  const normalized = level.trim().toUpperCase();
  return LANGUAGE_LEVELS.find((candidate) => candidate === normalized);
}

function languageLevelRank(level: string): number | undefined {
  const normalized = normalizeLanguageLevel(level);
  if (!normalized) return undefined;
  return LANGUAGE_LEVELS.indexOf(normalized);
}

function textAroundMatch(text: string, pattern: RegExp, radius: number): string | undefined {
  const match = pattern.exec(text);
  if (!match) return undefined;

  const start = Math.max(0, match.index - radius);
  const end = Math.min(text.length, match.index + match[0].length + radius);
  return text.slice(start, end);
}

function detectLevel(text: string): LanguageLevel | undefined {
  const explicitLevel = text.match(EXPLICIT_LEVEL_PATTERN)?.[1];
  const normalizedExplicitLevel = explicitLevel ? normalizeLanguageLevel(explicitLevel) : undefined;
  if (normalizedExplicitLevel) {
    return normalizedExplicitLevel;
  }

  for (const [pattern, level] of LEVEL_BY_NATURAL_LANGUAGE) {
    if (pattern.test(text)) {
      return level;
    }
  }

  return undefined;
}

function detectRequirementType(text: string): 'mandatory' | 'desirable' {
  // Si aparecen ambas señales, privilegiamos "desirable" para advertir sin excluir la oferta.
  if (DESIRABLE_REQUIREMENT_PATTERN.test(text)) {
    return 'desirable';
  }

  if (MANDATORY_REQUIREMENT_PATTERN.test(text)) {
    return 'mandatory';
  }

  return 'mandatory';
}

function detectLanguageRequirement(description: string, language: SupportedLanguage): LanguageRequirementDetection {
  const languagePattern = LANGUAGE_LABELS[language];
  if (!languagePattern.test(description)) {
    return { requiresLanguage: false, requirementType: 'mandatory' };
  }

  const context = textAroundMatch(description, languagePattern, 80) ?? description;

  return {
    requiresLanguage: true,
    level: detectLevel(context),
    requirementType: detectRequirementType(context),
  };
}

function isLikelyWrittenIn(text: string, language: SupportedLanguage): boolean {
  const markers = language === 'english' ? ENGLISH_COPY_MARKERS : PORTUGUESE_COPY_MARKERS;
  return markers.some((pattern) => pattern.test(text));
}

function allowedPreferenceByLanguage(
  allowedLanguages: AllowedLanguagePreference[],
): ReadonlyMap<SupportedLanguage, AllowedLanguagePreference> {
  return new Map(allowedLanguages.map((preference) => [preference.language, preference]));
}

function withLanguageWarning(job: Job, warning: LanguageWarning): LanguageFilteredJob {
  const existingWarnings = 'languageWarnings' in job && Array.isArray(job.languageWarnings)
    ? job.languageWarnings
    : [];

  return {
    ...job,
    languageWarnings: [...existingWarnings, warning],
  };
}

export function compareEnglishLevels(requested: string, allowed: string): number {
  const requestedRank = languageLevelRank(requested);
  const allowedRank = languageLevelRank(allowed);

  if (requestedRank === undefined || allowedRank === undefined) {
    return requested.localeCompare(allowed, undefined, { sensitivity: 'accent' });
  }

  return requestedRank - allowedRank;
}

export function detectEnglishRequirement(description: string): EnglishRequirementDetection {
  const detection = detectLanguageRequirement(description, 'english');
  return {
    requiresEnglish: detection.requiresLanguage,
    level: detection.level,
  };
}

export function filterJobsByEnglishPreference(jobs: Job[], options: EnglishFilterOptions): Job[] {
  return jobs.filter((job) => {
    const detection = detectEnglishRequirement(`${job.title}\n${job.description}`);

    if (!detection.requiresEnglish) {
      return true;
    }

    if (!options.allowEnglishRequirements) {
      return false;
    }

    if (!options.maxEnglishLevelEnabled || !options.maxEnglishLevel || !detection.level) {
      return true;
    }

    return compareEnglishLevels(detection.level, options.maxEnglishLevel) <= 0;
  });
}

export function filterJobsByLanguagePreferences(
  jobs: Job[],
  options: LanguageFilterOptions,
): LanguageFilteredJob[] {
  const allowedByLanguage = allowedPreferenceByLanguage(options.allowedLanguages);
  const filteredJobs: LanguageFilteredJob[] = [];

  for (const job of jobs) {
    const text = `${job.title}\n${job.description}`;
    let currentJob: LanguageFilteredJob = { ...job };
    let shouldKeep = true;

    for (const language of Object.keys(LANGUAGE_LABELS) as SupportedLanguage[]) {
      const allowedPreference = allowedByLanguage.get(language);
      const requirement = detectLanguageRequirement(text, language);

      if (requirement.requiresLanguage) {
        const levelExceedsAllowed = Boolean(
          allowedPreference
          && requirement.level
          && compareEnglishLevels(requirement.level, allowedPreference.maxLevel) > 0,
        );

        if (requirement.requirementType === 'desirable') {
          // Requisitos deseables no bloquean la oferta: se preserva el resultado y la UI muestra warning.
          if (!allowedPreference) {
            currentJob = withLanguageWarning(currentJob, {
              language,
              requestedLevel: requirement.level,
              reason: 'desirable-language-not-allowed',
            });
          } else if (levelExceedsAllowed) {
            currentJob = withLanguageWarning(currentJob, {
              language,
              requestedLevel: requirement.level,
              allowedLevel: allowedPreference.maxLevel,
              reason: 'desirable-language-level-exceeds-allowed',
            });
          }

          continue;
        }

        if (!allowedPreference || levelExceedsAllowed) {
          shouldKeep = false;
          break;
        }

        continue;
      }

      if (!allowedPreference && isLikelyWrittenIn(text, language)) {
        shouldKeep = false;
        break;
      }
    }

    if (shouldKeep) {
      filteredJobs.push(currentJob);
    }
  }

  return filteredJobs;
}
