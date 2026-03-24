import * as Sentry from '@sentry/react';

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
  if (dsn) {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  }
  console.error(error);
}
