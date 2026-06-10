import { env } from '../../config/env.js';
import type { Profile } from '../../domain/profile/entities/profile.entity.js';
import { logger } from '../../utils/logger.js';
import { groq } from './groq.client.js';

export interface ProfileSuggestion {
  section: 'headline' | 'summary' | 'skills' | 'experience' | 'general';
  priority: 'alta' | 'media' | 'baja';
  issue: string;
  suggestion: string;
}

export interface ProfileAnalysis {
  score: number;
  strengths: string[];
  suggestions: ProfileSuggestion[];
}

function profileText(profile: Profile): string {
  const exp = profile.experience
    .map((experience) => `  - ${experience.title} en ${experience.company}: ${experience.description || '(sin descripción)'}`)
    .join('\n');

  return [
    `Headline: ${profile.headline || '(vacío)'}`,
    `Resumen: ${profile.summary || '(vacío)'}`,
    `Skills: ${profile.skills.length ? profile.skills.join(', ') : '(ninguna)'}`,
    `Experiencia:\n${exp || '  (ninguna)'}`,
    `Preferencias: remoto=${profile.preferences.remote}, ubicaciones=${profile.preferences.locations.join(', ') || 'ninguna'}, seniority=${profile.preferences.seniority || 'no especificado'}`,
  ].join('\n');
}

/**
 * Analiza el perfil con Groq y devuelve sugerencias accionables.
 * Si el modelo devuelve texto extra o JSON inválido, responde un análisis vacío seguro.
 */
export async function analyzeProfile(profile: Profile): Promise<ProfileAnalysis> {
  logger.info('Analizando perfil con Groq', { profileId: profile.id });

  const response = await groq.chat.completions.create({
    model: env.groq.model,
    max_tokens: 2048,
    messages: [
      {
        role: 'system',
        content:
          'Sos un experto en optimización de perfiles de LinkedIn y reclutamiento técnico. ' +
          'Analizás perfiles y das sugerencias concretas, accionables y específicas. ' +
          'Respondés EXCLUSIVAMENTE con JSON válido, sin texto adicional.',
      },
      {
        role: 'user',
        content: [
          'Analizá este perfil de LinkedIn y devolvé sugerencias para mejorarlo.',
          'Sé específico y accionable — no des consejos genéricos.',
          '',
          'PERFIL:',
          profileText(profile),
          '',
          'Respondé EXCLUSIVAMENTE con este JSON:',
          '{',
          '  "score": <0-100, qué tan atractivo es el perfil hoy>,',
          '  "strengths": ["punto fuerte 1", "punto fuerte 2"],',
          '  "suggestions": [',
          '    {',
          '      "section": "<headline|summary|skills|experience|general>",',
          '      "priority": "<alta|media|baja>",',
          '      "issue": "<qué está mal o falta>",',
          '      "suggestion": "<qué hacer exactamente, con ejemplo concreto si aplica>"',
          '    }',
          '  ]',
          '}',
        ].join('\n'),
      },
    ],
  });

  const text = response.choices[0]?.message.content ?? '';
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');

  if (start === -1 || end === -1) {
    logger.warn('No se pudo parsear análisis de perfil');
    return { score: 0, strengths: [], suggestions: [] };
  }

  try {
    return JSON.parse(text.slice(start, end + 1)) as ProfileAnalysis;
  } catch {
    logger.warn('JSON inválido en análisis de perfil');
    return { score: 0, strengths: [], suggestions: [] };
  }
}
