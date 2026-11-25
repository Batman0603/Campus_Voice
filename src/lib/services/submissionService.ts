import 'server-only';

import { Prisma } from '@/generated/prisma/client';
import { QuestionnaireStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/db/prisma-client';
import { ApiError } from '@/lib/questionnaire/api';

import {
  canAssignRespondent,
  isEligibleRespondent,
} from '@/lib/submission/eligibility';

import { type SubmissionInput } from '@/lib/submission/validationSchemas';

import {
  SubmissionValidationError,
  validateSubmissionAnswers,
} from '@/lib/submission/validateAnswers';

type CurrentUser = {
  id: string;
  role: import('@/generated/prisma/enums').Role;
  departmentId: string | null;
};

const questionnaireGraph = {
  sections: {
    orderBy: { position: 'asc' },
    include: {
      questions: {
        orderBy: { position: 'asc' },
        include: {
          options: {
            orderBy: { position: 'asc' },
          },
        },
      },
    },
  },
} as const satisfies Prisma.QuestionnaireInclude;

export async function assignRespondent(
  questionnaireId: string,
  actor: CurrentUser,
  targetUserId: string,
) {
  const questionnaire = await prisma.questionnaire.findUnique({
    where: { id: questionnaireId },
  });

  if (!questionnaire) {
    throw new ApiError(404, 'NOT_FOUND', 'Questionnaire not found');
  }

  if (!canAssignRespondent(actor.id, questionnaire.createdById)) {
    throw new ApiError(403, 'FORBIDDEN', 'Assignment not permitted');
  }

  if (questionnaire.status !== QuestionnaireStatus.PUBLISHED) {
    throw new ApiError(409, 'NOT_PUBLISHED', 'Questionnaire is not published');
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      role: true,
      departmentId: true,
      isActive: true,
    },
  });

  if (!target || !target.isActive) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'Eligible user not found');
  }

  if (!isEligibleRespondent(questionnaire.purpose, target.role)) {
    throw new ApiError(403, 'INELIGIBLE_ROLE', 'User is not eligible');
  }

  // Initial school-scope policy:
  // If a questionnaire belongs to a department,
  // only respondents from that department are eligible.
  if (
    questionnaire.departmentId !== null &&
    questionnaire.departmentId !== target.departmentId
  ) {
    throw new ApiError(
      403,
      'DEPARTMENT_MISMATCH',
      'User is outside the questionnaire department',
    );
  }

  try {
    return await prisma.questionnaireAssignment.create({
      data: {
        questionnaireId,
        userId: target.id,
        assignedById: actor.id,
      },
      select: {
        id: true,
        questionnaireId: true,
        assignedAt: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ApiError(
        409,
        'ALREADY_ASSIGNED',
        'This user is already assigned',
      );
    }

    throw error;
  }
}

async function getAssignment(questionnaireId: string, userId: string) {
  const assignment = await prisma.questionnaireAssignment.findUnique({
    where: {
      questionnaireId_userId: {
        questionnaireId,
        userId,
      },
    },
    select: {
      id: true,
      submission: {
        select: { id: true },
      },
    },
  });

  if (!assignment) {
    throw new ApiError(
      404,
      'ASSIGNMENT_NOT_FOUND',
      'No questionnaire assignment found',
    );
  }

  return assignment;
}

export async function getAssignedQuestionnaire(
  questionnaireId: string,
  user: CurrentUser,
) {
  const assignment = await getAssignment(questionnaireId, user.id);

  const questionnaire = await prisma.questionnaire.findUnique({
    where: { id: questionnaireId },
    include: questionnaireGraph,
  });

  if (!questionnaire) {
    throw new ApiError(404, 'NOT_FOUND', 'Questionnaire not found');
  }

  if (!isEligibleRespondent(questionnaire.purpose, user.role)) {
    throw new ApiError(403, 'FORBIDDEN', 'Not eligible to respond');
  }

  if (questionnaire.status !== QuestionnaireStatus.PUBLISHED) {
    throw new ApiError(409, 'NOT_PUBLISHED', 'Questionnaire is not open');
  }

  return {
    id: questionnaire.id,
    title: questionnaire.title,
    description: questionnaire.description,
    purpose: questionnaire.purpose,
    sections: questionnaire.sections,
    alreadySubmitted: assignment.submission !== null,
  };
}

export async function submitFeedback(
  questionnaireId: string,
  user: CurrentUser,
  input: SubmissionInput,
) {
  const assignment = await getAssignment(questionnaireId, user.id);

  if (assignment.submission) {
    throw new ApiError(
      409,
      'ALREADY_SUBMITTED',
      'Feedback has already been submitted',
    );
  }

  const questionnaire = await prisma.questionnaire.findUnique({
    where: { id: questionnaireId },
    include: questionnaireGraph,
  });

  if (!questionnaire) {
    throw new ApiError(404, 'NOT_FOUND', 'Questionnaire not found');
  }

  if (questionnaire.status !== QuestionnaireStatus.PUBLISHED) {
    throw new ApiError(409, 'NOT_PUBLISHED', 'Questionnaire is not open');
  }

  if (!isEligibleRespondent(questionnaire.purpose, user.role)) {
    throw new ApiError(403, 'FORBIDDEN', 'Not eligible to respond');
  }

  let validAnswers: SubmissionInput['answers'];

  try {
    validAnswers = validateSubmissionAnswers(questionnaire.sections, input);
  } catch (error) {
    if (error instanceof SubmissionValidationError) {
      throw new ApiError(422, 'INVALID_ANSWERS', error.message);
    }

    throw error;
  }

  try {
    return await prisma.feedbackSubmission.create({
      data: {
        assignmentId: assignment.id,
        answers: {
          create: validAnswers.map((answer) => ({
            questionId: answer.questionId,
            value: answer.value,
          })),
        },
      },
      select: {
        id: true,
        submittedAt: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ApiError(
        409,
        'ALREADY_SUBMITTED',
        'Feedback has already been submitted',
      );
    }

    throw error;
  }
}

export async function getMySubmission(questionnaireId: string, userId: string) {
  const assignment = await prisma.questionnaireAssignment.findUnique({
    where: {
      questionnaireId_userId: {
        questionnaireId,
        userId,
      },
    },
    select: {
      submission: {
        select: {
          id: true,
          submittedAt: true,
          answers: {
            select: {
              questionId: true,
              value: true,
            },
          },
        },
      },
    },
  });

  if (!assignment?.submission) {
    throw new ApiError(404, 'NOT_FOUND', 'Submission not found');
  }

  return assignment.submission;
}
