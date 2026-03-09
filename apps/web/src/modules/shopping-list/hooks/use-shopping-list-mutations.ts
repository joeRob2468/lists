import { apiClient } from '@/api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useShoppingListMutations() {
  const queryClient = useQueryClient();

  const deleteListMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`lists/${id}`).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });

  return {
    deleteList: deleteListMutation.mutate,
    isPending: deleteListMutation.isPending,
  };
}
