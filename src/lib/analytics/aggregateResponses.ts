import { QuestionType } from '@/generated/prisma/enums';

export const MIN_REPORTING_GROUP_SIZE = 5;

export type AnalyticsQuestion = {
  id: string;
  title: string;
  type: QuestionType;
  options: {
    value: string;
    label: string;
  }[];
};

export type AnalyticsAnswer = {
  questionId: string;
  value: unknown;
};

export type QuestionAnalytics = {
  questionId: string;
  title: string;
  type: QuestionType;
  responseCount: number;
  suppressed: boolean;
  distribution:
    | {
        value: string;
        label: string;
        count: number;
      }[]
    | null;
  averageRating: number | null;
};

export function calculateResponseRate(
  assigned: number,
  submitted: number,
): number {
  if (assigned === 0) return 0;

  return Math.round((submitted / assigned) * 10000) / 100;
}

export function aggregateQuestion(
  question: AnalyticsQuestion,
  answers: AnalyticsAnswer[],
): QuestionAnalytics {
  const values = answers
    .filter((answer) => answer.questionId === question.id)
    .map((answer) => answer.value);

  const responseCount = values.length;

  const base: QuestionAnalytics = {
    questionId: question.id,
    title: question.title,
    type: question.type,
    responseCount,
    suppressed: responseCount < MIN_REPORTING_GROUP_SIZE,
    distribution: null,
    averageRating: null,
  };

  // Prevent small response cohorts from exposing distributions.
  if (base.suppressed) return base;

  switch (question.type) {
    case QuestionType.SINGLE_CHOICE:
    case QuestionType.MULTIPLE_CHOICE: {
      const counts = new Map(
        question.options.map((option) => [option.value, 0]),
      );

      for (const value of values) {
        const selections = Array.isArray(value) ? value : [value];

        for (const selected of selections) {
          if (typeof selected !== 'string') continue;

          if (counts.has(selected)) {
            counts.set(selected, (counts.get(selected) ?? 0) + 1);
          }
        }
      }

      return {
        ...base,
        distribution: question.options.map((option) => ({
          value: option.value,
          label: option.label,
          count: counts.get(option.value) ?? 0,
        })),
      };
    }

    case QuestionType.YES_NO: {
      const yes = values.filter(
        (value) => value === 'yes' || value === true,
      ).length;
      const no = values.filter(
        (value) => value === 'no' || value === false,
      ).length;

      return {
        ...base,
        distribution: [
          { value: 'yes', label: 'Yes', count: yes },
          { value: 'no', label: 'No', count: no },
        ],
      };
    }

    case QuestionType.RATING: {
      const ratings = values.filter(
        (value): value is number =>
          typeof value === 'number' && Number.isFinite(value),
      );

      const average =
        ratings.length === 0
          ? null
          : Math.round(
              (ratings.reduce((total, value) => total + value, 0) /
                ratings.length) *
                100,
            ) / 100;

      const distinctRatings = [...new Set(ratings)].sort((a, b) => a - b);

      return {
        ...base,
        averageRating: average,
        distribution: distinctRatings.map((rating) => ({
          value: String(rating),
          label: String(rating),
          count: ratings.filter((value) => value === rating).length,
        })),
      };
    }

    case QuestionType.SHORT_TEXT:
    case QuestionType.LONG_TEXT:
      // Never expose raw free-text feedback in this analytics API.
      return base;

    default:
      return base;
  }
}
