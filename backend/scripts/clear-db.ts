import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Cleaning up all database records...');
  
  // Delete in reverse dependency order
  await prisma.teamMember.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.vendorService.deleteMany({});
  await prisma.vendorDocument.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.vendorProfile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.subCategory.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.mainCategory.deleteMany({});
  
  console.log('✅ Database cleared successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error clearing database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
