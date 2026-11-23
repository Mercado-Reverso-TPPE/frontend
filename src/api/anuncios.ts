/**
 * Feed de anúncios de "procura-se" (QRO-07, QRO-09).
 *
 * `GET /anuncios` só devolve anúncios ativos cujo raio alcança a localização
 * de quem busca, e aceita busca, categoria, faixa de preço, distância máxima,
 * ordenação e cursor.
 */

import { api } from "./cliente";
import { anuncioDaApi, type Anuncio, type AnuncioDaApi } from "./meusAnuncios";

/** Ordenações aceitas pelo backend (`BuscaSalva.Ordenacao`). */
export type OrdenacaoDoFeed = "distancia" | "recentes" | "preco_minimo" | "preco_maximo";

/** Aba do feed: pedidos de compradores, produtos de vendedores ou os dois. */
export type TipoDoFeed = "todos" | "procurando" | "vendendo";

export interface FiltrosDoFeed {
  tipo: TipoDoFeed;
  busca: string;
  /** Slug da categoria; vazio para todas. */
  categoria: string;
  precoMin: number | null;
  precoMax: number | null;
  distanciaMaxKm: number | null;
  ordenacao: OrdenacaoDoFeed;
  /** Sigla do estado na home pública; vazio é o Brasil inteiro. O feed de quem entrou ignora. */
  uf: string;
}

export const FILTROS_PADRAO: FiltrosDoFeed = {
  tipo: "todos",
  busca: "",
  categoria: "",
  precoMin: null,
  precoMax: null,
  distanciaMaxKm: null,
  ordenacao: "distancia",
  uf: "",
};

export interface PaginaDoFeed {
  itens: Anuncio[];
  total: number;
  /** Cursor da próxima página; `null` quando acabou. */
  proximo: string | null;
}

export const TAMANHO_DA_PAGINA = 12;
// ── Recursos ────────────────────────────────────────────────────────────────

/** Uma página do feed com os filtros combinados. */
export async function listarFeed(
  filtros: FiltrosDoFeed,
  { cursor, tamanho = TAMANHO_DA_PAGINA, sinal }: { cursor?: string | null; tamanho?: number; sinal?: AbortSignal } = {},
): Promise<PaginaDoFeed> {
  const resposta = await api.get<{ count: number; next: string | null; results: AnuncioDaApi[] }>("/anuncios", {
    parametros: {
      q: filtros.busca.trim() || undefined,
      categoria: filtros.categoria || undefined,
      preco_min: filtros.precoMin ?? undefined,
      preco_max: filtros.precoMax ?? undefined,
      distancia_max_km: filtros.distanciaMaxKm ?? undefined,
      ordenacao: filtros.ordenacao,
      cursor: cursor ?? undefined,
      tamanho,
    },
    sinal,
  });
  let proximo: string | null = null;
  if (resposta.next) {
    try {
      proximo = new URL(resposta.next).searchParams.get("cursor");
    } catch {
      proximo = null;
    }
  }
  return { itens: resposta.results.map(anuncioDaApi), total: resposta.count, proximo };
}

/**
 * Anúncios recomendados para quem vende. O backend só recomenda por anúncio
 * (`/anuncios/:id/recomendacoes`, para o comprador); enquanto não houver
 * recomendação para quem vende, a lista vem vazia e o carrossel não aparece.
 * Recomendar nunca cria oferta.
 */
export async function listarRecomendacoes(): Promise<Anuncio[]> {
  return [];
}

/** Um anúncio de "procura-se" visível para quem está logado. */
export async function obterAnuncio(id: string): Promise<Anuncio> {
  return anuncioDaApi(await api.get<AnuncioDaApi>(`/anuncios/${id}`));
}
