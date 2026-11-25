
import { QuestionType } from '@/generated/prisma/enums';
import type { SubmissionInput } from './validationSchemas';

type AnswerValue = SubmissionInput['answers'][number]['value'];

type OptionDefinition = {
  value: string;
  nextSectionPosition: number | null;
};

type QuestionDefinition = {
  id: string;
  type: QuestionType;
  required: boolean;
  options: OptionDefinition[];
};

type SectionDefinition = {
  position: number;
  questions: QuestionDefinition[];
};

export class SubmissionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubmissionValidationError';
  }
}

function reject(message: string): never {
  throw new SubmissionValidationError(message);
}

function validateValue(
  question: QuestionDefinition,
  value: AnswerValue
): void {
  const options = question.options.map(option => option.value);

  switch (question.type) {
    case QuestionType.SHORT_TEXT:
    case QuestionType.LONG_TEXT: {
      const limit = question.type === QuestionType.SHORT_TEXT
        ? 500
        : 10000;

      if (
        typeof value !== 'string' ||
        value.length > limit ||
        (question.required && !value.trim())
      ) {
        reject('Invalid text answer');
      }
      return;
    }

    case QuestionType.SINGLE_CHOICE:
    case QuestionType.YES_NO:
      if (
        typeof value !== 'string' ||
        !options.includes(value)
      ) {
        reject('Invalid selected option');
      }
      return;

    case QuestionType.MULTIPLE_CHOICE:
      if (
        !Array.isArray(value) ||
        value.some(item => !options.includes(item)) ||
        new Set(value).size !== value.length ||
        (question.required && value.length === 0)
      ) {
        reject('Invalid multiple-choice answer');
      }
      return;

    case QuestionType.RATING:
      if (
        typeof value !== 'number' ||
        !Number.isInteger(value) ||
        value < 1 ||
        value > 5
      ) {
        reject('Rating must be an integer from 1 to 5');
      }
      return;

    default:
      reject('Unsupported question type');
  }
}

export function validateSubmissionAnswers(
  sections: SectionDefinition[],
  input: SubmissionInput
) {
  const answers = new Map<string, AnswerValue>();

  for (const answer of input.answers) {
    if (answers.has(answer.questionId)) {
      reject('Duplicate answers are not permitted');
    }

    answers.set(answer.questionId, answer.value);
  }

  const orderedSections = [...sections].sort(
    (a, b) => a.position - b.position
  );

  const visitedQuestions = new Set<string>();

  let sectionIndex = 0;

  while (sectionIndex < orderedSections.length) {
    const section = orderedSections[sectionIndex];

    const branchQuestions = section.questions.filter(
      question => question.options.some(
        option => option.nextSectionPosition !== null
      )
    );

    if (branchQuestions.length > 1) {
      reject('Questionnaire has ambiguous branching');
    }

    for (const question of section.questions) {
      visitedQuestions.add(question.id);

      const value = answers.get(question.id);

      if (value === undefined) {
        if (question.required) {
          reject(`Required question missing: ${question.id}`);
        }
        continue;
      }

      validateValue(question, value);
    }

    const branchQuestion = branchQuestions[0];

    let nextIndex = sectionIndex + 1;

    if (branchQuestion) {
      const value = answers.get(branchQuestion.id);

      if (typeof value === 'string') {
        const selectedOption = branchQuestion.options.find(
          option => option.value === value
        );

        const target = selectedOption?.nextSectionPosition;

        if (target != null) {
          const targetIndex = orderedSections.findIndex(
            candidate => candidate.position === target
          );

          if (targetIndex <= sectionIndex) {
            reject('Invalid questionnaire branch target');
          }

          nextIndex = targetIndex;
        }
      }
    }

    sectionIndex = nextIndex;
  }

  for (const questionId of answers.keys()) {
    if (!visitedQuestions.has(questionId)) {
      reject(`Answer references an unreachable question: ${questionId}`);
    }
  }

  return input.answers;
}
