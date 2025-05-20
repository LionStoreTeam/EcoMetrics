// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Declaración para evitar múltiples instancias de PrismaClient en desarrollo con HMR
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | PrismaClient;
}

const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    // Opcional: puedes añadir logging aquí si lo necesitas para depurar
    // log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
