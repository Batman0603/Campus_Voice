import { connection, NextResponse } from 'next/server';

import { Role } from '@/generated/prisma/enums';
import { getCurrentUser } from '@/lib/auth/currentUser';

export async function GET() {
  // Only evaluate authentication during a real request.
  await connection();

  try {
    const user = await getCurrentUser();

    // 401: User is not authenticated.
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 },
      );
    }

    // 403: Authenticated, but not an administrator.
    if (user.role !== Role.ADMIN) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          message: 'Admin access granted',
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    console.error('Admin overview failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Unable to process request',
        },
      },
      { status: 500 },
    );
  }
}
