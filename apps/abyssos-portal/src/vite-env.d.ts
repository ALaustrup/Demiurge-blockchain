/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEMIURGE_RPC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

