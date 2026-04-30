import { QueryClient, QueryCache, MutationCache, focusManager, onlineManager } from '@tanstack/react-query';
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
      networkMode: 'always',
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      networkMode: 'always',
      retry: 0,
    }
  },
});

const IDLE_RECOVERY_THRESHOLD_MS = 30_000;
let lastInteractionAt = Date.now();
let hiddenAt = 0;
let isRecoveryRunning = false;

async function recoverActiveRequests() {
  if (isRecoveryRunning) return;
  isRecoveryRunning = true;

  try {
    onlineManager.setOnline(true);
    focusManager.setFocused(true);
    await queryClient.cancelQueries({ type: 'active' });
    await queryClient.resumePausedMutations();
    await queryClient.invalidateQueries({ refetchType: 'active' });
  } finally {
    isRecoveryRunning = false;
  }
}

function markInteraction() {
  const now = Date.now();
  const wasIdle = now - lastInteractionAt >= IDLE_RECOVERY_THRESHOLD_MS;
  lastInteractionAt = now;

  if (wasIdle) {
    void recoverActiveRequests();
  }
}

let recoveryListenersAttached = false;

export function setupQueryNetworkRecovery() {
  if (recoveryListenersAttached || typeof window === 'undefined') return;
  recoveryListenersAttached = true;

  window.addEventListener('pointerdown', markInteraction, { passive: true });
  window.addEventListener('keydown', markInteraction);
  window.addEventListener('online', () => {
    lastInteractionAt = Date.now();
    void recoverActiveRequests();
  });
  window.addEventListener('focus', () => {
    const now = Date.now();
    if (now - lastInteractionAt >= IDLE_RECOVERY_THRESHOLD_MS) {
      lastInteractionAt = now;
      void recoverActiveRequests();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
      return;
    }

    const now = Date.now();
    if (hiddenAt && now - hiddenAt >= IDLE_RECOVERY_THRESHOLD_MS) {
      lastInteractionAt = now;
      hiddenAt = 0;
      void recoverActiveRequests();
    }
  });
}
