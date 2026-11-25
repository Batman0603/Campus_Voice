import 'server-only';

import { Prisma } from '@/generated/prisma/client';
import { QuestionnaireStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/db/prisma-client';

import {
  canCreate,
  canEdit,
  canPublish,
  canRead,
  type Actor,
} from '@/lib/questionnaire/permissions';

import {
  hasAmbiguousBranching,
  type QuestionnaireInput,
} from '@/lib/questionnaire/validationSchemas';

import { ApiError } from '@/lib/questionnaire/api';

const graphInclude = {
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

function sectionWrites(input: QuestionnaireInput) {
  return input.sections.map((section, position) => ({
    title: section.title,
    description: section.description ?? null,
    position,
    questions: {
      create: section.questions.map((question, questionPosition) => ({
        title: question.title,
        type: question.type,
        required: question.required,
        position: questionPosition,
        options: {
          create: question.options.map((option, optionPosition) => ({
            label: option.label,
            value: option.value,
            position: optionPosition,
            nextSectionPosition: option.nextSectionPosition ?? null,
          })),
        },
      })),
    },
  }));
}

async function findAccessible(id: string, actor: Actor) {
  const questionnaire = await prisma.questionnaire.findUnique({
    where: { id },
    include: graphInclude,
  });

  if (!questionnaire || !canRead(actor, questionnaire)) {
    throw new ApiError(404, 'NOT_FOUND', 'Questionnaire not found');
  }

  return questionnaire;
}

export async function listQuestionnaires(actor: Actor) {
  const all = await prisma.questionnaire.findMany({
    where: {
      OR: [
        { createdById: actor.id },
        ...(actor.departmentId &&
        (actor.role === 'HOD' || actor.role === 'COORDINATOR')
          ? [
              {
                departmentId: actor.departmentId,
              },
            ]
          : []),
        ...(actor.role === 'PRINCIPAL'
          ? [{ status: QuestionnaireStatus.PUBLISHED }]
          : []),
      ],
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  return all.filter((q) => canRead(actor, q));
}

export async function getQuestionnaire(id: string, actor: Actor) {
  return findAccessible(id, actor);
}

export async function createQuestionnaire(
  actor: Actor,
  input: QuestionnaireInput,
) {
  if (!canCreate(actor, input.purpose)) {
    throw new ApiError(403, 'FORBIDDEN', 'Creation not permitted');
  }

  if (
    (actor.role === 'HOD' || actor.role === 'COORDINATOR') &&
    !actor.departmentId
  ) {
    throw new ApiError(
      403,
      'DEPARTMENT_REQUIRED',
      'A department assignment is required',
    );
  }

  return prisma.questionnaire.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      purpose: input.purpose,
      createdById: actor.id,
      departmentId: actor.departmentId,
      sections: {
        create: sectionWrites(input),
      },
    },
    include: graphInclude,
  });
}

export async function updateQuestionnaire(
  id: string,
  actor: Actor,
  input: QuestionnaireInput,
) {
  const current = await findAccessible(id, actor);

  if (!canEdit(actor, current)) {
    throw new ApiError(403, 'FORBIDDEN', 'Editing not permitted');
  }

  if (current.purpose !== input.purpose) {
    throw new ApiError(
      400,
      'PURPOSE_IMMUTABLE',
      'Questionnaire purpose cannot be changed',
    );
  }

  return prisma.$transaction(async (tx) => {
    const lock = await tx.questionnaire.updateMany({
      where: { id, status: QuestionnaireStatus.DRAFT },
      data: { updatedAt: new Date() },
    });

    if (lock.count !== 1) {
      throw new ApiError(409, 'CONFLICT', 'Draft is no longer editable');
    }

    // Cascade deletes questions and options as well.
    await tx.questionnaireSection.deleteMany({
      where: { questionnaireId: id },
    });

    return tx.questionnaire.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description ?? null,
        sections: {
          create: sectionWrites(input),
        },
      },
      include: graphInclude,
    });
  });
}

export async function publishQuestionnaire(id: string, actor: Actor) {
  const current = await findAccessible(id, actor);

  if (!canPublish(actor, current)) {
    throw new ApiError(403, 'FORBIDDEN', 'Publishing not permitted');
  }

  return prisma.$transaction(async (tx) => {
    // Draft edits lock this same row before replacing the graph.
    const updated = await tx.questionnaire.updateMany({
      where: { id, status: QuestionnaireStatus.DRAFT },
      data: {
        status: QuestionnaireStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    if (updated.count !== 1) {
      throw new ApiError(409, 'CONFLICT', 'Questionnaire was changed');
    }

    const published = await tx.questionnaire.findUniqueOrThrow({
      where: { id },
      include: graphInclude,
    });

    if (
      published.sections.length === 0 ||
      published.sections.some((section) => section.questions.length === 0)
    ) {
      throw new ApiError(
        400,
        'INCOMPLETE_QUESTIONNAIRE',
        'Every published section must contain questions',
      );
    }

    if (published.sections.some(hasAmbiguousBranching)) {
      throw new ApiError(
        400,
        'AMBIGUOUS_BRANCHING',
        'Only one question per section may define branching',
      );
    }

    return published;
  });
}

export async function archiveQuestionnaire(id: string, actor: Actor) {
  const current = await findAccessible(id, actor);

  // Archiving a published form requires the same ownership
  // or departmental authority used for managing drafts.
  const manager = canEdit(actor, {
    ...current,
    status: QuestionnaireStatus.DRAFT,
  });

  if (!manager) {
    throw new ApiError(403, 'FORBIDDEN', 'Archiving not permitted');
  }

  const updated = await prisma.questionnaire.updateMany({
    where: {
      id,
      status: QuestionnaireStatus.PUBLISHED,
    },
    data: { status: QuestionnaireStatus.ARCHIVED },
  });

  if (updated.count !== 1) {
    throw new ApiError(
      409,
      'CONFLICT',
      'Only published questionnaires can be archived',
    );
  }

  return prisma.questionnaire.findUniqueOrThrow({
    where: { id },
  });
}

export async function deleteDraft(id: string, actor: Actor) {
  const current = await findAccessible(id, actor);

  if (!canEdit(actor, current)) {
    throw new ApiError(403, 'FORBIDDEN', 'Deletion not permitted');
  }

  const deleted = await prisma.questionnaire.deleteMany({
    where: { id, status: QuestionnaireStatus.DRAFT },
  });

  if (deleted.count !== 1) {
    throw new ApiError(409, 'CONFLICT', 'Draft is no longer deletable');
  }

  return { deleted: true };
}
