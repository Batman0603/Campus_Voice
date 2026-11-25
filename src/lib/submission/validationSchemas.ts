
import { z } from 'zod';

export const assignRespondentSchema = z.object({
  userId: z.string().min(1),
}).strict();

export const submissionSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      value: z.union([
        z.string().max(10000),
        z.number(),
        z.array(z.string().max(100)).max(30),
      ]),
    }).strict()
  ).max(300),
}).strict();

export type SubmissionInput = z.infer<
  typeof submissionSchema
>;
