import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth/currentUser';
import { ApiError, respondError } from '@/lib/questionnaire/api';
import { publishQuestionnaire } from '@/lib/services/questionnaireService';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const { id } = await context.params;
    const data = await publishQuestionnaire(id, user);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return respondError(error);
  }
}
