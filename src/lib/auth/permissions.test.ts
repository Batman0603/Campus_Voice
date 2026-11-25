import assert from 'node:assert/strict';
import test from 'node:test';

import { Role } from '@/generated/prisma/enums';
import { hasRole, canAccessDepartment } from './permissions';

test('Admin has the required role', () => {
  assert.equal(hasRole(Role.ADMIN, [Role.ADMIN]), true);
});

test('Student cannot access Admin role', () => {
  assert.equal(hasRole(Role.STUDENT, [Role.ADMIN]), false);
});

test('HOD can access own department', () => {
  assert.equal(canAccessDepartment(Role.HOD, 'science', 'science'), true);
});

test('HOD cannot access another department', () => {
  assert.equal(canAccessDepartment(Role.HOD, 'science', 'maths'), false);
});

test('HOD without department has no scope', () => {
  assert.equal(canAccessDepartment(Role.HOD, null, 'science'), false);
});

test('Teacher has no departmental report access', () => {
  assert.equal(canAccessDepartment(Role.TEACHER, 'science', 'science'), false);
});
