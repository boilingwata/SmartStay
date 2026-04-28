import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY env vars')
}

let lastFocusTime = Date.now()

if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => { lastFocusTime = Date.now() })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      lastFocusTime = Date.now()
    }
  })
}

// Custom fetch wrapper with smart retry mechanism to prevent infinite loading when tab sleeps/wakes.
// Stale TCP connections will cause the first fetch to hang. This aborts quickly and retries silently.
const fetchWithRetry = async (url: RequestInfo | URL, options?: RequestInit) => {
  const MAX_RETRIES = 1;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Nếu tab vừa được focus trong vòng 5 giây qua, dùng timeout siêu ngắn (800ms) cho lần thử đầu
    // để nhanh chóng cắt các connection bị "zombie" (stale) do OS/Router ngắt ngầm.
    // Nếu không, dùng timeout 8s. Lần retry luôn dùng 15s để đảm bảo query nặng chạy được.
    const isJustWokenUp = Date.now() - lastFocusTime < 5000;
    const TIMEOUT_MS = (attempt === 0 && isJustWokenUp) ? 800 : (attempt === 0 ? 8000 : 15000);
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
    
    try {
      const response = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(timeoutId)
      return response
    } catch (error: any) {
      clearTimeout(timeoutId)
      // Retry nếu gặp lỗi network hoặc timeout (AbortError)
      if (attempt < MAX_RETRIES && (error.name === 'AbortError' || error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError'))) {
        console.warn(`[Supabase] Fetch timeout/error on attempt ${attempt + 1}, retrying silently...`)
        // Delay siêu ngắn (50ms) để nhường thread cho browser dọn dẹp connection pool
        await new Promise(res => setTimeout(res, 50))
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
