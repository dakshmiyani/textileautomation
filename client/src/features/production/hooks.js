import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProductionRecords,
  fetchProductionKPIs,
  fetchProductionAnalytics,
  createProductionRecord,
  deleteProductionRecord,
  exportProductionExcel
} from './api';

export function useProductionRecordsQuery(params = {}) {
  return useQuery({
    queryKey: ['production', 'records', params],
    queryFn: () => fetchProductionRecords(params),
    keepPreviousData: true
  });
}

export function useProductionKPIsQuery() {
  return useQuery({
    queryKey: ['production', 'kpis'],
    queryFn: fetchProductionKPIs,
    refetchInterval: 1000 * 20 // Auto-refresh KPIs every 20s
  });
}

export function useProductionAnalyticsQuery(days = 14) {
  return useQuery({
    queryKey: ['production', 'analytics', days],
    queryFn: () => fetchProductionAnalytics(days)
  });
}

export function useCreateProductionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProductionRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production'] });
    }
  });
}

export function useDeleteProductionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProductionRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production'] });
    }
  });
}

export function useExportExcelMutation() {
  return useMutation({
    mutationFn: exportProductionExcel
  });
}
