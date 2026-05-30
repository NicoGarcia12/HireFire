import { PrismaClient } from '@prisma/client';

/**
 * Cliente único de Prisma. Se reutiliza la instancia entre recargas en dev
 * (tsx watch) para no agotar el pool de conexiones de PostgreSQL.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
