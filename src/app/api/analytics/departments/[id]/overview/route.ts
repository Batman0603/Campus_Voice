import { connection, NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth/currentUser';
import { ApiError, respondError } from '@/lib/questionnaire/api';
import { getScopedReport } from '@/lib/services/reportingService';

const departmentIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: Context) {
  await connection();

  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const { id } = await context.params;
    const departmentId = departmentIdSchema.parse(id);

    const data = await getScopedReport(
      { kind: 'department', departmentId },
      user,
    );

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
