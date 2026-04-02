import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
let prisma: PrismaClient

if (connectionString) {
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
} else {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export default prisma
