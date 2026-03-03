import { z } from 'zod';
import { QuestionType, AnswerMode } from '@/types/api';

export const createOptionSchema = z.object({
  text: z.string().min(1, 'Текст опции обязателен'),
  isCorrect: z.boolean(),
  order: z.number().int().min(0),
});

export const createQuestionSchema = z.object({
  type: z.nativeEnum(QuestionType),
  answerMode: z.nativeEnum(AnswerMode),
  text: z.string().min(1, 'Текст вопроса обязателен'),
  imageUrl: z.string().url('Некорректный URL').optional().or(z.literal('')),
  timerSeconds: z.number().int().min(5, 'Минимум 5 секунд').max(300, 'Максимум 300 секунд'),
  points: z.number().int().min(1, 'Минимум 1 балл').max(1000, 'Максимум 1000 баллов'),
  order: z.number().int().min(0),
  options: z.array(createOptionSchema).min(2, 'Минимум 2 варианта ответа'),
}).refine(
  (data) => data.options.some(opt => opt.isCorrect),
  { message: 'Хотя бы один вариант должен быть правильным', path: ['options'] }
);

export const createRoundSchema = z.object({
  title: z.string().min(1, 'Название раунда обязательно'),
  order: z.number().int().min(0),
  questions: z.array(createQuestionSchema).min(1, 'Минимум 1 вопрос в раунде'),
});

export const createQuizSchema = z.object({
  title: z.string().min(1, 'Название квиза обязательно').max(100, 'Максимум 100 символов'),
  description: z.string().max(500, 'Максимум 500 символов').optional(),
  rounds: z.array(createRoundSchema).min(1, 'Минимум 1 раунд'),
});

export type CreateQuizFormData = z.infer<typeof createQuizSchema>;
export type CreateRoundFormData = z.infer<typeof createRoundSchema>;
export type CreateQuestionFormData = z.infer<typeof createQuestionSchema>;
export type CreateOptionFormData = z.infer<typeof createOptionSchema>;
