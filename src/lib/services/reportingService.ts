import 'server-only';

import { QuestionnaireStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/db/prisma-client';
import { ApiError } from '@/lib/questionnaire/api';
import {
  canAccessReport,
  type ReportActor,
  type ReportScope,
} from '@/lib/analytics/reportPermissions';
import {
  calculateResponseRate,
  MIN_REPORTING_GROUP_SIZE,
} from '@/lib/analytics/aggregateResponses';

const MAX_REPORT_QUESTIONNAIRES = 500;

export async function getScopedReport(scope: ReportScope, actor: ReportActor) {
  // Authorization must happen before the data query.
  if (!canAccessReport(actor, scope)) {
    throw new ApiError(404, 'NOT_FOUND', 'Analytics report not found');
  }

  let department: { id: string; name: string; code: string } | null = null;

  if (scope.kind === 'department') {
    department = await prisma.department.findUnique({
      where: { id: scope.departmentId },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    if (!department) {
      throw new ApiError(404, 'NOT_FOUND', 'Analytics report not found');
    }
  }

  const questionnaires = await prisma.questionnaire.findMany({
    where: {
      status: {
        in: [QuestionnaireStatus.PUBLISHED, QuestionnaireStatus.ARCHIVED],
      },
      ...(scope.kind === 'department'
        ? { departmentId: scope.departmentId }
        : {}),
    },
    select: {
      id: true,
      title: true,
      purpose: true,
      status: true,
      assignments: {
        select: {
          submission: {
            select: { id: true },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: MAX_REPORT_QUESTIONNAIRES + 1,
  });

  // Never silently return a truncated report.
  if (questionnaires.length > MAX_REPORT_QUESTIONNAIRES) {
    throw new ApiError(
      413,
      'REPORT_TOO_LARGE',
      'Report exceeds the current questionnaire limit',
    );
  }

  const rows = questionnaires.map((questionnaire) => {
    const assigned = questionnaire.assignments.length;

    const submitted = questionnaire.assignments.filter(
      (assignment) => assignment.submission !== null,
    ).length;

    // Hide all respondent statistics when the
    // reporting cohort is too small.
    const suppressed =
      assigned < MIN_REPORTING_GROUP_SIZE ||
      submitted < MIN_REPORTING_GROUP_SIZE;

    return {
      questionnaireId: questionnaire.id,
      title: questionnaire.title,
      purpose: questionnaire.purpose,
      status: questionnaire.status,
      suppressed,
      totalAssigned: suppressed ? null : assigned,
      totalSubmitted: suppressed ? null : submitted,
      totalPending: suppressed ? null : assigned - submitted,
      responseRate: suppressed
        ? null
        : calculateResponseRate(assigned, submitted),
    };
  });

  return {
    scope:
      scope.kind === 'school'
        ? {
            type: 'SCHOOL' as const,
            department: null,
          }
        : {
            type: 'DEPARTMENT' as const,
            department,
          },
    summary: {
      totalQuestionnaires: rows.length,
      publishedQuestionnaires: rows.filter(
        (row) => row.status === QuestionnaireStatus.PUBLISHED,
      ).length,
      archivedQuestionnaires: rows.filter(
        (row) => row.status === QuestionnaireStatus.ARCHIVED,
      ).length,
      suppressedQuestionnaires: rows.filter((row) => row.suppressed).length,
    },
    reporting: {
      minimumGroupSize: MIN_REPORTING_GROUP_SIZE,
      rawTextIncluded: false,
      identitiesIncluded: false,
    },
    questionnaires: rows,
  };
}

export type ScopedReport = Awaited<ReturnType<typeof getScopedReport>>;
