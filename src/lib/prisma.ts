import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function resolveDatasourceUrl() {
  const pooled = process.env.DATABASE_URL?.trim();
  const direct = process.env.DATABASE_URL_UNPOOLED?.trim();

  // Local development is usually more stable with direct connections.
  // Production should still prefer pooled connections.
  if (process.env.NODE_ENV === "production") {
    return pooled || direct;
  }
  return direct || pooled;
}

const datasourceUrl = resolveDatasourceUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["warn"] : [],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
