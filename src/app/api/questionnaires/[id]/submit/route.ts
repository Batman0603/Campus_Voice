import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth/currentUser';
import { ApiError, respondError } from '@/lib/questionnaire/api';
import { submissionSchema } from '@/lib/submission/validationSchemas';
import { submitFeedback } from '@/lib/services/submissionService';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const { id } = await context.params;
    const body: unknown = await request.json();
    const input = submissionSchema.parse(body);

    const data = await submitFeedback(id, user, input);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return respondError(error);
  }
}
