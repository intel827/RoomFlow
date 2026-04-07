import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import type { Reservation } from '../types';

interface CreateReservationData {
  room_id: number;
  title: string;
  start_time: string;
  end_time: string;
}

interface UpdateReservationData {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
}

export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  return useMutation<Reservation, Error, CreateReservationData>({
    mutationFn: async (data) => {
      const { data: result } = await api.post('/reservations', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room'] });
    },
  });
};

export const useUpdateReservation = () => {
  const queryClient = useQueryClient();
  return useMutation<Reservation, Error, UpdateReservationData>({
    mutationFn: async ({ id, ...data }) => {
      const { data: result } = await api.put(`/reservations/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room'] });
    },
  });
};

export const useDeleteReservation = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await api.delete(`/reservations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room'] });
    },
  });
};

export const useCancelReservation = () => {
  const queryClient = useQueryClient();
  return useMutation<Reservation, Error, { id: number; reason: string }>({
    mutationFn: async ({ id, reason }) => {
      const { data } = await api.post(`/reservations/${id}/cancel`, { reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room'] });
    },
  });
};
