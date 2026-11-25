import { connection, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth/currentUser';
import { ApiError, respondError } from '@/lib/questionnaire/api';
import { questionnaireInputSchema } from '@/lib/questionnaire/validationSchemas';
import {
  getQuestionnaire,
  updateQuestionnaire,
  deleteDraft,
} from '@/lib/services/questionnaireService';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  await connection();

  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const { id } = await context.params;
    const data = await getQuestionnaire(id, user);

    return NextResponse.json(
      { success: true, data },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return respondError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const { id } = await context.params;
    const body: unknown = await request.json();
    const input = questionnaireInputSchema.parse(body);

    const data = await updateQuestionnaire(id, user, input);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return respondError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const { id } = await context.params;
    const data = await deleteDraft(id, user);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return respondError(error);
  }
}
