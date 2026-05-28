const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@xwz.rw';
  const attendantEmail = 'attendant@xwz.rw';

  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminExists) {
    await prisma.user.create({
      data: {
        firstName: 'System',
        lastName: 'Admin',
        email: adminEmail,
        password: await bcrypt.hash('Admin@123', 12),
        role: 'admin',
        isVerified: true,
      },
    });
    console.log('Seeded admin: admin@xwz.rw / Admin@123');
  }

  const attendantExists = await prisma.user.findUnique({ where: { email: attendantEmail } });
  if (!attendantExists) {
    await prisma.user.create({
      data: {
        firstName: 'Jean',
        lastName: 'Mukamana',
        email: attendantEmail,
        password: await bcrypt.hash('Attendant@123', 12),
        role: 'parking_attendant',
        isVerified: true,
      },
    });
    console.log('Seeded attendant: attendant@xwz.rw / Attendant@123');
  }

  const parkingCount = await prisma.parking.count();
  if (parkingCount === 0) {
    await prisma.parking.createMany({
      data: [
        {
          code: 'KGL-01',
          name: 'Kigali City Center Parking',
          totalSpaces: 100,
          availableSpaces: 100,
          location: 'KN 4 Ave, Kigali',
          feePerHour: 500,
        },
        {
          code: 'KGL-02',
          name: 'Remera Market Parking',
          totalSpaces: 50,
          availableSpaces: 50,
          location: 'Remera, Kigali',
          feePerHour: 300,
        },
      ],
    });
    console.log('Seeded sample parkings: KGL-01, KGL-02');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
