import { QuestionnairePurpose, Role } from '@/generated/prisma/enums';

const RESPONDENT_ROLES: Record<QuestionnairePurpose, readonly Role[]> = {
  STUDENT_VOICE: [Role.STUDENT],
  TEACHER_REFLECTION: [Role.TEACHER],
  SEN: [Role.SEN],
  HOD_CHECK: [Role.HOD, Role.COORDINATOR],
  LEADERSHIP_REPORT: [Role.PRINCIPAL],
};

export function isEligibleRespondent(
  purpose: QuestionnairePurpose,
  role: Role,
): boolean {
  return RESPONDENT_ROLES[purpose].includes(role);
}

export function canAssignRespondent(
  actorId: string,
  questionnaireCreatorId: string,
): boolean {
  return actorId === questionnaireCreatorId;
}
