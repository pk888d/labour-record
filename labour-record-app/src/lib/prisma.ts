import { PrismaClient } from '../generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? 'file:./dev.db'
  // Strip the "file:" prefix to get the file path for the adapter
  const filePath = url.startsWith('file:') ? url.slice(5) : url
  const adapter = new PrismaBetterSqlite3({ url: filePath })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
