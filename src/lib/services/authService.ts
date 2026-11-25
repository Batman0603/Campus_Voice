import 'server-only';

import argon2 from 'argon2';
import { prisma } from '@/lib/db/prisma-client';
import type { LoginInput } from '@/lib/auth/validationSchemas';

export async function authenticateUser(credentials: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      isActive: true,
      sessionVersion: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const validPassword = await argon2.verify(
    user.passwordHash,
    credentials.password,
  );

  if (!validPassword) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    sessionVersion: user.sessionVersion,
  };
}
