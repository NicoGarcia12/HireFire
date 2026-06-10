import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';
import type { LinkedInImport } from '../types/linkedin-import.types.js';
import { logger } from './logger.js';

type CsvRow = Record<string, string>;

function parseCsv(content: string): CsvRow[] {
  try {
    return parse(content, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      trim: true,
      relax_column_count: true,
    }) as CsvRow[];
  } catch {
    return [];
  }
}

/** Lee el primer valor no vacío entre variantes de encabezados de export LinkedIn. */
function pick(row: CsvRow, keys: string[]): string {
  for (const key of keys) {
    const val = row[key]?.trim();
    if (val) return val;
  }
  return '';
}

function parseProfile(content: string): Pick<LinkedInImport, 'headline' | 'summary'> {
  const rows = parseCsv(content);
  const row = rows[0] ?? {};
  return {
    headline: pick(row, ['Headline', 'headline', 'Summary']),
    summary: pick(row, ['Summary', 'summary', 'About']),
  };
}

function parseSkills(content: string): string[] {
  return parseCsv(content).map((row) => pick(row, ['Name', 'name', 'Skill Name'])).filter(Boolean);
}

function parsePositions(content: string): LinkedInImport['experience'] {
  return parseCsv(content)
    .map((row) => ({
      title: pick(row, ['Title', 'title', 'Position']),
      company: pick(row, ['Company Name', 'Company', 'company', 'Employer']),
      description: pick(row, ['Description', 'description', 'Summary']),
    }))
    .filter((experience) => experience.title || experience.company);
}

/**
 * Parsea el ZIP de exportación de LinkedIn y extrae datos de perfil sin persistirlos.
 * Soporta Profile.csv, Positions.csv y Skills.csv aunque vengan en subcarpetas.
 */
export function parseLinkedInZip(buffer: Buffer): LinkedInImport {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  let headline = '';
  let summary = '';
  let skills: string[] = [];
  let experience: LinkedInImport['experience'] = [];
  const filesFound: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const name = entry.entryName.split('/').pop()?.toLowerCase() ?? '';
    filesFound.push(entry.entryName);

    const content = entry.getData().toString('utf-8');

    if (name === 'profile.csv') {
      const profile = parseProfile(content);
      headline = profile.headline;
      summary = profile.summary;
    } else if (name === 'skills.csv') {
      skills = parseSkills(content);
    } else if (name === 'positions.csv') {
      experience = parsePositions(content);
    }
  }

  logger.info('LinkedIn import: archivos procesados', filesFound);

  return { headline, summary, skills, experience, filesFound };
}
