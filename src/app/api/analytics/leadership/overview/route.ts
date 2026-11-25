import { connection, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth/currentUser';
import { ApiError, respondError } from '@/lib/questionnaire/api';
import { getScopedReport } from '@/lib/services/reportingService';

export async function GET() {
  await connection();

  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const data = await getScopedReport({ kind: 'school' }, user);

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': 'private, no-store',
        },
      },
    );
  } catch (error) {
    return respondError(error);
  }
}
