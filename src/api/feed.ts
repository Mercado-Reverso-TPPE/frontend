/**
 * Feed com as abas Todos / Procurando / Vendendo.
 *
 * "Procurando" lê `GET /anuncios`, "Vendendo" lê a vitrine de produtos e
 * "Todos" pede uma página de cada e intercala os dois tipos. Cada fonte
 * pagina pelo próprio cursor.
 */

import { listarFeed, type FiltrosDoFeed, type TipoDoFeed } from "./anuncios";
import type { Anuncio } from "./meusAnuncios";
import { listarVitrine, type ProdutoAVenda } from "./vitrine";

export type ItemDoFeed = { tipo: "procurando"; anuncio: Anuncio } | { tipo: "vendendo"; produto: ProdutoAVenda };

/** Cursor de cada fonte: ausente na primeira página, `null` quando acabou. */
export interface CursorDoFeed {
  procurando?: string | null;
  vendendo?: string | null;
}

export interface PaginaMista {
  itens: ItemDoFeed[];
  total: number;
  proximo: CursorDoFeed | null;
}

const incluiProcurando = (tipo: TipoDoFeed) => tipo !== "vendendo";
const incluiVendendo = (tipo: TipoDoFeed) => tipo !== "procurando";

/** Alterna os dois tipos (um de cada) e completa com o que sobrar. */
export function intercalar<A, B>(primeiros: A[], segundos: B[]): (A | B)[] {
  const resultado: (A | B)[] = [];
  for (let indice = 0; indice < Math.max(primeiros.length, segundos.length); indice++) {
    if (indice < primeiros.length) resultado.push(primeiros[indice]!);
    if (indice < segundos.length) resultado.push(segundos[indice]!);
  }
  return resultado;
}

export async function listarItensDoFeed(
  filtros: FiltrosDoFeed,
  { cursor = {}, sinal }: { cursor?: CursorDoFeed; sinal?: AbortSignal } = {},
): Promise<PaginaMista> {
  const buscarAnuncios = incluiProcurando(filtros.tipo) && cursor.procurando !== null;
  const buscarProdutos = incluiVendendo(filtros.tipo) && cursor.vendendo !== null;

  const [anuncios, produtos] = await Promise.all([
    buscarAnuncios ? listarFeed(filtros, { cursor: cursor.procurando, sinal }) : null,
    buscarProdutos ? listarVitrine(filtros, { cursor: cursor.vendendo, sinal }) : null,
  ]);

  const itensDeAnuncios: ItemDoFeed[] = (anuncios?.itens ?? []).map((anuncio) => ({ tipo: "procurando", anuncio }));
  const itensDeProdutos: ItemDoFeed[] = (produtos?.itens ?? []).map((produto) => ({ tipo: "vendendo", produto }));

  const proximo: CursorDoFeed = { procurando: anuncios?.proximo ?? null, vendendo: produtos?.proximo ?? null };
  return {
    itens: intercalar(itensDeAnuncios, itensDeProdutos),
    total: (anuncios?.total ?? 0) + (produtos?.total ?? 0),
    proximo: proximo.procurando === null && proximo.vendendo === null ? null : proximo,
  };
}
