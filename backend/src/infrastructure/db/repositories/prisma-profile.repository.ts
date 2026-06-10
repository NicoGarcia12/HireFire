import type { Profile } from '../../../domain/profile/entities/profile.entity.js';
import type { ProfileRepository, SaveProfileEntity } from '../../../domain/profile/interfaces/profile-repository.interface.js';
import { prisma } from '../prisma.service.js';

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

const includeExperience = {
  experience: { select: { title: true, company: true, description: true } },
} as const;

/** Mapea la forma relacional Prisma a la entidad de dominio `Profile`. */
function toDomain(row: ProfileRow): Profile {
  return {
    id: row.id,
    headline: row.headline,
    summary: row.summary,
    skills: row.skills,
    experience: row.experience.map((experience) => ({
      title: experience.title,
      company: experience.company,
      description: experience.description,
    })),
    preferences: {
      locations: row.locations,
      remote: row.remote,
      seniority: row.seniority ?? undefined,
    },
  };
}

export class PrismaProfileRepository implements ProfileRepository {
  /**
   * Crea o actualiza un perfil reemplazando la experiencia completa.
   * El reemplazo conserva el contrato actual del API: el cliente manda el estado final.
   */
  public async save(input: SaveProfileEntity): Promise<Profile> {
    const scalar = {
      headline: input.headline,
      summary: input.summary,
      skills: input.skills,
      locations: input.preferences.locations,
      remote: input.preferences.remote,
      seniority: input.preferences.seniority ?? null,
    };
    const experienceCreate = input.experience.map((experience) => ({
      title: experience.title,
      company: experience.company,
      description: experience.description,
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

  public async findById(id: string): Promise<Profile | null> {
    const row = await prisma.profile.findUnique({ where: { id }, include: includeExperience });
    return row ? toDomain(row) : null;
  }

  public async findMany(): Promise<Profile[]> {
    const rows = await prisma.profile.findMany({ include: includeExperience });
    return rows.map(toDomain);
  }
}

export const profileRepository = new PrismaProfileRepository();
