import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY env vars')
}

const IDLE_WAKE_THRESHOLD_MS = 30_000
const WAKE_WINDOW_MS = 5_000
const WAKE_TIMEOUT_MS = 2_500
const NORMAL_READ_TIMEOUT_MS = 12_000
const NORMAL_WRITE_TIMEOUT_MS = 20_000
const RETRY_READ_TIMEOUT_MS = 20_000
const RETRY_WRITE_TIMEOUT_MS = 30_000
const RETRY_DELAY_MS = 75

let hiddenAt = 0
let blurredAt = 0
let lastActivityAt = Date.now()
let lastWakeAt = 0

if (typeof window !== 'undefined') {
  const markWake = () => {
    lastWakeAt = Date.now()
  }

  const trackActivity = () => {
    const now = Date.now()
    if (now - lastActivityAt >= IDLE_WAKE_THRESHOLD_MS) {
      markWake()
    }
    lastActivityAt = now
  }

  window.addEventListener('focus', () => {
    if (blurredAt && Date.now() - blurredAt >= IDLE_WAKE_THRESHOLD_MS) {
      markWake()
    }
    blurredAt = 0
  })

  window.addEventListener('blur', () => {
    blurredAt = Date.now()
  })

  window.addEventListener('online', markWake)

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (hiddenAt && Date.now() - hiddenAt >= IDLE_WAKE_THRESHOLD_MS) {
        markWake()
      }
      hiddenAt = 0
    } else {
      hiddenAt = Date.now()
    }
  })

  window.addEventListener('pointerdown', trackActivity, { passive: true })
  window.addEventListener('keydown', trackActivity)
}

const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError'

class SupabaseFetchTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Supabase request timed out after ${timeoutMs}ms`)
    this.name = 'SupabaseFetchTimeoutError'
  }
}

const isRetryableNetworkError = (error: unknown) => {
  if (error instanceof SupabaseFetchTimeoutError) return true
  if (isAbortError(error)) return true
  if (!(error instanceof Error)) return false
  return error.message.includes('Failed to fetch') || error.message.includes('NetworkError')
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const mergeSignals = (timeoutSignal: AbortSignal, requestSignal?: AbortSignal | null) => {
  if (!requestSignal) return timeoutSignal
  if (requestSignal.aborted) return requestSignal

  const controller = new AbortController()
  const abort = () => controller.abort()

  timeoutSignal.addEventListener('abort', abort, { once: true })
  requestSignal.addEventListener('abort', abort, { once: true })

  return controller.signal
}

const getRequestMethod = (options?: RequestInit) => (options?.method ?? 'GET').toUpperCase()

const getTimeoutMs = (method: string, attempt: number) => {
  const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(method)
  if (attempt > 0) return isWrite ? RETRY_WRITE_TIMEOUT_MS : RETRY_READ_TIMEOUT_MS

  const isWakeRequest = Date.now() - lastWakeAt <= WAKE_WINDOW_MS
  if (isWakeRequest) return WAKE_TIMEOUT_MS

  return isWrite ? NORMAL_WRITE_TIMEOUT_MS : NORMAL_READ_TIMEOUT_MS
}

const fetchWithHardTimeout = (
  url: RequestInfo | URL,
  options: RequestInit | undefined,
  abortRequest: () => void,
  signal: AbortSignal,
  timeoutMs: number,
) => {
  let timeoutId: number | undefined
  let timedOut = false

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      timedOut = true
      abortRequest()
      reject(new SupabaseFetchTimeoutError(timeoutMs))
    }, timeoutMs)
  })

  const fetchPromise = fetch(url, { ...options, signal }).finally(() => {
    if (timeoutId != null && !timedOut) {
      clearTimeout(timeoutId)
    }
  })

  return Promise.race([fetchPromise, timeoutPromise])
}

// Prevent permanently pending Supabase fetches after a tab wakes from idle/sleep.
// Only wake-window requests get a short first timeout; the retry uses a normal budget.
const fetchWithRetry = async (url: RequestInfo | URL, options?: RequestInit) => {
  const maxRetries = 1
  const method = getRequestMethod(options)

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController()
    const timeoutMs = getTimeoutMs(method, attempt)
    const abortTimeoutId = window.setTimeout(() => controller.abort(), timeoutMs)
    const signal = mergeSignals(controller.signal, options?.signal)

    try {
      const response = await fetchWithHardTimeout(url, options, () => controller.abort(), signal, timeoutMs)
      clearTimeout(abortTimeoutId)
      return response
    } catch (error) {
      clearTimeout(abortTimeoutId)

      if (options?.signal?.aborted) {
        throw error
      }

      if (attempt < maxRetries && isRetryableNetworkError(error)) {
        await delay(RETRY_DELAY_MS)
        continue
      }

      throw error
    }
  }

  throw new Error('Unreachable')
}

export const supabase = createClient<Database, 'smartstay'>(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'smartstay' },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: localStorage,
  },
  global: {
    fetch: fetchWithRetry,
  },
})
