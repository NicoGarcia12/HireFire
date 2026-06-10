import { prisma } from '../../config/db.js';
import type { Profile, SaveProfileInput } from '../../types/profile.types.js';

const includeExperience = {
  experience: { select: { title: true, company: true, description: true } },
} as const;

type ProfileRow = {
  id: string;
  headline: string;
  summary: string;
  skills: string[];
  locations: string[];
  remote: boolean;
  seniority: string | null;
  experience: { title: string; company: string; description: string }[];
};

function toDomain(row: ProfileRow): Profile {
  return {
    id: row.id,
    headline: row.headline,
    summary: row.summary,
    skills: row.skills,
    experience: row.experience.map((exp) => ({
      title: exp.title,
      company: exp.company,
      description: exp.description,
    })),
    preferences: {
      locations: row.locations,
      remote: row.remote,
      seniority: row.seniority ?? undefined,
    },
  };
}

/**
 * Crea o actualiza un perfil reemplazando la experiencia completa.
 * El reemplazo conserva el contrato actual del API: el cliente manda el estado final.
 */
export async function upsertProfile(input: SaveProfileInput): Promise<Profile> {
  const scalar = {
    headline: input.headline,
    summary: input.summary,
    skills: input.skills,
    locations: input.preferences.locations,
    remote: input.preferences.remote,
    seniority: input.preferences.seniority ?? null,
  };

  const experienceCreate = input.experience.map((exp) => ({
    title: exp.title,
    company: exp.company,
    description: exp.description,
  }));

  if (input.id) {
    await prisma.experience.deleteMany({ where: { profileId: input.id } });
    const row = await prisma.profile.update({
      where: { id: input.id },
      data: { ...scalar, experience: { create: experienceCreate } },
      include: includeExperience,
    });
    return toDomain(row);
  }

  const row = await prisma.profile.create({
    data: { ...scalar, experience: { create: experienceCreate } },
    include: includeExperience,
  });
  return toDomain(row);
}
