/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base da API do quero., com o prefixo de versão. Obrigatória: não há dados de demonstração. */
  readonly VITE_API_URL?: string;
  /** Tempo limite de cada requisição, em milissegundos. Padrão: 15000. */
  readonly VITE_API_TIMEOUT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
