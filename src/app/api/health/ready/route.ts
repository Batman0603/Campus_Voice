import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma-client';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: 'ready',
        checks: {
          database: 'ok',
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    console.error('Database readiness check failed:', error);

    return NextResponse.json(
      {
        status: 'not_ready',
        checks: {
          database: 'unavailable',
        },
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  }
}
