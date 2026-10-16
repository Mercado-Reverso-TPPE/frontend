# Quero. — Frontend

Aplicação web do **Quero.**, uma plataforma de compras reversa: compradores publicam o que procuram e vendedores próximos podem responder com ofertas. Este repositório cobre somente o frontend. API, autenticação real, regras de negociação, persistência e geolocalização são dependências externas.

## Estado atual

O código React e Vite exportado do Figma está organizado na raiz, como aplicação principal. Ele contém feed, telas de conta, perfil, anúncios, ofertas, chat, notificações, avaliação e histórico. As telas e os fluxos visuais usam dados de demonstração e algumas ações locais; não há cliente HTTP nem contrato de API disponível. Portanto, essas telas não representam transações persistidas.

## Arquitetura e diretórios

O app segue uma SPA React + TypeScript + Vite. `src/routes.ts` organiza navegação; `src/layouts/` contém os layouts autenticado e de aplicação; `src/pages/` contém telas; `src/shared/` agrupa dados de demonstração, contexto de sessão, tokens e ícones; `src/index.css` contém estilos globais.

```text
src/
├── layouts/     # estruturas compartilhadas
├── pages/       # telas da SPA
├── shared/      # dados demonstrativos, sessão, tokens e ícones
├── App.tsx
├── routes.ts
└── index.css
```

## Requisitos locais

- Node.js 22 (conforme `.mise.toml`)
- pnpm 10.34.3
- Docker Desktop com Docker Compose v2, opcional para executar em contêiner

## Desenvolvimento local

```powershell
pnpm install --frozen-lockfile
pnpm dev -- --host 0.0.0.0 --port 5173
```

Abra <http://localhost:5173>. Para gerar o build, execute `pnpm build`; para pré-visualizar o build, `pnpm preview -- --host 0.0.0.0 --port 5173`.

## Docker Compose

Na raiz do repositório:

```powershell
docker compose up --build
docker compose logs -f frontend
docker compose down
```

A interface fica em <http://localhost:5173>. O Compose sobe somente o frontend. O volume de código permite hot reload; as dependências ficam em volume separado dentro do contêiner. Após mudar dependências, reconstrua com `docker compose down` e `docker compose up --build`.

## Testes e verificações

O app ainda não tem testes automatizados configurados. Estão disponíveis `pnpm build` e `pnpm typecheck` (`tsc --noEmit`). Não executei build ou typecheck nesta máquina porque Node.js e pnpm não estão instalados. Faça essas verificações em uma máquina com Node.js 22 e pnpm 10.34.3.

## Integrações externas e configuração

Não existe contrato de API, URL de serviço ou regra de autenticação entregue para o frontend. Não há `.env.example` porque nenhuma variável frontend foi definida oficialmente. Não configure endpoint presumido. Quando o contrato estiver disponível, adicionar um cliente HTTP e tipos de resposta em uma camada de integração do frontend, sem implementar serviços de servidor neste repositório.

O CSS importa Space Grotesk e Inter do Google Fonts; sem acesso externo, o navegador usa fontes de fallback.

## Limitações e próximas etapas

- Substituir dados e ações demonstrativas por integração client-side somente após receber contratos oficiais.
- Definir os caminhos canônicos da aplicação antes de integrar os serviços externos.
- Implementar critérios funcionais ainda ausentes, entre eles catálogo dedicado, palpites de preço, preferências de notificação e fluxos persistidos.
- Configurar Lucide React, testes automatizados e verificação de tipos quando as dependências puderem ser instaladas e o lockfile regenerado pelo pnpm.
