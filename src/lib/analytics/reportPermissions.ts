import { Role } from '@/generated/prisma/enums';

export type ReportActor = {
  id: string;
  role: Role;
  departmentId: string | null;
};

export type ReportScope =
  { kind: 'department'; departmentId: string } | { kind: 'school' };

export function canAccessReport(
  actor: ReportActor,
  scope: ReportScope,
): boolean {
  if (scope.kind === 'school') {
    return actor.role === Role.PRINCIPAL;
  }

  const departmentRole =
    actor.role === Role.HOD || actor.role === Role.COORDINATOR;

  return (
    departmentRole &&
    actor.departmentId !== null &&
    actor.departmentId === scope.departmentId
  );
}
