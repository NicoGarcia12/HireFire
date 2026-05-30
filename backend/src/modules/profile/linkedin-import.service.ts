import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';
import { logger } from '../../utils/logger.js';

export interface LinkedInImport {
  headline: string;
  summary: string;
  skills: string[];
  experience: { title: string; company: string; description: string }[];
  /** Archivos encontrados en el ZIP (para diagnóstico). */
  filesFound: string[];
}

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

/** Lee el primer valor no vacío entre varias claves posibles. */
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
  return parseCsv(content)
    .map((r) => pick(r, ['Name', 'name', 'Skill Name']))
    .filter(Boolean);
}

function parsePositions(content: string): LinkedInImport['experience'] {
  return parseCsv(content)
    .map((r) => ({
      title: pick(r, ['Title', 'title', 'Position']),
      company: pick(r, ['Company Name', 'Company', 'company', 'Employer']),
      description: pick(r, ['Description', 'description', 'Summary']),
    }))
    .filter((e) => e.title || e.company);
}

/**
 * Parsea el ZIP de exportación de LinkedIn y extrae los datos del perfil.
 * Soporta la Parte 1 del export (Profile.csv, Positions.csv, Skills.csv).
 * No guarda nada — devuelve los datos para que el frontend pre-llene el formulario.
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
      const p = parseProfile(content);
      headline = p.headline;
      summary = p.summary;
    } else if (name === 'skills.csv') {
      skills = parseSkills(content);
    } else if (name === 'positions.csv') {
      experience = parsePositions(content);
    }
  }

  logger.info('LinkedIn import: archivos procesados', filesFound);

  return { headline, summary, skills, experience, filesFound };
}
