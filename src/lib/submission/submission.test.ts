import assert from 'node:assert/strict';
import test from 'node:test';

import {
  QuestionType,
  QuestionnairePurpose,
  Role,
} from '@/generated/prisma/enums';

import { isEligibleRespondent } from './eligibility';
import {
  validateSubmissionAnswers,
  SubmissionValidationError,
} from './validateAnswers';

const sections = [
  {
    position: 0,
    questions: [
      {
        id: 'q1',
        type: QuestionType.SINGLE_CHOICE,
        required: true,
        options: [
          {
            value: 'yes',
            nextSectionPosition: null,
          },
          {
            value: 'no',
            nextSectionPosition: 2,
          },
        ],
      },
    ],
  },
  {
    position: 1,
    questions: [
      {
        id: 'q2',
        type: QuestionType.LONG_TEXT,
        required: true,
        options: [],
      },
    ],
  },
  {
    position: 2,
    questions: [
      {
        id: 'q3',
        type: QuestionType.RATING,
        required: true,
        options: [],
      },
    ],
  },
];

test('Student can answer Student Voice', () => {
  assert.equal(
    isEligibleRespondent(QuestionnairePurpose.STUDENT_VOICE, Role.STUDENT),
    true,
  );
});

test('Teacher cannot answer Student Voice', () => {
  assert.equal(
    isEligibleRespondent(QuestionnairePurpose.STUDENT_VOICE, Role.TEACHER),
    false,
  );
});

test('valid full submission passes', () => {
  assert.doesNotThrow(() => {
    validateSubmissionAnswers(sections, {
      answers: [
        { questionId: 'q1', value: 'yes' },
        { questionId: 'q2', value: 'Good experience' },
        { questionId: 'q3', value: 4 },
      ],
    });
  });
});

test('branching skips Section 1 correctly', () => {
  assert.doesNotThrow(() => {
    validateSubmissionAnswers(sections, {
      answers: [
        { questionId: 'q1', value: 'no' },
        { questionId: 'q3', value: 5 },
      ],
    });
  });
});

test('answer in skipped section is rejected', () => {
  assert.throws(() => {
    validateSubmissionAnswers(sections, {
      answers: [
        { questionId: 'q1', value: 'no' },
        { questionId: 'q2', value: 'Should be skipped' },
        { questionId: 'q3', value: 4 },
      ],
    });
  }, SubmissionValidationError);
});

test('missing required question is rejected', () => {
  assert.throws(() => {
    validateSubmissionAnswers(sections, {
      answers: [
        { questionId: 'q1', value: 'yes' },
        { questionId: 'q3', value: 3 },
      ],
    });
  }, SubmissionValidationError);
});

test('duplicate answers are rejected', () => {
  assert.throws(() => {
    validateSubmissionAnswers(sections, {
      answers: [
        { questionId: 'q1', value: 'no' },
        { questionId: 'q1', value: 'no' },
        { questionId: 'q3', value: 3 },
      ],
    });
  }, SubmissionValidationError);
});

test('invalid rating is rejected', () => {
  assert.throws(() => {
    validateSubmissionAnswers(sections, {
      answers: [
        { questionId: 'q1', value: 'no' },
        { questionId: 'q3', value: 9 },
      ],
    });
  }, SubmissionValidationError);
});
