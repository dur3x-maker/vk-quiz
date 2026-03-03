import { apiClient } from './client';
import {
  ParticipantHistoryItem,
  OrganizerHistoryItem,
  RoomDetailedHistory,
} from '@/types/api';

export const historyApi = {
  getParticipantHistory: () =>
    apiClient.get<ParticipantHistoryItem[]>('/history/participant'),

  getOrganizerHistory: () =>
    apiClient.get<OrganizerHistoryItem[]>('/history/organizer'),

  getRoomHistory: (roomId: string) =>
    apiClient.get<RoomDetailedHistory>(`/history/room/${roomId}`),
};
