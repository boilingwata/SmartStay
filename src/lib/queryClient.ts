import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';
import { captureException } from './sentry';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: unknown) => {
      captureException(error, { source: 'react-query' });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: unknown) => {
      captureException(error, { source: 'react-query-mutation' });
      const message = error instanceof Error ? error.message : 'Lỗi hệ thống';
      toast.error(`Thao tác thất bại: ${message}`);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 min
      gcTime: 10 * 60 * 1000,       // 10 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    }
  },
});
