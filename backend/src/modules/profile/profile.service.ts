import { prisma } from '../../config/db.js';
import type { Profile } from '../../types/domain.js';

/** Fila de Prisma (Profile + Experience) tal como la devuelve la query. */
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

/** Mapea la fila relacional al contrato de dominio `Profile`. */
function toDomain(row: ProfileRow): Profile {
  return {
    id: row.id,
    headline: row.headline,
    summary: row.summary,
    skills: row.skills,
    experience: row.experience.map((e) => ({
      title: e.title,
      company: e.company,
      description: e.description,
    })),
    preferences: {
      locations: row.locations,
      remote: row.remote,
      seniority: row.seniority ?? undefined,
    },
  };
}

const includeExperience = {
  experience: { select: { title: true, company: true, description: true } },
} as const;

/** Crea un perfil nuevo o actualiza uno existente (reemplazando su experiencia). */
export async function saveProfile(
  input: Omit<Profile, 'id'> & { id?: string },
): Promise<Profile> {
  const scalar = {
    headline: input.headline,
    summary: input.summary,
    skills: input.skills,
    locations: input.preferences.locations,
    remote: input.preferences.remote,
    seniority: input.preferences.seniority ?? null,
  };
  const experienceCreate = input.experience.map((e) => ({
    title: e.title,
    company: e.company,
    description: e.description,
  }));

  if (input.id) {
    // Reemplazo total de la experiencia para reflejar el estado enviado.
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

export async function getProfile(id: string): Promise<Profile | null> {
  const row = await prisma.profile.findUnique({
    where: { id },
    include: includeExperience,
  });
  return row ? toDomain(row) : null;
}

export async function listProfiles(): Promise<Profile[]> {
  const rows = await prisma.profile.findMany({ include: includeExperience });
  return rows.map(toDomain);
}
