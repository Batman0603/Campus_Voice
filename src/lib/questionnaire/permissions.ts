
import {
  Role,
  QuestionnairePurpose,
  QuestionnaireStatus,
} from '@/generated/prisma/enums';

export type Actor = {
  id: string;
  role: Role;
  departmentId: string | null;
};

export type QuestionnaireAccess = {
  createdById: string;
  departmentId: string | null;
  status: QuestionnaireStatus;
};

const CREATE_PURPOSES: Partial<
  Record<Role, readonly QuestionnairePurpose[]>
> = {
  TEACHER: [
    QuestionnairePurpose.STUDENT_VOICE,
    QuestionnairePurpose.TEACHER_REFLECTION,
  ],
  SEN: [QuestionnairePurpose.SEN],
  HOD: [
    QuestionnairePurpose.STUDENT_VOICE,
    QuestionnairePurpose.HOD_CHECK,
    QuestionnairePurpose.LEADERSHIP_REPORT,
  ],
  COORDINATOR: [QuestionnairePurpose.HOD_CHECK],
};

export function canCreate(
  actor: Actor,
  purpose: QuestionnairePurpose
): boolean {
  return (CREATE_PURPOSES[actor.role] ?? []).includes(purpose);
}

export function canEdit(
  actor: Actor,
  resource: QuestionnaireAccess
): boolean {
  if (resource.status !== QuestionnaireStatus.DRAFT) {
    return false;
  }

  if (actor.role === Role.TEACHER) {
    return resource.createdById === actor.id;
  }

  if (
    actor.role === Role.HOD ||
    actor.role === Role.COORDINATOR
  ) {
    return actor.departmentId !== null &&
      resource.departmentId === actor.departmentId;
  }

  return false;
}

export function canRead(
  actor: Actor,
  resource: QuestionnaireAccess
): boolean {
  if (resource.createdById === actor.id) return true;
  if (canEdit(actor, resource)) return true;

  if (
    resource.status === QuestionnaireStatus.PUBLISHED &&
    actor.role === Role.PRINCIPAL
  ) {
    return true;
  }

  if (
    resource.status === QuestionnaireStatus.PUBLISHED &&
    (
      actor.role === Role.HOD ||
      actor.role === Role.COORDINATOR
    )
  ) {
    return actor.departmentId !== null &&
      actor.departmentId === resource.departmentId;
  }

  return false;
}

export function canPublish(
  actor: Actor,
  resource: QuestionnaireAccess,
): boolean {
  if (resource.status !== QuestionnaireStatus.DRAFT) {
    return false;
  }

  if (actor.role === Role.SEN && resource.createdById === actor.id) {
    return true;
  }

  return canEdit(actor, resource);
}
