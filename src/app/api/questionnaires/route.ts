
import { connection, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth/currentUser';
import { ApiError, respondError } from '@/lib/questionnaire/api';
import { questionnaireInputSchema } from '@/lib/questionnaire/validationSchemas';
import {
  createQuestionnaire,
  listQuestionnaires,
} from '@/lib/services/questionnaireService';

export async function GET() {
  await connection();

  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const data = await listQuestionnaires(user);

    return NextResponse.json(
      { success: true, data },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return respondError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const body: unknown = await request.json();
    const input = questionnaireInputSchema.parse(body);

    const data = await createQuestionnaire(user, input);

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    );
  } catch (error) {
    return respondError(error);
  }
}
