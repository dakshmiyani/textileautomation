import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchWhatsAppStatus,
  connectWhatsApp,
  disconnectWhatsApp,
  reconnectWhatsApp,
  fetchMessageLogs
} from './api';

export function useWhatsAppStatusQuery() {
  return useQuery({
    queryKey: ['whatsapp', 'status'],
    queryFn: fetchWhatsAppStatus,
    refetchInterval: 1000 * 5 // Poll gateway status every 5 seconds
  });
}

export function useConnectWhatsAppMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: connectWhatsApp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp'] });
    }
  });
}

export function useDisconnectWhatsAppMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disconnectWhatsApp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp'] });
    }
  });
}

export function useReconnectWhatsAppMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reconnectWhatsApp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp'] });
    }
  });
}

export function useMessageLogsQuery(params = {}) {
  return useQuery({
    queryKey: ['whatsapp', 'logs', params],
    queryFn: () => fetchMessageLogs(params),
    keepPreviousData: true,
    refetchInterval: 1000 * 10 // Refresh logs every 10 seconds
  });
}
