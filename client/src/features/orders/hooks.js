import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchOrders,
  fetchOrderById,
  fetchOrderMetrics,
  createOrder,
  updateOrder,
  deleteOrder,
  previewParseOrder,
  sendOrderWhatsApp
} from './api';

export function useOrdersQuery(params = {}) {
  return useQuery({
    queryKey: ['orders', 'list', params],
    queryFn: () => fetchOrders(params),
    keepPreviousData: true
  });
}

export function useOrderByIdQuery(id) {
  return useQuery({
    queryKey: ['orders', 'detail', id],
    queryFn: () => fetchOrderById(id),
    enabled: !!id
  });
}

export function useOrderMetricsQuery() {
  return useQuery({
    queryKey: ['orders', 'metrics'],
    queryFn: fetchOrderMetrics,
    refetchInterval: 1000 * 30
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
}

export function useUpdateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
}

export function useDeleteOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
}

export function useSendOrderWhatsAppMutation() {
  return useMutation({
    mutationFn: sendOrderWhatsApp
  });
}
