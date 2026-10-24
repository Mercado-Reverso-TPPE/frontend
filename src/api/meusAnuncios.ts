/**
 * Anúncios de "procura-se" da pessoa autenticada (QRO-04, QRO-05).
 *
 * Endpoints: `GET /categorias`, `GET /anuncios/meus`, `GET /anuncios/:id?meus=true`,
 * `POST /anuncios`, `PATCH /anuncios/:id` e `PATCH /anuncios/:id/status`.
 * Sem `VITE_API_URL`, um armazenamento em memória faz o papel do backend,
 * semeado com os dados de demonstração.
 */

import { api, apiConfigurada, ErroDeApi } from "./cliente";
import { CATEGORIES, MY_ADS } from "@/dados/demo";

export type StatusDoAnuncio = "ativo" | "pausado" | "em_negociacao" | "encerrado";

export interface Categoria {
  slug: string;
  nome: string;
}

export interface MeuAnuncio {
  id: string;
  titulo: string;
  categoria: string;
  categoriaNome: string;
  descricao: string;
  precoMin: number | null;
  precoMax: number | null;
  raioKm: number;
  status: StatusDoAnuncio;
  ofertasRecebidas: number;
  cidade: string;
  uf: string;
  criadoEm: string;
}

export interface DadosDoAnuncio {
  titulo: string;
  categoria: string;
  descricao: string;
  precoMin: number | null;
  precoMax: number | null;
  raioKm: number;
}

export interface PaginaDeMeusAnuncios {
  itens: MeuAnuncio[];
  /** Cursor da próxima página; `null` quando acabou. */
  proximo: string | null;
}

/** Limites do backend (`RAIO_PADRAO_KM`, `RAIO_MAXIMO_KM`). */
export const RAIO_PADRAO_KM = 20;
export const RAIO_MAXIMO_KM = 200;

export type AcaoDoAnuncio = "editar" | "pausar" | "reativar" | "encerrar";

/**
 * O que a pessoa pode fazer com o anúncio, a partir do status que a API
 * informou. Espelha `alterar_status_anuncio` no backend: encerrado é final, e
 * em negociação quem decide o próximo passo é o fluxo da negociação.
 */
export function acoesPermitidas(status: StatusDoAnuncio): AcaoDoAnuncio[] {
  if (status === "ativo") return ["editar", "pausar", "encerrar"];
  if (status === "pausado") return ["editar", "reativar", "encerrar"];
  return [];
}

/** Corpo que o backend devolve para um anúncio. */
interface AnuncioDaApi {
  id: string;
  titulo: string;
  categoria: string;
  categoria_nome: string;
  descricao: string;
  preco_min: string | number | null;
  preco_max: string | number | null;
  raio_km: number;
  status: StatusDoAnuncio;
  ofertas_recebidas: number;
  cidade: string;
  uf: string;
  criado_em: string;
}

const numeroOuNulo = (valor: string | number | null) => (valor === null || valor === "" ? null : Number(valor));

export function anuncioDaApi(anuncio: AnuncioDaApi): MeuAnuncio {
  return {
    id: anuncio.id,
    titulo: anuncio.titulo,
    categoria: anuncio.categoria,
    categoriaNome: anuncio.categoria_nome,
    descricao: anuncio.descricao,
    precoMin: numeroOuNulo(anuncio.preco_min),
    precoMax: numeroOuNulo(anuncio.preco_max),
    raioKm: Number(anuncio.raio_km),
    status: anuncio.status,
    ofertasRecebidas: anuncio.ofertas_recebidas ?? 0,
    cidade: anuncio.cidade ?? "",
    uf: anuncio.uf ?? "",
    criadoEm: anuncio.criado_em,
  };
}

function corpoDoAnuncio(dados: DadosDoAnuncio) {
  return {
    titulo: dados.titulo.trim(),
    categoria: dados.categoria,
    descricao: dados.descricao.trim(),
    preco_min: dados.precoMin,
    preco_max: dados.precoMax,
    raio_km: dados.raioKm,
  };
}

/** Lê o `cursor` da URL `next` que o DRF devolve. */
function cursorDe(proxima: string | null) {
  if (!proxima) return null;
  try {
    return new URL(proxima).searchParams.get("cursor");
  } catch {
    return null;
  }
}

// ── Demonstração ────────────────────────────────────────────────────────────

const slug = (nome: string) =>
  nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const CATEGORIAS_DEMO: Categoria[] = CATEGORIES.filter((categoria) => categoria.id !== "all").map((categoria) => ({
  slug: slug(categoria.label),
  nome: categoria.label,
}));

