import { z } from 'zod';
import { QuestionType, QuestionnairePurpose } from '@/generated/prisma/enums';

const choiceQuestionTypes: readonly QuestionType[] = [
  QuestionType.SINGLE_CHOICE,
  QuestionType.MULTIPLE_CHOICE,
  QuestionType.YES_NO,
];

const optionSchema = z
  .object({
    label: z.string().trim().min(1).max(200),
    value: z.string().trim().min(1).max(100),
    nextSectionPosition: z.number().int().min(0).nullable().optional(),
  })
  .strict();

const questionSchema = z
  .object({
    title: z.string().trim().min(1).max(1000),
    type: z.enum(QuestionType),
    required: z.boolean().default(false),
    options: z.array(optionSchema).max(30).default([]),
  })
  .strict();

const sectionSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).nullable().optional(),
    questions: z.array(questionSchema).max(100).default([]),
  })
  .strict();

export const questionnaireInputSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().max(2000).nullable().optional(),
    purpose: z.enum(QuestionnairePurpose),
    sections: z.array(sectionSchema).max(30).default([]),
  })
  .strict()
  .superRefine((data, ctx) => {
    const count = data.sections.length;

    data.sections.forEach((section, sectionIndex) => {
      section.questions.forEach((question, questionIndex) => {
        const path = ['sections', sectionIndex, 'questions', questionIndex];

        const choice = choiceQuestionTypes.includes(question.type);

        if (choice && question.options.length < 2) {
          ctx.addIssue({
            code: 'custom',
            path: [...path, 'options'],
            message: 'Choice questions require at least two options',
          });
        }

        if (!choice && question.options.length > 0) {
          ctx.addIssue({
            code: 'custom',
            path: [...path, 'options'],
            message: 'This question type cannot have options',
          });
        }

        const values = question.options.map((o) => o.value);
        if (new Set(values).size !== values.length) {
          ctx.addIssue({
            code: 'custom',
            path: [...path, 'options'],
            message: 'Option values must be unique',
          });
        }

        if (question.type === QuestionType.YES_NO) {
          if (
            values.length !== 2 ||
            !values.includes('yes') ||
            !values.includes('no')
          ) {
            ctx.addIssue({
              code: 'custom',
              path: [...path, 'options'],
              message: 'YES_NO requires yes and no values',
            });
          }
        }

        question.options.forEach((option, optionIndex) => {
          const target = option.nextSectionPosition;

          if (target == null) return;

          if (
            question.type !== QuestionType.SINGLE_CHOICE &&
            question.type !== QuestionType.YES_NO
          ) {
            ctx.addIssue({
              code: 'custom',
              path: [...path, 'options', optionIndex],
              message: 'Branching requires a single-choice question',
            });
          }

          if (target <= sectionIndex || target >= count) {
            ctx.addIssue({
              code: 'custom',
              path: [...path, 'options', optionIndex, 'nextSectionPosition'],
              message: 'Branch target must be a later existing section',
            });
          }
        });
      });
    });
  });

export type QuestionnaireInput = z.infer<typeof questionnaireInputSchema>;
