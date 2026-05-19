import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

const prismaClient = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaClient;
}

let prismaConnectionPromise;

export const db = prismaClient;

export async function ensureDatabaseConnection() {
  if (prismaConnectionPromise) {
    return prismaConnectionPromise;
  }

  prismaConnectionPromise = prismaClient
    .$connect()
    .then(() => prismaClient)
    .catch(error => {
      prismaConnectionPromise = undefined;
      throw error;
    });

  return prismaConnectionPromise;
}

// globalThis.prisma: This global variable ensures that the Prisma client instance is
// reused across hot reloads during development. Without this, each time your application
// reloads, a new instance of the Prisma client would be created, potentially leading
// to connection issues.
