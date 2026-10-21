import { QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router";
import type { ReactElement, ReactNode } from "react";
import { QueryClient } from "@tanstack/react-query";
import { ProvedorDeSessao } from "@/hooks/useSessao";
import { rotas } from "@/rotas";
import { ME } from "@/dados/demo";
import type { User } from "@/api/tipos";

/** Cliente de consulta isolado por teste: sem cache compartilhado nem retry. */
export function criarClienteDeTeste() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

interface OpcoesDeRenderizacao extends Omit<RenderOptions, "wrapper"> {
  /** Rota inicial do histórico em memória. */
  rota?: string;
  /** Sessão aberta com este usuário; `null` renderiza deslogado. */
  usuario?: User | null;
}

/** Renderiza um componente com roteador, sessão e cache — como na aplicação. */
export function renderizar(
  elemento: ReactElement,
  { rota = "/", usuario = null, ...opcoes }: OpcoesDeRenderizacao = {},
) {
  const cliente = criarClienteDeTeste();

  const Moldura = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={cliente}>
      <ProvedorDeSessao usuarioInicial={usuario}>
        <MemoryRouter initialEntries={[rota]}>{children}</MemoryRouter>
      </ProvedorDeSessao>
    </QueryClientProvider>
  );

  return { ...render(elemento, { wrapper: Moldura, ...opcoes }), cliente };
}

/**
 * Renderiza a aplicação inteira a partir de uma rota, com o mesmo mapa de
 * rotas da SPA — é o que os testes de fluxo de tela usam.
 */
export function renderizarAplicacao({
  rota = "/",
  usuario = null,
}: { rota?: string; usuario?: User | null } = {}) {
  const cliente = criarClienteDeTeste();
  const roteador = createMemoryRouter(rotas, { initialEntries: [rota] });

  const resultado = render(
    <QueryClientProvider client={cliente}>
      <ProvedorDeSessao usuarioInicial={usuario}>
        <RouterProvider router={roteador} />
      </ProvedorDeSessao>
    </QueryClientProvider>,
  );

  return { ...resultado, roteador, cliente };
}

/** Usuário de demonstração, para testes que precisam de sessão aberta. */
export const usuarioDeTeste = ME;
