/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  readonly VITE_BANK_NAME?: string
  readonly VITE_BANK_CODE?: string
  readonly VITE_BANK_ACCOUNT_NUMBER?: string
  readonly VITE_BANK_ACCOUNT_NAME?: string
  readonly VITE_BANK_BRANCH?: string
  readonly VITE_DEMO_MODE?: string
  readonly [key: string]: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
