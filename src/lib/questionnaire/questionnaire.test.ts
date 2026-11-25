import assert from 'node:assert/strict';
import test from 'node:test';

import {
  QuestionType,
  QuestionnairePurpose,
  QuestionnaireStatus,
  Role,
} from '@/generated/prisma/enums';

import { questionnaireInputSchema } from './validationSchemas';
import { canCreate, canEdit, canRead } from './permissions';

const teacher = {
  id: 'teacher-1',
  role: Role.TEACHER,
  departmentId: 'science',
};

const questionnaire = {
  createdById: 'teacher-1',
  departmentId: 'science',
  status: QuestionnaireStatus.DRAFT,
};

test('teacher can create Student Voice', () => {
  assert.equal(canCreate(teacher, QuestionnairePurpose.STUDENT_VOICE), true);
});

test('student cannot create questionnaires', () => {
  assert.equal(
    canCreate(
      { ...teacher, role: Role.STUDENT },
      QuestionnairePurpose.STUDENT_VOICE,
    ),
    false,
  );
});

test('teacher can edit own draft', () => {
  assert.equal(canEdit(teacher, questionnaire), true);
});

test('teacher cannot edit published form', () => {
  assert.equal(
    canEdit(teacher, {
      ...questionnaire,
      status: QuestionnaireStatus.PUBLISHED,
    }),
    false,
  );
});

test('unrelated teacher cannot read private draft', () => {
  assert.equal(canRead({ ...teacher, id: 'teacher-2' }, questionnaire), false);
});

test('valid questionnaire passes', () => {
  const result = questionnaireInputSchema.safeParse({
    title: 'Student Learning Experience',
    purpose: QuestionnairePurpose.STUDENT_VOICE,
    sections: [
      {
        title: 'Experience',
        questions: [
          {
            title: 'How was your experience?',
            type: QuestionType.SINGLE_CHOICE,
            options: [
              { label: 'Good', value: 'good' },
              { label: 'Poor', value: 'poor' },
            ],
          },
        ],
      },
    ],
  });

  assert.equal(result.success, true);
});

test('invalid backward branch is rejected', () => {
  const result = questionnaireInputSchema.safeParse({
    title: 'Branching Example',
    purpose: QuestionnairePurpose.STUDENT_VOICE,
    sections: [
      { title: 'First', questions: [] },
      {
        title: 'Second',
        questions: [
          {
            title: 'Go back?',
            type: QuestionType.YES_NO,
            options: [
              {
                label: 'Yes',
                value: 'yes',
                nextSectionPosition: 0,
              },
              { label: 'No', value: 'no' },
            ],
          },
        ],
      },
    ],
  });

  assert.equal(result.success, false);
});

test('branch targets can share a question but cannot span two questions in one section', () => {
  const branchQuestion = {
    title: 'Choose a section',
    type: QuestionType.SINGLE_CHOICE,
    options: [
      { label: 'First path', value: 'first', nextSectionPosition: 1 },
      { label: 'Second path', value: 'second', nextSectionPosition: 2 },
    ],
  };
  const definition = {
    title: 'Branching questionnaire',
    purpose: QuestionnairePurpose.STUDENT_VOICE,
    sections: [
      { title: 'Start', questions: [branchQuestion] },
      { title: 'First path' },
      { title: 'Second path' },
    ],
  };

  assert.equal(questionnaireInputSchema.safeParse(definition).success, true);

  const result = questionnaireInputSchema.safeParse({
    ...definition,
    sections: [
      { title: 'Start', questions: [branchQuestion, branchQuestion] },
      ...definition.sections.slice(1),
    ],
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error?.issues[0]?.path, ['sections', 0, 'questions']);
});
