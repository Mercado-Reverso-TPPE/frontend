/**
 * Números públicos do feed: as métricas do hero e a contagem de anúncios por
 * categoria nos chips.
 *
 * Contrato esperado do backend (ainda não publicado):
 * - `GET /estatisticas` → `{ anuncios_ativos, cidades, vendedores }`.
 * - `GET /anuncios/categorias` e `GET /vitrine/categorias` → `[{ slug, total }]`,
 *   com os mesmos filtros do feed (menos a categoria).
 *
 * Enquanto as rotas respondem 404, o hero usa os números de demonstração e os
 * chips ficam sem contagem. Sem `VITE_API_URL`, tudo é calculado sobre os
 * dados de demonstração.
 */

import { api, apiConfigurada, ErroDeApi } from "./cliente";
import { filtrarDemandas, listarDemandasDeDemo, type FiltrosDoFeed } from "./anuncios";
import { filtrarProdutos, listarProdutosDeDemo } from "./vitrine";

export interface EstatisticasPublicas {
  anunciosAtivos: number;
  cidades: number;
  vendedores: number;
}

/** Números do protótipo, usados sem API ou enquanto a rota não existe. */
export const ESTATISTICAS_DE_DEMONSTRACAO: EstatisticasPublicas = {
  anunciosAtivos: 2847,
  cidades: 314,
  vendedores: 18400,
};

/** Quantidade de anúncios por slug de categoria. */
export type ContagemPorCategoria = Record<string, number>;

const naoPublicada = (erro: unknown) => erro instanceof ErroDeApi && erro.status === 404;

export async function obterEstatisticas(): Promise<EstatisticasPublicas> {
  if (!apiConfigurada()) return ESTATISTICAS_DE_DEMONSTRACAO;
  try {
    const resposta = await api.get<{ anuncios_ativos: number; cidades: number; vendedores: number }>("/estatisticas");
    return {
      anunciosAtivos: Number(resposta.anuncios_ativos),
      cidades: Number(resposta.cidades),
      vendedores: Number(resposta.vendedores),
    };
  } catch (erro) {
    if (naoPublicada(erro)) return ESTATISTICAS_DE_DEMONSTRACAO;
    throw erro;
  }
}

function somar(destino: ContagemPorCategoria, itens: { slug: string; total: number }[]) {
  for (const { slug, total } of itens) destino[slug] = (destino[slug] ?? 0) + Number(total);
  return destino;
}

const contarLocalmente = (categorias: string[]) =>
  somar({}, categorias.map((slug) => ({ slug, total: 1 })));

/**
 * Contagem por categoria para a aba e os filtros ativos, ignorando a
 * categoria escolhida. `null` quando o backend ainda não expõe a contagem.
 */
export async function contarPorCategoria(
  filtros: FiltrosDoFeed,
  { sinal }: { sinal?: AbortSignal } = {},
): Promise<ContagemPorCategoria | null> {
  const semCategoria = { ...filtros, categoria: "" };
  const incluiProcurando = filtros.tipo !== "vendendo";
  const incluiVendendo = filtros.tipo !== "procurando";

  if (!apiConfigurada()) {
    const categorias = [
      ...(incluiProcurando ? filtrarDemandas(listarDemandasDeDemo(), semCategoria).map((item) => item.categoria) : []),
      ...(incluiVendendo ? filtrarProdutos(listarProdutosDeDemo(), semCategoria).map((item) => item.categoria) : []),
    ];
    return contarLocalmente(categorias);
  }

  const parametros = {
    q: filtros.busca.trim() || undefined,
    preco_min: filtros.precoMin ?? undefined,
    preco_max: filtros.precoMax ?? undefined,
    distancia_max_km: filtros.distanciaMaxKm ?? undefined,
  };
  const buscar = async (caminho: string) => {
    try {
      return await api.get<{ slug: string; total: number }[]>(caminho, { parametros, sinal });
    } catch (erro) {
      if (naoPublicada(erro)) return null;
      throw erro;
    }
  };

  const [anuncios, produtos] = await Promise.all([
    incluiProcurando ? buscar("/anuncios/categorias") : [],
    incluiVendendo ? buscar("/vitrine/categorias") : [],
  ]);
  // Sem nenhuma das contagens, os chips aparecem sem número em vez de mostrar meia conta.
  if (anuncios === null || produtos === null) return null;
  return somar(somar({}, anuncios), produtos);
}

/** Soma de todas as categorias, para o chip "Todos". */
export const totalDaContagem = (contagem: ContagemPorCategoria) =>
  Object.values(contagem).reduce((soma, valor) => soma + valor, 0);
