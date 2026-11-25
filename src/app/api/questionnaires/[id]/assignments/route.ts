
import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth/currentUser';
import { ApiError, respondError } from '@/lib/questionnaire/api';
import { assignRespondentSchema } from '@/lib/submission/validationSchemas';
import { assignRespondent } from '@/lib/services/submissionService';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new ApiError(
        401, 'UNAUTHORIZED', 'Authentication required'
      );
    }

    const { id } = await context.params;
    const body: unknown = await request.json();
    const input = assignRespondentSchema.parse(body);

    const data = await assignRespondent(
      id, user, input.userId
    );

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    );
  } catch (error) {
    return respondError(error);
  }
}
