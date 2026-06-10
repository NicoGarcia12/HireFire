/** Preferencias usadas para orientar búsquedas y ranking sin depender de HTTP ni Prisma. */
export interface ProfilePreferences {
  locations: string[];
  remote: boolean;
  seniority?: string;
}
