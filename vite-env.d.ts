/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  // Injected via Vite define
  // eslint-disable-next-line no-var
  var __SUPABASE_URL__: string | undefined;
  // eslint-disable-next-line no-var
  var __SUPABASE_ANON_KEY__: string | undefined;
}

export {};
