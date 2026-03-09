import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { type User } from '@repo/common';

export const useUser = () => {
  const { data, ...queryRest } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      return await apiClient.get('user/me').json<User>();
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  return {
    user: data,
    ...queryRest,
  };
};
