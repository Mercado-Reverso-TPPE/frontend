# Quero. — Frontend

Aplicação web do **Quero.**, uma plataforma de compras reversa: compradores publicam o que procuram e vendedores próximos respondem com ofertas. Este repositório cobre somente o frontend. API, autenticação real, regras de negociação, persistência e geolocalização são dependências externas.

A referência de arquitetura, telas e identidade visual é a documentação do grupo:
[arquitetura do frontend](https://github.com/felipegf1/docs-grupo3-tppe/blob/main/docs/arquitetura/frontend.md) e
[identidade visual](https://github.com/felipegf1/docs-grupo3-tppe/blob/main/docs/interface/identidade-visual.md).

## Estado atual

A fundação da SPA está montada: estrutura de pastas da arquitetura documentada, rotas com os caminhos canônicos, layout compartilhado, tokens visuais centralizados, componentes-base, cliente HTTP, padrões de carregamento, erro e vazio, e testes de componente e de fluxo de tela.

Autenticação integrada à API (QRO-01, QRO-02): cadastro, entrar, sair, recuperação e redefinição de senha, proteção de rotas com retorno ao destino e renovação automática do token.

Perfil integrado à API (QRO-03): dados pessoais, foto (por link), localização de referência geocodificada pelo backend e troca de e-mail com confirmação. O que muda no perfil aparece na hora no avatar e no menu da conta.

Anúncios de "procura-se" integrados à API (QRO-04, QRO-05): publicar, editar, pausar, reativar e encerrar, com raio em KM e prévia do alcance. As ações de cada anúncio dependem do status que a API devolve (`acoesPermitidas` em `api/meusAnuncios.ts`).

Ofertas do vendedor integradas à API (QRO-06): enviar, editar e retirar enquanto a oferta aguarda resposta, e acompanhar o status em "Minhas ofertas". A tela de oferta não pede nem mostra ofertas concorrentes.

Feed integrado à API (QRO-07, QRO-09): busca, categoria, faixa de preço, distância máxima e ordenação combinam entre si e ficam na URL; a lista carrega por páginas; o detalhe volta ao feed com os mesmos filtros. Com a API ligada, o feed exige sessão e localização, porque o backend só devolve anúncios cujo raio alcança quem busca.

Catálogo do vendedor integrado à API (QRO-08): cadastrar, editar e excluir produtos, mudar o status (disponível, reservado, vendido) e enviar fotos com os limites do backend (até 6, JPEG/PNG/WEBP, 5 MB cada), checados também antes do envio. Na oferta, só produtos disponíveis aparecem e escolher um preenche o formulário.

Palpites e comparação integrados à API (QRO-10, QRO-11): o vendedor dá um palpite sem compromisso e pode ofertar com o mesmo valor; o comprador vê só a faixa agregada quando a API a libera. Em `/anuncios/:id/ofertas` o comprador ordena as ofertas e compara duas ou mais lado a lado; a lista só é pedida depois de confirmar que o anúncio é dele.

Negociação integrada à API (QRO-12 a QRO-16): em `/negociacoes/:id` (`:id` é a oferta) ficam o histórico de valores, a contraproposta com justificativa, rodada e prazo, aceite e recusa com confirmação, e o chat, que fica somente leitura quando a API encerra a conversa. As ações mostradas seguem o estado que a API devolveu (`situacaoDaNegociacao` em `api/ofertas.ts`); limite de rodadas e expiração continuam com o backend. `/negociacoes/:id/concluir` cobre a conclusão bilateral e o cancelamento.

Notificações, avaliação e histórico integrados à API (QRO-17 a QRO-19): central com não lidas e preferências por canal (segurança da conta não desliga), sino com a contagem real, avaliação de 1 a 5 com comentário opcional e histórico filtrável por papel e status, com detalhe de valores e mensagens.

Telas e componentes usam CSS Modules sobre os tokens: nenhum `style={{…}}` traz cor, fonte ou espaçamento literal, e só a camada `api/` lê `dados/demo.ts` (e só quando `VITE_API_URL` está vazia). `src/testes/arquitetura.test.ts` quebra a suíte se alguma das duas regras voltar. Os estilos que ainda passam por `style` são medidas calculadas a partir de props (tamanho do avatar e do logotipo, largura do esqueleto), via variáveis CSS. Nenhuma tela representa transação persistida.

## Arquitetura e diretórios

SPA em React + TypeScript + Vite, com React Router para navegação, TanStack Query para estado de servidor e CSS Modules sobre variáveis CSS para estilo.

```text
src/
├── api/                 # cliente HTTP, recursos e tipos do contrato
│   ├── cliente.ts       # fetch com base de URL, tempo limite e ErroDeApi
│   ├── anuncios.ts      # feed, detalhe e recomendações (com fallback de demonstração)
│   ├── autenticacao.ts  # cadastro, sessão, perfil e redefinição de senha
│   ├── perfil.ts        # edição do perfil e troca de e-mail
│   ├── meusAnuncios.ts  # anúncios do comprador, categorias e ações por status
│   ├── ofertas.ts       # ofertas, contrapropostas, aceite/recusa e palpites
│   ├── catalogo.ts      # produtos da loja e fotos
│   ├── negociacoes.ts   # conversa, conclusão, histórico e avaliação
│   ├── notificacoes.ts  # central, contagem e preferências
│   ├── paginacao.ts     # cursor e página do DRF
│   ├── consulta.ts      # QueryClient do TanStack Query
│   └── tipos.ts         # tipos do domínio
├── componentes/
│   ├── autenticacao/    # cabeçalho e avisos das telas de conta
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
├── utils/               # formato (reais, KM, plurais), navegação e validação
├── App.tsx              # provedores da aplicação
└── rotas.tsx            # mapa de rotas
```

### Rotas

| Rota | Tela | Sessão |
| :--- | :--- | :--- |
| `/` | Feed com busca, filtros combinados, paginação e carrosséis | pública (com a API, pede para entrar) |
| `/entrar` · `/cadastrar` | Autenticação, criação de conta e pedido de nova senha | pública |
| `/redefinir-senha?uid=…&token=…` | Nova senha a partir do link enviado por e-mail | pública |
| `/confirmar-email?token=…` | Confirma a troca de e-mail a partir do link enviado | pública |
| `/anuncios/:id` | Detalhe do anúncio | pública |
| `/perfil` | Dados cadastrais e localização de referência | exige sessão |
| `/anunciar` | Formulário de "procura-se" | exige sessão |
| `/meus-anuncios` | Lista com status e contagem de ofertas | exige sessão |
| `/meus-anuncios/:id/editar` | Edição de um anúncio ativo ou pausado | exige sessão |
| `/minha-loja` | Catálogo de produtos do vendedor | exige sessão |
| `/anuncios/:id/ofertar` | Envio, edição e retirada da própria oferta | exige sessão |
| `/minhas-ofertas` | Ofertas enviadas e o status de cada uma | exige sessão |
| `/anuncios/:id/ofertas` | Ofertas recebidas e comparação | exige sessão |
| `/negociacoes/:id` | Valores, contraproposta, aceite/recusa e chat da oferta `:id` | exige sessão |
| `/negociacoes/:id/concluir` · `/avaliar` | Conclusão bilateral e avaliação | exige sessão |
| `/notificacoes` | Central e preferências (`?aba=preferencias`) | exige sessão |
| `/historico` · `/historico/:id` | Negociações concluídas e canceladas, e o detalhe | exige sessão |

`/anuncios/:id/ofertas/:ofertaId/contraproposta` e `/negociacoes/:id/aceitar` redirecionam para `/negociacoes/:id`.

Rota privada sem sessão redireciona para `/entrar?retorno=<destino>`, e o destino original é restaurado depois de entrar (QRO-02). Só destinos internos são aceitos em `retorno`; qualquer outro volta para o feed. Rota inexistente cai na tela de "página não existe".

### Sessão

- `POST /sessoes` devolve o par JWT. O token de acesso fica só em memória, no cliente HTTP; o de renovação fica no `sessionStorage`, para a sessão sobreviver a um recarregamento da aba.
- Ao abrir o app com um token de renovação guardado, a sessão é restaurada antes de qualquer rota privada decidir para onde ir.
- Um 401 com sessão aberta dispara uma única renovação (`POST /sessoes/renovar`) e repete a chamada; se a renovação falhar, a sessão é encerrada.
- Sair chama `DELETE /sessoes` para invalidar o token de renovação e limpa o cache do TanStack Query.
- A senha só existe no estado do formulário e no corpo da requisição: os formulários usam `method="post"`, a senha é apagada do campo depois de um erro e nada dela vai para a URL ou para o armazenamento do navegador.
- Credencial errada e conta inexistente mostram a mesma mensagem, e o pedido de nova senha confirma o envio do mesmo jeito exista ou não a conta.

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
| `VITE_API_URL` | Base da API, com o prefixo de versão (ex.: `http://localhost:8000/api/v1`). Vazia, a SPA usa os dados de demonstração. |
| `VITE_API_TIMEOUT` | Tempo limite de cada requisição, em ms (padrão 15000). |

No backend, `CORS_ALLOWED_ORIGINS` precisa incluir a origem do frontend `PASSWORD_RESET_URL` precisa apontar para `<origem do frontend>/redefinir-senha` e `EMAIL_CHANGE_URL` para `<origem do frontend>/confirmar-email` — os padrões de lá usam `localhost:3000`.

O CSS importa Space Grotesk e Inter do Google Fonts; sem acesso externo, o navegador usa as fontes de fallback declaradas nos tokens.

## Limitações e próximas etapas

- Expor o alternador de tema escuro: as telas já usam só tokens; falta revisar o contraste de cada uma na paleta escura.
- Substituir os dados de demonstração por chamadas reais quando o contrato da API for publicado, começando pelo feed.
- Recomendações: a interface convida a ofertar ou descarta (sem criar oferta), mas o endpoint ainda não existe no backend. Com a API ligada, o carrossel fica oculto.
- Busca por cidade e cards "Vendendo" no feed ficaram de fora até a equipe definir essas regras.
- Formulários com React Hook Form + Zod e mapa com Leaflet entram junto com os fluxos que os exigem.
- O perfil não tem mais "categorias de interesse": o backend não guarda esse dado. Volta quando houver campo na API para as recomendações.
- A foto do perfil é um link (`foto` é URL no backend); envio de arquivo depende de um endpoint de upload.
- A prévia do alcance em `/anunciar` é um desenho proporcional, não um mapa. O mapa entra com Leaflet quando um fluxo precisar de geografia real.
- Fotos da oferta só entram copiadas de um produto do catálogo (assim funciona o backend).
- A API não expõe `negociacao_id` na oferta nem na conversa. Conclusão e avaliação localizam a negociação pelo histórico e pelas notificações (`localizarNegociacao`); quando o campo existir, a oferta já o lê.
- A comparação de ofertas não traz distância nem reputação do vendedor: o `OfertaSerializer` ainda não envia esses dados.
- O limite de rodadas de contraproposta não vem na API; a tela mostra a rodada atual e a mensagem do backend quando o limite é atingido.
- Sem `VITE_API_URL`, conversa, negociação, notificações e histórico ficam vazios ou avisam que dependem da API; só o catálogo tem demonstração em memória.
- `GET /ofertas/meus` não traz o título do anúncio, então "Minhas ofertas" mostra o produto ou a descrição e um link para o anúncio.
