# Quero. — Frontend

Aplicação web do **Quero.**, uma plataforma de compras reversa: compradores publicam o que procuram e vendedores próximos respondem com ofertas. Este repositório cobre somente o frontend. API, autenticação real, regras de negociação, persistência e geolocalização são dependências externas.

A referência de arquitetura, telas e identidade visual é a documentação do grupo:
[arquitetura do frontend](https://github.com/felipegf1/docs-grupo3-tppe/blob/main/docs/arquitetura/frontend.md) e
[identidade visual](https://github.com/felipegf1/docs-grupo3-tppe/blob/main/docs/interface/identidade-visual.md).

## Estado atual

A fundação da SPA está montada: estrutura de pastas da arquitetura documentada, rotas com os caminhos canônicos, layout compartilhado, tokens visuais centralizados, componentes-base, cliente HTTP, padrões de carregamento, erro e vazio, e testes de componente e de fluxo de tela.

As telas exportadas do Figma continuam no ar com dados de demonstração e ainda carregam estilos embutidos; elas migram para os componentes-base e para a API nas issues de cada fluxo. Nenhuma tela representa transação persistida.

## Arquitetura e diretórios

SPA em React + TypeScript + Vite, com React Router para navegação, TanStack Query para estado de servidor e CSS Modules sobre variáveis CSS para estilo.

```text
src/
├── api/                 # cliente HTTP, recursos e tipos do contrato
│   ├── cliente.ts       # fetch com base de URL, tempo limite e ErroDeApi
│   ├── anuncios.ts      # recurso do feed (com fallback de demonstração)
│   ├── consulta.ts      # QueryClient do TanStack Query
│   └── tipos.ts         # tipos do domínio
├── componentes/
│   ├── base/            # Botao, Chip, Badge, Campo, Avatar
│   ├── estado/          # Carregando, Esqueleto, ErroAoCarregar, EstadoVazio
│   ├── anuncio/         # CardProcurando, CardVendendo, CardCompacto
│   ├── feed/            # Hero, BarraDeFiltros, ResumoDaLista, Carrossel…
│   ├── layout/          # Cabecalho, Rodape, BotaoFlutuante, layouts, RotaPrivada
│   └── icones.tsx       # conjunto de ícones SVG
├── dados/demo.ts        # dados de demonstração (única fonte de mock)
├── estilos/
│   ├── tokens.css       # tokens da identidade visual — fonte única de verdade
│   ├── tokens.ts        # ponte TypeScript para os tokens CSS
│   └── global.css       # reset, foco visível e utilitários
├── hooks/               # useSessao, useFiltros, useAnuncios, useLocalizacao
├── paginas/             # uma pasta por rota
├── testes/              # setup, utilitários, testes de componente e de fluxo
├── utils/formato.ts     # valores em reais, distâncias em KM, plurais
├── App.tsx              # provedores da aplicação
└── rotas.tsx            # mapa de rotas
```

### Rotas

| Rota | Tela | Sessão |
| :--- | :--- | :--- |
| `/` | Feed com hero, filtros, cards e carrosséis | pública |
| `/entrar` · `/cadastrar` | Autenticação e criação de conta | pública |
| `/anuncios/:id` | Detalhe do anúncio | pública |
| `/perfil` | Dados cadastrais e localização de referência | exige sessão |
| `/anunciar` | Formulário de "procura-se" | exige sessão |
| `/meus-anuncios` | Lista com status e contagem de ofertas | exige sessão |
| `/minha-loja` | Catálogo de produtos do vendedor | exige sessão |
| `/anuncios/:id/ofertar` | Envio de oferta | exige sessão |
| `/anuncios/:id/ofertas` | Ofertas recebidas e comparação | exige sessão |
| `/anuncios/:id/ofertas/:ofertaId/contraproposta` | Contraproposta | exige sessão |
| `/negociacoes/:id` | Chat da negociação | exige sessão |
| `/negociacoes/:id/aceitar` · `/concluir` · `/avaliar` | Aceite, conclusão e avaliação | exige sessão |
| `/notificacoes` | Central de notificações | exige sessão |
| `/historico` | Negociações concluídas e canceladas | exige sessão |

Rota privada sem sessão redireciona para `/entrar?retorno=<destino>`, e o destino original é restaurado depois de entrar (QRO-02). Rota inexistente cai na tela de "página não existe".

### Tokens visuais

`src/estilos/tokens.css` é o único lugar com valores de marca: cor, tipografia, escala de espaçamento (múltiplos de 8), raios, métricas de layout (conteúdo de 1280px, cabeçalho de 64px, mínimo de 360px), sombras, gradientes e foco. `src/estilos/tokens.ts` expõe os mesmos tokens como `var(--…)` para quem escreve estilo em TypeScript — trocar uma cor é editar o CSS, em um lugar só.

A paleta de modo escuro já está declarada em `:root[data-tema="escuro"]`. O alternador de tema ainda não é exposto porque as telas do Figma carregam cores literais; cada tela que migrar para os tokens habilita o tema escuro junto.

### Padrões de carregamento, erro, vazio e foco

- `Carregando` e `EsqueletoDeAnuncios` — `role="status"` com texto anunciado por leitor de tela.
- `ErroAoCarregar` — `role="alert"`, mensagem vinda do `ErroDeApi` e botão de nova tentativa.
- `EstadoVazio` — título, explicação do próximo passo e ação (RNF-19).
- Foco visível — regra única em `estilos/global.css` para todo elemento interativo, mais o atalho "pular para o conteúdo" no layout.

Nenhum estado é sinalizado apenas por cor: os badges sempre carregam rótulo textual e o ícone é decorativo.

### Cliente HTTP

Toda chamada passa por `api/cliente.ts`, que concentra base de URL, cabeçalhos, token, tempo limite e conversão de falha em `ErroDeApi` (com `codigo`, `status` e `recuperavel`). O `TanStack Query` só repete o que vale repetir: rede, tempo limite e 5xx.

O contrato oficial da API ainda não foi publicado. Sem `VITE_API_URL`, os recursos em `api/` respondem com os dados de demonstração — as telas exercitam os três estados de listagem desde já, sem simular persistência. Quando o contrato chegar, muda o recurso; as telas ficam como estão.

## Requisitos locais

- Node.js 22 (conforme `.mise.toml`)
- pnpm 10.34.3
- Docker Desktop com Docker Compose v2, opcional para executar em contêiner

## Desenvolvimento local

```bash
pnpm install --frozen-lockfile
cp .env.example .env       # opcional: só é necessário ao integrar a API
pnpm dev                   # http://localhost:8443
PORT=5173 pnpm dev         # mesma porta usada pelo Docker Compose
```

A porta vem de `PORT` em `vite.config.ts`, com 8443 como padrão. Para gerar o build, `pnpm build`; para pré-visualizar, `pnpm preview` (mesma regra de porta).

## Docker Compose

```bash
docker compose up --build
docker compose logs -f frontend
docker compose down
```

A interface fica em <http://localhost:5173>. O Compose sobe somente o frontend. O volume de código permite hot reload; as dependências ficam em volume separado dentro do contêiner. Após mudar dependências, reconstrua com `docker compose down` e `docker compose up --build`.

## Testes e verificações

```bash
pnpm test           # Vitest + Testing Library
pnpm test:watch     # modo interativo
pnpm test:coverage  # cobertura (v8)
pnpm typecheck      # tsc --noEmit
pnpm build          # build de produção
```

Os testes vivem em `src/testes/`: `componentes/` cobre os componentes-base e os padrões de estado, `api/` e `utils/` cobrem filtro, ordenação, erros do cliente e formatação, e `fluxos/` monta a aplicação inteira com `createMemoryRouter` para cobrir navegação, rota privada e os estados do feed. `src/testes/utilitarios.tsx` entrega `renderizar` e `renderizarAplicacao` já com roteador, sessão e cache.

## Configuração

| Variável | Efeito |
| :--- | :--- |
| `VITE_API_URL` | Base da API. Vazia, a SPA usa os dados de demonstração. |
| `VITE_API_TIMEOUT` | Tempo limite de cada requisição, em ms (padrão 15000). |

O CSS importa Space Grotesk e Inter do Google Fonts; sem acesso externo, o navegador usa as fontes de fallback declaradas nos tokens.

## Limitações e próximas etapas

- Migrar as telas exportadas do Figma dos estilos embutidos para os componentes-base e os tokens — é o que libera o tema escuro.
- Substituir os dados de demonstração por chamadas reais quando o contrato da API for publicado, começando pelo feed.
- Paginação incremental do feed, recomendações e proximidade dependem de endpoints ainda não definidos.
- Formulários com React Hook Form + Zod e mapa com Leaflet entram junto com os fluxos que os exigem.
- Catálogo do vendedor (`/minha-loja`) existe como rota e estado vazio; o cadastro de produtos vem na issue do catálogo.
