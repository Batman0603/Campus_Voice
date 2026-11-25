import { connection, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth/currentUser';

export async function GET() {
  // Authentication depends on request-time headers.
  // Prevent Next.js from attempting to prerender this route.
  await connection();

  try {
    const user = await getCurrentUser();

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

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
          isActive: user.isActive,
          sessionVersion: user.sessionVersion,
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
    console.error('Failed to retrieve current user:', error);

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
