import { apiClient } from './client';
import {
  Room,
  RoomListItem,
  RoomParticipant,
  CreateRoomDto,
  JoinRoomDto,
} from '@/types/api';

export const roomsApi = {
  create: (data: CreateRoomDto) =>
    apiClient.post<Room>('/rooms', data),

  join: (data: JoinRoomDto) =>
    apiClient.post<Room>('/rooms/join', data),

  getAll: () =>
    apiClient.get<RoomListItem[]>('/rooms'),

  getById: (id: string) =>
    apiClient.get<Room>(`/rooms/${id}`),

  getParticipants: (id: string) =>
    apiClient.get<RoomParticipant[]>(`/rooms/${id}/participants`),
};
