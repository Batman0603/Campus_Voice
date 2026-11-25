import 'server-only';

import { prisma } from '@/lib/db/prisma-client';
import {
  MIN_REPORTING_GROUP_SIZE,
  aggregateQuestion,
  calculateResponseRate,
} from '@/lib/analytics/aggregateResponses';
import { ApiError } from '@/lib/questionnaire/api';
import type { Actor } from '@/lib/questionnaire/permissions';

export async function getQuestionnaireAnalytics(
  questionnaireId: string,
  actor: Actor,
) {
  const questionnaire = await prisma.questionnaire.findUnique({
    where: { id: questionnaireId },
    select: {
      id: true,
      title: true,
      purpose: true,
      status: true,
      createdById: true,
      sections: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          title: true,
          questions: {
            orderBy: { position: 'asc' },
            select: {
              id: true,
              title: true,
              type: true,
              options: {
                orderBy: { position: 'asc' },
                select: {
                  value: true,
                  label: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Do not reveal whether an inaccessible questionnaire exists.
  if (!questionnaire || questionnaire.createdById !== actor.id) {
    throw new ApiError(404, 'NOT_FOUND', 'Questionnaire analytics not found');
  }

  const assignments = await prisma.questionnaireAssignment.findMany({
    where: { questionnaireId },
    select: {
      submission: {
        select: {
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

  const totalAssigned = assignments.length;

  const submissions = assignments
    .map((assignment) => assignment.submission)
    .filter((submission) => submission !== null);

  const totalSubmitted = submissions.length;

  const allAnswers = submissions.flatMap((submission) => submission.answers);

  const sections = questionnaire.sections.map((section) => ({
    sectionId: section.id,
    title: section.title,
    questions: section.questions.map((question) =>
      aggregateQuestion(question, allAnswers),
    ),
  }));

  return {
    questionnaire: {
      id: questionnaire.id,
      title: questionnaire.title,
      purpose: questionnaire.purpose,
      status: questionnaire.status,
    },
    summary: {
      totalAssigned,
      totalSubmitted,
      totalPending: totalAssigned - totalSubmitted,
      responseRate: calculateResponseRate(totalAssigned, totalSubmitted),
    },
    reporting: {
      minimumGroupSize: MIN_REPORTING_GROUP_SIZE,
      rawTextIncluded: false,
    },
    sections,
  };
}
