import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const sharedCarts = await prisma.sharedCart.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, businessId: true }
  })
  console.log(JSON.stringify(sharedCarts, null, 2))
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
