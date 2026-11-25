import { Role } from '@/generated/prisma/enums';

export function hasRole(
  currentRole: Role,
  allowedRoles: readonly Role[],
): boolean {
  return allowedRoles.includes(currentRole);
}

export function canAccessDepartment(
  role: Role,
  userDepartmentId: string | null,
  targetDepartmentId: string,
): boolean {
  if (role === Role.PRINCIPAL) {
    return true;
  }

  if (role === Role.HOD || role === Role.COORDINATOR) {
    return userDepartmentId !== null && userDepartmentId === targetDepartmentId;
  }

  return false;
}
