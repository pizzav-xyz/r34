/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly R34_API_KEY: string
  readonly R34_USER_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
