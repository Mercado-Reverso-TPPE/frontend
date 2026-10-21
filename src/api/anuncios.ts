/**
 * Recurso de anúncios.
 *
 * Expõe à SPA a mesma assinatura que terá contra a API real. Sem
 * `VITE_API_URL`, responde com os dados de demonstração — as telas exercitam
 * carregamento, erro e estado vazio desde já, sem fingir persistência.
 */

import { api, apiConfigurada } from "./cliente";
import type { AnyAd } from "./tipos";
import { ALL_ADS } from "@/dados/demo";

export type TipoDeAnuncio = "todos" | "procurando" | "vendendo";
export type OrdenacaoDeAnuncio = "recentes" | "proximos" | "maior-valor";

export interface FiltrosDeAnuncio {
  tipo?: TipoDeAnuncio;
  categoria?: string;
  busca?: string;
  ordenacao?: OrdenacaoDeAnuncio;
}

export interface PaginaDeAnuncios {
  itens: AnyAd[];
  total: number;
}

const ATRASO_DEMO_MS = 320;

/** Preço de referência de um anúncio: preço pedido ou teto do orçamento. */
const valorDeReferencia = (anuncio: AnyAd) =>
  anuncio.kind === "seller" ? anuncio.price : anuncio.budget.max;

/**
 * Filtro e ordenação do feed. Com a API real quem faz isso é o servidor;
 * a função fica exportada porque é a regra que os testes cobrem.
 */
export function filtrarEOrdenar(anuncios: AnyAd[], filtros: FiltrosDeAnuncio = {}): AnyAd[] {
  const { tipo = "todos", categoria = "all", busca = "", ordenacao = "recentes" } = filtros;
  const termo = busca.trim().toLowerCase();

  const filtrados = anuncios.filter((anuncio) => {
    if (tipo === "procurando" && anuncio.kind !== "buyer") return false;
    if (tipo === "vendendo" && anuncio.kind !== "seller") return false;
    if (categoria !== "all" && anuncio.category !== categoria) return false;
    if (!termo) return true;
    return (
      anuncio.title.toLowerCase().includes(termo) ||
      anuncio.description.toLowerCase().includes(termo)
    );
  });

  return [...filtrados].sort((a, b) => {
    if (ordenacao === "proximos") return a.distance - b.distance;
    if (ordenacao === "maior-valor") return valorDeReferencia(b) - valorDeReferencia(a);
    return a.id - b.id;
  });
}

/** Lista o feed de anúncios. */
export async function listarAnuncios(
  filtros: FiltrosDeAnuncio = {},
  opcoes: { sinal?: AbortSignal } = {},
): Promise<PaginaDeAnuncios> {
  if (apiConfigurada()) {
    return api.get<PaginaDeAnuncios>("/anuncios", {
      parametros: {
        tipo: filtros.tipo,
        categoria: filtros.categoria === "all" ? undefined : filtros.categoria,
        busca: filtros.busca,
        ordenacao: filtros.ordenacao,
      },
      sinal: opcoes.sinal,
    });
  }

  await new Promise((resolve) => setTimeout(resolve, ATRASO_DEMO_MS));
  const itens = filtrarEOrdenar(ALL_ADS, filtros);
  return { itens, total: itens.length };
}
