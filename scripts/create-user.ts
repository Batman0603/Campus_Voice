import 'dotenv/config';

import argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { Role } from '../src/generated/prisma/enums';
import { z } from 'zod';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured');
}

// Standalone Prisma client for this CLI script.
// Do not import the Next.js server-only Prisma wrapper.
const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({ adapter });

const createUserSchema = z.object({
  email: z.email().trim().toLowerCase(),
  name: z.string().trim().min(2),
  role: z.enum(Role),
  password: z.string().min(12),
});

async function main() {
  const [email, role, ...nameParts] = process.argv.slice(2);

  const input = createUserSchema.parse({
    email,
    role,
    name: nameParts.join(' '),
    password: process.env.CAMPUSVOICE_INITIAL_PASSWORD,
  });

  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new Error('User already exists');
  }

  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  console.log('User created successfully:', user);
}

main()
  .catch((error: unknown) => {
    console.error('Failed to create user:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
