import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';

export function useTenantsQuery() {
  return useQuery({
    queryKey: ['saas-tenants'],
    queryFn: async () => {
      const { data } = await apiClient.get('/saas/tenants');
      return data.data;
    }
  });
}

export function useCreateTenantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/saas/tenants', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['saas-tenants']);
    }
  });
}
