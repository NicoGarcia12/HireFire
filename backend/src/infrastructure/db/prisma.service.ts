import { PrismaClient } from '@prisma/client';

/**
 * Prisma singleton de infraestructura.
 * Reusa la instancia durante hot reload para evitar agotar conexiones en desarrollo.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
