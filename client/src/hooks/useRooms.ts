import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import type { Room, RoomDetail } from '../types';

export const useRooms = () => {
  return useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data } = await api.get('/rooms');
      return data;
    },
    refetchInterval: 30000,
  });
};

export const useRoom = (id: number) => {
  return useQuery<RoomDetail>({
    queryKey: ['room', id],
    queryFn: async () => {
      const { data } = await api.get(`/rooms/${id}`);
      return data;
    },
    refetchInterval: 30000,
  });
};