const STATUS_DEMO = { active: "ativo", paused: "pausado", closed: "encerrado" } as const;

let anunciosDemo: MeuAnuncio[] | null = null;

function demo() {
  anunciosDemo ??= MY_ADS.map((anuncio, indice) => ({
    id: `demo-${anuncio.id}`,
    titulo: anuncio.title,
    categoria: slug(anuncio.category),
    categoriaNome: anuncio.category,
    descricao: anuncio.description,
    precoMin: anuncio.budget.min,
    precoMax: anuncio.budget.max,
    raioKm: anuncio.radius,
    status: STATUS_DEMO[anuncio.status],
    ofertasRecebidas: anuncio.offers,
    cidade: "São Paulo",
    uf: "SP",
    criadoEm: new Date(Date.UTC(2026, 7, 31 - indice * 3)).toISOString(),
  }));
  return anunciosDemo;
}

/** Volta o armazenamento de demonstração ao estado inicial (testes). */
export function reiniciarDemoDeMeusAnuncios() {
  anunciosDemo = null;
}

const esperar = () => new Promise((resolve) => setTimeout(resolve, 250));

function encontrarDemo(id: string) {
  const anuncio = demo().find((item) => item.id === id);
  if (!anuncio) throw new ErroDeApi("Não encontramos este anúncio.", { status: 404 });
  return anuncio;
}

// ── Recursos ────────────────────────────────────────────────────────────────

export async function listarCategorias(): Promise<Categoria[]> {
  if (!apiConfigurada()) return CATEGORIAS_DEMO;
  const resposta = await api.get<Categoria[] | { results: Categoria[] }>("/categorias");
  return Array.isArray(resposta) ? resposta : resposta.results;
}

export async function listarMeusAnuncios(cursor?: string | null): Promise<PaginaDeMeusAnuncios> {
  if (!apiConfigurada()) {
    await esperar();
    return { itens: [...demo()], proximo: null };
  }
  const resposta = await api.get<{ next: string | null; results: AnuncioDaApi[] }>("/anuncios/meus", {
    parametros: { cursor: cursor ?? undefined },
  });
  return { itens: resposta.results.map(anuncioDaApi), proximo: cursorDe(resposta.next) };
}

export async function obterMeuAnuncio(id: string): Promise<MeuAnuncio> {
  if (!apiConfigurada()) {
    await esperar();
    return { ...encontrarDemo(id) };
  }
  return anuncioDaApi(await api.get<AnuncioDaApi>(`/anuncios/${id}`, { parametros: { meus: "true" } }));
}

export async function publicarAnuncio(dados: DadosDoAnuncio, local: { cidade: string; uf: string }): Promise<MeuAnuncio> {
  if (!apiConfigurada()) {
    await esperar();
    const novo: MeuAnuncio = {
      ...dados,
      id: `demo-${Date.now()}`,
      categoriaNome: CATEGORIAS_DEMO.find((categoria) => categoria.slug === dados.categoria)?.nome ?? dados.categoria,
      status: "ativo",
      ofertasRecebidas: 0,
      cidade: local.cidade,
      uf: local.uf,
      criadoEm: new Date().toISOString(),
    };
    demo().unshift(novo);
    return novo;
  }
  return anuncioDaApi(await api.post<AnuncioDaApi>("/anuncios", corpoDoAnuncio(dados)));
}

export async function editarAnuncio(id: string, dados: DadosDoAnuncio): Promise<MeuAnuncio> {
  if (!apiConfigurada()) {
    await esperar();
    const anuncio = encontrarDemo(id);
    if (!acoesPermitidas(anuncio.status).includes("editar")) {
      throw new ErroDeApi("Anúncios encerrados não podem ser alterados.", { status: 400, detalhes: ["Anúncios encerrados não podem ser alterados."] });
    }
    Object.assign(anuncio, dados, {
      categoriaNome: CATEGORIAS_DEMO.find((categoria) => categoria.slug === dados.categoria)?.nome ?? dados.categoria,
    });
    return { ...anuncio };
  }
  return anuncioDaApi(await api.patch<AnuncioDaApi>(`/anuncios/${id}`, corpoDoAnuncio(dados)));
}

export async function alterarStatusDoAnuncio(
  id: string,
  status: Exclude<StatusDoAnuncio, "em_negociacao">,
): Promise<MeuAnuncio> {
  if (!apiConfigurada()) {
    await esperar();
    const anuncio = encontrarDemo(id);
    anuncio.status = status;
    return { ...anuncio };
  }
  return anuncioDaApi(await api.patch<AnuncioDaApi>(`/anuncios/${id}/status`, { status }));
}
