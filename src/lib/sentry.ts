import * as Sentry from '@sentry/react';
import { isNetworkError } from './networkError';

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Tự động bỏ qua lỗi mạng ở mức Sentry SDK
    beforeSend(event, hint) {
      if (isNetworkError(hint?.originalException)) return null;
      return event;
    },
  });
}

export function setSentryUser(user: { id: string; email?: string; role?: string } | null) {
  if (!dsn) return;
  if (user) {
    Sentry.setUser({ id: user.id, email: user.email, segment: user.role });
  } else {
    Sentry.setUser(null);
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  // Lỗi mạng không phải bug — bỏ qua hoàn toàn để tránh spam console và Sentry
  if (isNetworkError(error)) return;

  if (dsn) {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  }
  console.error(error);
}
