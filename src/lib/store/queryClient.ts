import { QueryClient } from '@tanstack/react-query';

let queryClient: QueryClient | null = null;

export const getQueryClient = () => {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000,
          refetchOnWindowFocus: false,
          refetchOnReconnect: true,
          retry: 1,
        },
        mutations: {
          retry: 0,
        },
      },
    });
  }

  return queryClient;
};

export type { QueryClient };

