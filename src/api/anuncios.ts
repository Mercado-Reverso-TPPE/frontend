/**
 * Feed de anúncios de "procura-se" (QRO-07, QRO-09).
 *
 * `GET /anuncios` só devolve anúncios ativos cujo raio alcança a localização
 * de quem busca, e aceita busca, categoria, faixa de preço, distância máxima,
 * ordenação e cursor. Sem `VITE_API_URL`, a mesma regra roda sobre os dados
 * de demonstração.
 */

import { api, apiConfigurada, ErroDeApi } from "./cliente";
import { anuncioDaApi, slug, type Anuncio, type AnuncioDaApi } from "./meusAnuncios";
import type { BuyerAd } from "./tipos";
import { ALL_ADS, MY_ADS } from "@/dados/demo";

/** Ordenações aceitas pelo backend (`BuscaSalva.Ordenacao`). */
export type OrdenacaoDoFeed = "distancia" | "recentes" | "preco_minimo" | "preco_maximo";

export interface FiltrosDoFeed {
  busca: string;
  /** Slug da categoria; vazio para todas. */
  categoria: string;
  precoMin: number | null;
  precoMax: number | null;
  distanciaMaxKm: number | null;
  ordenacao: OrdenacaoDoFeed;
}

export const FILTROS_PADRAO: FiltrosDoFeed = {
  busca: "",
  categoria: "",
  precoMin: null,
  precoMax: null,
  distanciaMaxKm: null,
  ordenacao: "distancia",
};

export interface PaginaDoFeed {
  itens: Anuncio[];
  total: number;
  /** Cursor da próxima página; `null` quando acabou. */
  proximo: string | null;
}

export const TAMANHO_DA_PAGINA = 12;
const ATRASO_DEMO_MS = 320;
const esperar = () => new Promise((resolve) => setTimeout(resolve, ATRASO_DEMO_MS));

// ── Demonstração ────────────────────────────────────────────────────────────

const STATUS_DEMO = { active: "ativo", paused: "pausado", closed: "encerrado" } as const;

/** Converte um anúncio de demonstração no formato da API. */
function anuncioDeDemo(anuncio: BuyerAd, indice = 0): Anuncio {
  const [cidade = "", uf = ""] = anuncio.location.split(",").map((parte) => parte.trim());
  return {
    id: String(anuncio.id),
    comprador: anuncio.buyer.id,
    titulo: anuncio.title,
    categoria: slug(anuncio.category),
    categoriaNome: anuncio.category,
    descricao: anuncio.description,
    precoMin: anuncio.budget.min,
    precoMax: anuncio.budget.max,
    raioKm: anuncio.radius,
    status: STATUS_DEMO[anuncio.status],
    ofertasRecebidas: anuncio.offers,
    cidade,
    uf,
    criadoEm: new Date(Date.UTC(2026, 9, 20 - indice)).toISOString(),
    distanciaKm: anuncio.distance,
  };
}

const demandasDemo = () =>
  ALL_ADS.filter((anuncio): anuncio is BuyerAd => anuncio.kind === "buyer").map(anuncioDeDemo);

/**
 * A mesma regra do `buscar_anuncios` do backend: cada palavra precisa estar no
 * título ou na descrição, e o orçamento do anúncio precisa cruzar a faixa pedida.
 */
export function filtrarDemandas(anuncios: Anuncio[], filtros: FiltrosDoFeed): Anuncio[] {
  const palavras = filtros.busca.toLowerCase().split(/\s+/).filter(Boolean);
  const filtrados = anuncios.filter((anuncio) => {
    if (anuncio.status !== "ativo") return false;
    const texto = `${anuncio.titulo} ${anuncio.descricao}`.toLowerCase();
    if (!palavras.every((palavra) => texto.includes(palavra))) return false;
    if (filtros.categoria && anuncio.categoria !== filtros.categoria) return false;
    if (filtros.precoMin !== null && anuncio.precoMax !== null && anuncio.precoMax < filtros.precoMin) return false;
    if (filtros.precoMax !== null && anuncio.precoMin !== null && anuncio.precoMin > filtros.precoMax) return false;
    if (filtros.distanciaMaxKm !== null && (anuncio.distanciaKm ?? 0) > filtros.distanciaMaxKm) return false;
    return true;
  });

  const orcamento = (anuncio: Anuncio, padrao: number) => anuncio.precoMax ?? anuncio.precoMin ?? padrao;
  return [...filtrados].sort((a, b) => {
    if (filtros.ordenacao === "distancia") return (a.distanciaKm ?? 0) - (b.distanciaKm ?? 0);
    if (filtros.ordenacao === "preco_minimo") return orcamento(a, Infinity) - orcamento(b, Infinity);
    if (filtros.ordenacao === "preco_maximo") return orcamento(b, -1) - orcamento(a, -1);
    return b.criadoEm.localeCompare(a.criadoEm);
  });
}

// ── Recursos ────────────────────────────────────────────────────────────────

/** Uma página do feed com os filtros combinados. */
export async function listarFeed(
  filtros: FiltrosDoFeed,
  { cursor, tamanho = TAMANHO_DA_PAGINA, sinal }: { cursor?: string | null; tamanho?: number; sinal?: AbortSignal } = {},
): Promise<PaginaDoFeed> {
  if (!apiConfigurada()) {
    await esperar();
    const todos = filtrarDemandas(demandasDemo(), filtros);
    const inicio = cursor ? Number(cursor) : 0;
    const fim = inicio + tamanho;
    return { itens: todos.slice(inicio, fim), total: todos.length, proximo: fim < todos.length ? String(fim) : null };
  }

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
 * Anúncios recomendados para quem vende. O endpoint ainda não existe no
 * backend (issue de recomendações explicáveis); até lá, com a API ligada, a
 * lista vem vazia e o carrossel não aparece. Recomendar nunca cria oferta.
 */
export async function listarRecomendacoes(): Promise<Anuncio[]> {
  if (apiConfigurada()) return [];
  await esperar();
  return filtrarDemandas(demandasDemo(), { ...FILTROS_PADRAO, ordenacao: "recentes" }).slice(0, 6);
}

/** Um anúncio de "procura-se" visível para quem está logado. */
export async function obterAnuncio(id: string): Promise<Anuncio> {
  if (!apiConfigurada()) {
    await esperar();
    const encontrado = [...ALL_ADS, ...MY_ADS].find(
      (anuncio): anuncio is BuyerAd => anuncio.kind === "buyer" && String(anuncio.id) === id,
    );
    if (!encontrado) throw new ErroDeApi("Não encontramos este anúncio.", { status: 404, codigo: "http" });
    return anuncioDeDemo(encontrado);
  }
  return anuncioDaApi(await api.get<AnuncioDaApi>(`/anuncios/${id}`));
}
