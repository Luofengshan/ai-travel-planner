/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_XUNFEI_APP_ID: string
  readonly VITE_XUNFEI_API_KEY: string
  readonly VITE_XUNFEI_API_SECRET: string
  readonly VITE_AMAP_API_KEY: string
  readonly VITE_ALIBABA_ACCESS_KEY_ID: string
  readonly VITE_ALIBABA_ACCESS_KEY_SECRET: string
  readonly VITE_DASHSCOPE_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
