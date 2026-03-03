import { apiClient } from './client';
import {
  Quiz,
  QuizListItem,
  CreateQuizDto,
  UpdateQuizDto,
} from '@/types/api';

export const quizzesApi = {
  getAll: () =>
    apiClient.get<QuizListItem[]>('/quizzes'),

  getById: (id: string) =>
    apiClient.get<Quiz>(`/quizzes/${id}`),

  create: (data: CreateQuizDto) =>
    apiClient.post<Quiz>('/quizzes', data),

  update: (id: string, data: UpdateQuizDto) =>
    apiClient.patch<Quiz>(`/quizzes/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<void>(`/quizzes/${id}`),
};
