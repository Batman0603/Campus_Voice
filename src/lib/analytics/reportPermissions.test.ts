import assert from 'node:assert/strict';
import test from 'node:test';

import { Role } from '@/generated/prisma/enums';
import { canAccessReport, type ReportActor } from './reportPermissions';

const actor = (
  role: Role,
  departmentId: string | null = 'math',
): ReportActor => ({
  id: 'test-user',
  role,
  departmentId,
});

test('HOD can access own department', () => {
  assert.equal(
    canAccessReport(actor(Role.HOD), {
      kind: 'department',
      departmentId: 'math',
    }),
    true,
  );
});

test('HOD cannot access another department', () => {
  assert.equal(
    canAccessReport(actor(Role.HOD), {
      kind: 'department',
      departmentId: 'science',
    }),
    false,
  );
});

test('Coordinator can access own department', () => {
  assert.equal(
    canAccessReport(actor(Role.COORDINATOR), {
      kind: 'department',
      departmentId: 'math',
    }),
    true,
  );
});

test('Coordinator cannot access another department', () => {
  assert.equal(
    canAccessReport(actor(Role.COORDINATOR), {
      kind: 'department',
      departmentId: 'science',
    }),
    false,
  );
});

test('HOD without a department is denied', () => {
  assert.equal(
    canAccessReport(actor(Role.HOD, null), {
      kind: 'department',
      departmentId: 'math',
    }),
    false,
  );
});

test('Principal may access school reporting', () => {
  assert.equal(
    canAccessReport(actor(Role.PRINCIPAL, null), {
      kind: 'school',
    }),
    true,
  );
});

test('Principal cannot use departmental endpoint', () => {
  assert.equal(
    canAccessReport(actor(Role.PRINCIPAL), {
      kind: 'department',
      departmentId: 'math',
    }),
    false,
  );
});

test('Student cannot access any reporting', () => {
  assert.equal(
    canAccessReport(actor(Role.STUDENT), {
      kind: 'department',
      departmentId: 'math',
    }),
    false,
  );

  assert.equal(
    canAccessReport(actor(Role.STUDENT), {
      kind: 'school',
    }),
    false,
  );
});

test('Teacher cannot access leadership reporting', () => {
  assert.equal(
    canAccessReport(actor(Role.TEACHER), {
      kind: 'school',
    }),
    false,
  );
});
