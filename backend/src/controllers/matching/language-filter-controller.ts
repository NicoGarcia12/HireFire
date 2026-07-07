import type {
  Job,
  AllowedLanguagePreference,
  EnglishLevel,
  LanguageFilteredJob,
  LanguageWarning,
  LanguageLevel,
  SupportedLanguage,
} from '../../types/job.types.js';
import { LANGUAGE_LEVELS } from '../../types/job.types.js';

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

const LANGUAGE_LABELS: Record<SupportedLanguage, RegExp> = {
  english: /\b(ingl[eé]s|english)\b/iu,
  portuguese: /\b(portugu[eê]s|portugues|portuguese)\b/iu,
  spanish: /\b(espa[nñ]ol|castellano|spanish)\b/iu,
  french: /\b(franc[eé]s|franç?ais|french)\b/iu,
  german: /\b(alem[aá]n|deutsch|german)\b/iu,
};

const LEVEL_BY_NATURAL_LANGUAGE: ReadonlyArray<readonly [RegExp, LanguageLevel]> = [
  [/\b(intermedio\s+alto|upper[-\s]?intermediate)\b/iu, 'B2'],
  [/\b(biling[uü]e|bilingual|nativo|native|fluido|fluent|fluente)\b/iu, 'C2'],
  [/\b(avanzado|advanced|avançado)\b/iu, 'C1'],
  [/\b(intermedio|intermediate|intermedi[aá]rio)\b/iu, 'B1'],
  [/\b(b[aá]sico|basic|beginner|elemental|básico)\b/iu, 'A2'],
];

const EXPLICIT_LEVEL_PATTERN = /\b(A1|A2|B1|B2|C1|C2)\b/iu;
const MANDATORY_REQUIREMENT_PATTERN =
  /\b(required|mandatory|excluyente|obligatorio|obrigat[oó]rio|must\s+have|advanced\s+english\s+required)\b/iu;
const DESIRABLE_REQUIREMENT_PATTERN =
  /\b(desirable|nice\s+to\s+have|plus|valorado|deseable|desej[aá]vel|no\s+excluyente|ser[aá]\s+un\s+plus)\b/iu;

const ENGLISH_COPY_MARKERS: readonly RegExp[] = [
  /\b(we\s+are\s+looking\s+for|we're\s+looking\s+for|requirements?|responsibilities|experience\s+with|collaborate\s+with|product\s+teams?|build\s+apis?)\b/iu,
];

const PORTUGUESE_COPY_MARKERS: readonly RegExp[] = [
  /\b(procuramos|pessoa\s+desenvolvedora|desenvolvedor(?:a)?|obrigat[oó]rios?|colaborar\s+com|times?\s+de\s+produto)\b/iu,
];

const SPANISH_COPY_MARKERS: readonly RegExp[] = [
  /\b(buscamos|estamos\s+buscando|se\s+valorar[aá]|imprescindible|conocimientos\s+en|a[nñ]os\s+de\s+experiencia)\b/iu,
];

const FRENCH_COPY_MARKERS: readonly RegExp[] = [
  /\b(nous\s+recherchons|exigences|responsabilit[ée]s|exp[ée]rience\s+avec|collaborer\s+avec|[ée]quipes?\s+produit)\b/iu,
];

const GERMAN_COPY_MARKERS: readonly RegExp[] = [
  /\b(wir\s+suchen|anforderungen|verantwortlichkeiten|erfahrung\s+mit|zusammenarbeiten\s+mit|produktteams?)\b/iu,
];

const COPY_MARKERS_BY_LANGUAGE: Record<SupportedLanguage, readonly RegExp[]> = {
  english: ENGLISH_COPY_MARKERS,
  portuguese: PORTUGUESE_COPY_MARKERS,
  spanish: SPANISH_COPY_MARKERS,
  french: FRENCH_COPY_MARKERS,
  german: GERMAN_COPY_MARKERS,
};

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
  if (normalizedExplicitLevel) return normalizedExplicitLevel;
  for (const [pattern, level] of LEVEL_BY_NATURAL_LANGUAGE) {
    if (pattern.test(text)) return level;
  }
  return undefined;
}

function detectRequirementType(text: string): 'mandatory' | 'desirable' {
  if (DESIRABLE_REQUIREMENT_PATTERN.test(text)) return 'desirable';
  if (MANDATORY_REQUIREMENT_PATTERN.test(text)) return 'mandatory';
  return 'mandatory';
}

function detectLanguageRequirement(
  description: string,
  language: SupportedLanguage,
): LanguageRequirementDetection {
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
  const markers = COPY_MARKERS_BY_LANGUAGE[language];
  return markers.some((pattern) => pattern.test(text));
}

function withLanguageWarning(job: Job, warning: LanguageWarning): LanguageFilteredJob {
  const existingWarnings =
    'languageWarnings' in job && Array.isArray(job.languageWarnings)
      ? (job.languageWarnings as LanguageWarning[])
      : [];
  return { ...job, languageWarnings: [...existingWarnings, warning] };
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
  return { requiresEnglish: detection.requiresLanguage, level: detection.level };
}

export function filterJobsByEnglishPreference(jobs: Job[], options: EnglishFilterOptions): Job[] {
  return jobs.filter((job) => {
    const detection = detectEnglishRequirement(`${job.title}\n${job.description}`);
    if (!detection.requiresEnglish) return true;
    if (!options.allowEnglishRequirements) return false;
    if (!options.maxEnglishLevelEnabled || !options.maxEnglishLevel || !detection.level)
      return true;
    return compareEnglishLevels(detection.level, options.maxEnglishLevel) <= 0;
  });
}

export function filterJobsByLanguagePreferences(
  jobs: Job[],
  options: LanguageFilterOptions,
): LanguageFilteredJob[] {
  const allowedByLanguage = new Map(
    options.allowedLanguages.map((preference) => [preference.language, preference]),
  );
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
          allowedPreference &&
          requirement.level &&
          compareEnglishLevels(requirement.level, allowedPreference.maxLevel) > 0,
        );

        if (requirement.requirementType === 'desirable') {
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

    if (shouldKeep) filteredJobs.push(currentJob);
  }

  return filteredJobs;
}
