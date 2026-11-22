import 'server-only';

import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma-client';

export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      isActive: true,
      sessionVersion: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  if (user.sessionVersion !== session.user.sessionVersion) {
    return null;
  }

  return user;
}
