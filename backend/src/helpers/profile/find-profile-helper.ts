import { prisma } from '../../config/db.js';
import type { Profile } from '../../types/profile.types.js';

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

/** Mapea la fila relacional de Prisma al tipo `Profile`. */
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

export async function findProfileById(id: string): Promise<Profile | null> {
  const row = await prisma.profile.findUnique({ where: { id }, include: includeExperience });
  return row ? toDomain(row) : null;
}

export async function findAllProfiles(): Promise<Profile[]> {
  const rows = await prisma.profile.findMany({ include: includeExperience });
  return rows.map(toDomain);
}
