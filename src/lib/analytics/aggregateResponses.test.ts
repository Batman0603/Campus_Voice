import assert from 'node:assert/strict';
import test from 'node:test';

import { QuestionType } from '@/generated/prisma/enums';
import { aggregateQuestion, calculateResponseRate } from './aggregateResponses';

test('response rate is zero when nothing is assigned', () => {
  assert.equal(calculateResponseRate(0, 0), 0);
});

test('response rate is calculated correctly', () => {
  assert.equal(calculateResponseRate(10, 7), 70);
  assert.equal(calculateResponseRate(3, 2), 66.67);
});

test('single choice answers are aggregated correctly', () => {
  const result = aggregateQuestion(
    {
      id: 'q1',
      title: 'Teaching quality',
      type: QuestionType.SINGLE_CHOICE,
      options: [
        { value: 'good', label: 'Good' },
        { value: 'poor', label: 'Poor' },
      ],
    },
    [
      { questionId: 'q1', value: 'good' },
      { questionId: 'q1', value: 'good' },
      { questionId: 'q1', value: 'good' },
      { questionId: 'q1', value: 'poor' },
      { questionId: 'q1', value: 'poor' },
    ],
  );

  assert.equal(result.suppressed, false);
  assert.equal(result.responseCount, 5);

  assert.deepEqual(result.distribution, [
    { value: 'good', label: 'Good', count: 3 },
    { value: 'poor', label: 'Poor', count: 2 },
  ]);
});

test('small groups have suppressed distributions', () => {
  const result = aggregateQuestion(
    {
      id: 'q1',
      title: 'Teaching quality',
      type: QuestionType.SINGLE_CHOICE,
      options: [{ value: 'good', label: 'Good' }],
    },
    [{ questionId: 'q1', value: 'good' }],
  );

  assert.equal(result.suppressed, true);
  assert.equal(result.distribution, null);
});

test('yes/no answers use the stored option values', () => {
  const result = aggregateQuestion(
    {
      id: 'q1',
      title: 'Was the lesson clear?',
      type: QuestionType.YES_NO,
      options: [],
    },
    ['yes', 'no', 'yes', true, false].map((value) => ({
      questionId: 'q1',
      value,
    })),
  );

  assert.deepEqual(result.distribution, [
    { value: 'yes', label: 'Yes', count: 3 },
    { value: 'no', label: 'No', count: 2 },
  ]);
});

test('rating averages are calculated correctly', () => {
  const result = aggregateQuestion(
    {
      id: 'q2',
      title: 'Rate the lesson',
      type: QuestionType.RATING,
      options: [],
    },
    [5, 4, 4, 3, 4].map((value) => ({
      questionId: 'q2',
      value,
    })),
  );

  assert.equal(result.averageRating, 4);
  assert.equal(result.responseCount, 5);
});

test('raw text feedback is not included', () => {
  const result = aggregateQuestion(
    {
      id: 'q3',
      title: 'Comments',
      type: QuestionType.LONG_TEXT,
      options: [],
    },
    Array.from({ length: 5 }, (_, i) => ({
      questionId: 'q3',
      value: `Private student comment ${i}`,
    })),
  );

  assert.equal(result.responseCount, 5);
  assert.equal(result.distribution, null);
  assert.equal(result.averageRating, null);
});
