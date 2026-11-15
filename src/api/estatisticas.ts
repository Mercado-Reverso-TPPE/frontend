/**
 * Números públicos do feed: as métricas do hero e a contagem de anúncios por
 * categoria nos chips.
 *
 * - `GET /estatisticas` → `{ anuncios_ativos, cidades, vendedores }` (pública).
 * - `GET /anuncios/categorias` e `GET /vitrine/categorias` → `[{ slug, total }]`,
 *   com os mesmos filtros do feed (menos a categoria).
 */

import { api } from "./cliente";
import type { FiltrosDoFeed } from "./anuncios";

export interface EstatisticasPublicas {
  anunciosAtivos: number;
  cidades: number;
  vendedores: number;
}

/** Quantidade de anúncios por slug de categoria. */
export type ContagemPorCategoria = Record<string, number>;

export async function obterEstatisticas(): Promise<EstatisticasPublicas> {
  const resposta = await api.get<{ anuncios_ativos: number; cidades: number; vendedores: number }>("/estatisticas");
  return {
    anunciosAtivos: Number(resposta.anuncios_ativos),
    cidades: Number(resposta.cidades),
    vendedores: Number(resposta.vendedores),
  };
}

function somar(destino: ContagemPorCategoria, itens: { slug: string; total: number }[]) {
  for (const { slug, total } of itens) destino[slug] = (destino[slug] ?? 0) + Number(total);
  return destino;
}

/**
 * Contagem por categoria para a aba e os filtros ativos, ignorando a
 * categoria escolhida.
 */
export async function contarPorCategoria(
  filtros: FiltrosDoFeed,
  { sinal }: { sinal?: AbortSignal } = {},
): Promise<ContagemPorCategoria> {
  const incluiProcurando = filtros.tipo !== "vendendo";
  const incluiVendendo = filtros.tipo !== "procurando";

  const parametros = {
    q: filtros.busca.trim() || undefined,
    preco_min: filtros.precoMin ?? undefined,
    preco_max: filtros.precoMax ?? undefined,
    distancia_max_km: filtros.distanciaMaxKm ?? undefined,
  };
  const buscar = (caminho: string) => api.get<{ slug: string; total: number }[]>(caminho, { parametros, sinal });

  const [anuncios, produtos] = await Promise.all([
    incluiProcurando ? buscar("/anuncios/categorias") : [],
    incluiVendendo ? buscar("/vitrine/categorias") : [],
  ]);
  return somar(somar({}, anuncios), produtos);
}

/** Soma de todas as categorias, para o chip "Todos". */
export const totalDaContagem = (contagem: ContagemPorCategoria) =>
  Object.values(contagem).reduce((soma, valor) => soma + valor, 0);
