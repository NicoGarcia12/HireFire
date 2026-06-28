import { findProfileById } from '../../helpers/profile/find-profile-helper.js';
import { analyzeProfileWithGroq } from '../matching/groq-analysis-controller.js';
import type { ProfileAnalysis } from '../../types/profile-analysis.types.js';

export type AnalyzeProfileResult = { found: false } | { found: true; analysis: ProfileAnalysis };

/** Busca el perfil y lanza análisis con Groq. Devuelve found:false si no existe. */
export async function analyzeProfileController(profileId: string): Promise<AnalyzeProfileResult> {
  const profile = await findProfileById(profileId);
  if (!profile) {
    return { found: false };
  }

  const analysis = await analyzeProfileWithGroq(profile);
  return { found: true, analysis };
}
