import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create default admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        passwordHash: adminPassword,
        fullName: 'System Admin',
        role: 'ADMIN',
        status: 'ACTIVE'
      },
    });

    // Create default plans
    const starterPlan = await prisma.plan.upsert({
      where: { id: 'starter-plan' },
      update: {},
      create: {
        id: 'starter-plan',
        name: 'Starter',
        description: 'Perfect for small projects',
        cpu: 1,
        ram: 2,
        storage: 20,
        bandwidth: 1000,
        price: 10.00,
        billingCycle: 'MONTHLY',
      },
    });

    const professionalPlan = await prisma.plan.upsert({
      where: { id: 'professional-plan' },
      update: {},
      create: {
        id: 'professional-plan',
        name: 'Professional',
        description: 'Ideal for growing applications',
        cpu: 2,
        ram: 4,
        storage: 50,
        bandwidth: 2000,
        price: 20.00,
        billingCycle: 'MONTHLY',
      },
    });

    const enterprisePlan = await prisma.plan.upsert({
      where: { id: 'enterprise-plan' },
      update: {},
      create: {
        id: 'enterprise-plan',
        name: 'Enterprise',
        description: 'For demanding workloads',
        cpu: 4,
        ram: 8,
        storage: 100,
        bandwidth: 5000,
        price: 40.00,
        billingCycle: 'MONTHLY',
      },
    });

    console.log('Seed completed successfully');
    console.log({
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      },
      plans: [
        {
          id: starterPlan.id,
          name: starterPlan.name
        },
        {
          id: professionalPlan.id,
          name: professionalPlan.name
        },
        {
          id: enterprisePlan.id,
          name: enterprisePlan.name
        }
      ]
    });
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });