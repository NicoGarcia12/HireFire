import { groq } from '../../config/clients.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import type { Job, MatchResult, Profile } from '../../types/domain.js';

const BATCH_SIZE = 8;

interface JobScore {
  id: string;
  score: number;
  reasons: string[];
  gaps: string[];
}

function profileBlock(profile: Profile): string {
  const exp = profile.experience
    .map((e) => `- ${e.title} @ ${e.company}: ${e.description}`)
    .join('\n');
  return [
    `Headline: ${profile.headline}`,
    `Resumen: ${profile.summary}`,
    `Skills: ${profile.skills.join(', ')}`,
    `Experiencia:\n${exp}`,
    `Preferencias: ubicaciones=${profile.preferences.locations.join(', ')}, ` +
      `remoto=${profile.preferences.remote}, seniority=${profile.preferences.seniority ?? 'cualquiera'}`,
  ].join('\n');
}

function jobsBlock(jobs: Job[]): string {
  return jobs
    .map(
      (j) =>
        `### ${j.id}\nTítulo: ${j.title}\nEmpresa: ${j.company}\n` +
        `Ubicación: ${j.location} (remoto: ${j.remote})\n` +
        `Descripción: ${j.description.slice(0, 1500)}`,
    )
    .join('\n\n');
}

function parseScores(text: string): JobScore[] {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) return [];
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as { results?: JobScore[] };
    return parsed.results ?? [];
  } catch (err) {
    logger.warn('No se pudo parsear la respuesta del modelo', err);
    return [];
  }
}

async function scoreBatch(profile: Profile, jobs: Job[]): Promise<JobScore[]> {
  const response = await groq.chat.completions.create({
    model: env.groq.model,
    max_tokens: 2048,
    messages: [
      {
        role: 'system',
        content:
          `Sos un asistente experto en reclutamiento técnico. Evaluás qué tan bien encaja ` +
          `un candidato con cada oferta laboral. Devolvés SOLO un JSON válido.\n\n` +
          `PERFIL DEL CANDIDATO:\n${profileBlock(profile)}`,
      },
      {
        role: 'user',
        content: [
          'Evaluá cada oferta contra el perfil del candidato.',
          'Para cada oferta devolvé: score (0-100), reasons (por qué encaja), gaps (qué le falta).',
          'Respondé EXCLUSIVAMENTE con un JSON con esta forma:',
          '{"results":[{"id":"<id>","score":<0-100>,"reasons":["..."],"gaps":["..."]}]}',
          '',
          'Ofertas:',
          jobsBlock(jobs),
        ].join('\n'),
      },
    ],
  });

  const text = response.choices[0]?.message.content ?? '';
  return parseScores(text);
}

/**
 * Rankea las ofertas contra el perfil usando Groq (llama-3.3-70b-versatile).
 * Procesa en lotes y ordena por score descendente.
 */
export async function rankJobs(profile: Profile, jobs: Job[]): Promise<MatchResult[]> {
  const scoreById = new Map<string, JobScore>();

  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const batch = jobs.slice(i, i + BATCH_SIZE);
    logger.info(`Matching: lote ${i / BATCH_SIZE + 1} (${batch.length} ofertas)`);
    const scores = await scoreBatch(profile, batch);
    for (const s of scores) scoreById.set(s.id, s);
  }

  const results: MatchResult[] = jobs.map((job) => {
    const s = scoreById.get(job.id);
    return {
      ...job,
      score: s?.score ?? 0,
      reasons: s?.reasons ?? [],
      gaps: s?.gaps ?? [],
    };
  });

  return results.sort((a, b) => b.score - a.score);
}
