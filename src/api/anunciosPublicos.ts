/**
 * Home pública: anúncios de "procura-se" para quem ainda não entrou.
 *
 * `GET /anuncios/publicos` não exige sessão, cobre o Brasil inteiro (ou uma
 * UF com `?uf=`) e devolve só o que o card mostra: título, categoria, faixa
 * de preço, cidade/UF e data. Comprador, descrição, raio e ofertas nunca
 * chegam ao navegador do visitante. O detalhe continua exigindo sessão.
 */

import { api } from "./cliente";
import { TAMANHO_DA_PAGINA, type FiltrosDoFeed, type OrdenacaoDoFeed, type PaginaDoFeed } from "./anuncios";
import type { ContagemPorCategoria } from "./estatisticas";
import type { Anuncio } from "./meusAnuncios";

export interface AnuncioPublicoDaApi {
  id: string;
  titulo: string;
  categoria: string;
  categoria_nome: string;
  preco_min: string | number | null;
  preco_max: string | number | null;
  cidade: string;
  uf: string;
  criado_em: string;
}

/** Sem localização do visitante, "mais próximos" não existe: vira "mais recentes". */
export const ordenacaoPublica = (ordenacao: OrdenacaoDoFeed): Exclude<OrdenacaoDoFeed, "distancia"> =>
  ordenacao === "distancia" ? "recentes" : ordenacao;

const numeroOuNulo = (valor: string | number | null) => (valor === null || valor === "" ? null : Number(valor));

/**
 * O card espera um `Anuncio`; o que o visitante não pode ver fica vazio
 * (e o card em modo público não mostra esses campos).
 */
export function anuncioPublicoDaApi(anuncio: AnuncioPublicoDaApi): Anuncio {
  return {
    id: anuncio.id,
    comprador: "",
    titulo: anuncio.titulo,
    categoria: anuncio.categoria,
    categoriaNome: anuncio.categoria_nome,
    descricao: "",
    precoMin: numeroOuNulo(anuncio.preco_min),
    precoMax: numeroOuNulo(anuncio.preco_max),
    raioKm: 0,
    status: "ativo",
    ofertasRecebidas: 0,
    cidade: anuncio.cidade ?? "",
    uf: anuncio.uf ?? "",
    criadoEm: anuncio.criado_em,
    distanciaKm: null,
    compradorPublico: null,
  };
}

const parametrosPublicos = (filtros: FiltrosDoFeed) => ({
  q: filtros.busca.trim() || undefined,
  uf: filtros.uf || undefined,
  categoria: filtros.categoria || undefined,
  preco_min: filtros.precoMin ?? undefined,
  preco_max: filtros.precoMax ?? undefined,
});

export async function listarFeedPublico(
  filtros: FiltrosDoFeed,
  { cursor, tamanho = TAMANHO_DA_PAGINA, sinal }: { cursor?: string | null; tamanho?: number; sinal?: AbortSignal } = {},
): Promise<PaginaDoFeed> {
  const resposta = await api.get<{ count: number; next: string | null; results: AnuncioPublicoDaApi[] }>(
    "/anuncios/publicos",
    {
      parametros: {
        ...parametrosPublicos(filtros),
        ordenacao: ordenacaoPublica(filtros.ordenacao),
        cursor: cursor ?? undefined,
        tamanho,
      },
      sinal,
    },
  );
  let proximo: string | null = null;
  if (resposta.next) {
    try {
      proximo = new URL(resposta.next).searchParams.get("cursor");
    } catch {
      proximo = null;
    }
  }
  return { itens: resposta.results.map(anuncioPublicoDaApi), total: resposta.count, proximo };
}

/** Contagem por categoria da home pública, com os mesmos filtros (menos a categoria). */
export async function contarPorCategoriaPublica(
  filtros: FiltrosDoFeed,
  { sinal }: { sinal?: AbortSignal } = {},
): Promise<ContagemPorCategoria> {
  const itens = await api.get<{ slug: string; total: number }[]>("/anuncios/publicos/categorias", {
    parametros: parametrosPublicos(filtros),
    sinal,
  });
  return Object.fromEntries(itens.map(({ slug, total }) => [slug, Number(total)]));
}
