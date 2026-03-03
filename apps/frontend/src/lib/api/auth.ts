import { apiClient } from './client';
import {
  AuthResponse,
  SignInDto,
  SignUpDto,
  User,
} from '@/types/api';

export const authApi = {
  signIn: (data: SignInDto) =>
    apiClient.post<AuthResponse>('/auth/sign-in', data),

  signUp: (data: SignUpDto) =>
    apiClient.post<AuthResponse>('/auth/sign-up', data),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    apiClient.post<void>('/auth/logout', { refreshToken }),

  getMe: () =>
    apiClient.get<User>('/auth/me'),
};
