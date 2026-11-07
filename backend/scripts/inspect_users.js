const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, fullName: true, email: true, source: true, role: true }
  });
  console.log('--- ALL USERS IN DB ---');
  console.table(users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
