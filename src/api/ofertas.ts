/**
 * Ofertas do vendedor (QRO-06).
 *
 * `POST /anuncios/:id/ofertas` envia, `GET /anuncios/:id/ofertas` devolve só a
 * oferta da própria pessoa quando ela não é a compradora, `GET /ofertas/meus`
 * lista as ofertas enviadas e `PATCH`/`DELETE /ofertas/:id` editam e retiram.
 * O vendedor nunca recebe as ofertas dos concorrentes: este módulo não tem
 * função que as peça.
 */

import { api, apiConfigurada, ErroDeApi } from "./cliente";

export type EstadoDeConservacao = "novo" | "seminovo" | "usado_bom" | "usado_marcas" | "pecas";
export type StatusDaOferta = "enviada" | "em_negociacao" | "aceita" | "recusada" | "retirada";

/** Rótulos do backend (`Oferta.EstadoConservacao`). */
export const ESTADOS_DE_CONSERVACAO: { valor: EstadoDeConservacao; rotulo: string }[] = [
  { valor: "novo", rotulo: "Novo" },
  { valor: "seminovo", rotulo: "Seminovo" },
  { valor: "usado_bom", rotulo: "Usado — bom estado" },
  { valor: "usado_marcas", rotulo: "Usado — com marcas" },
  { valor: "pecas", rotulo: "Para peças" },
];

export const rotuloDaConservacao = (estado: EstadoDeConservacao) =>
  ESTADOS_DE_CONSERVACAO.find((item) => item.valor === estado)?.rotulo ?? estado;

export interface EventoDaOferta {
  preco: number | null;
  status: StatusDaOferta;
  tipo: string;
  rodada: number;
  registradoEm: string;
}

export interface Oferta {
  id: string;
  anuncioId: string;
  produtoNome: string;
  produtoFoto: string | null;
  descricao: string;
  estadoDeConservacao: EstadoDeConservacao;
  preco: number;
  status: StatusDaOferta;
  criadaEm: string;
  historico: EventoDaOferta[];
}

export interface DadosDaOferta {
  descricao: string;
  estadoDeConservacao: EstadoDeConservacao;
  preco: number;
}

export interface PaginaDeOfertas {
  itens: Oferta[];
  proximo: string | null;
}

/** Oferta ainda em jogo: bloqueia uma segunda oferta no mesmo anúncio. */
export const ofertaAtiva = (oferta: Oferta) =>
  oferta.status === "enviada" || oferta.status === "em_negociacao" || oferta.status === "aceita";

/**
 * O backend só aceita editar ou retirar enquanto a oferta está "enviada".
 * Depois que o comprador responde, ela fica fixa.
 */
export const podeAlterarOferta = (status: StatusDaOferta) => status === "enviada";

interface OfertaDaApi {
  id: string;
  anuncio_id: string;
  produto_nome: string;
  produto_foto: string | null;
  descricao: string;
  estado_conservacao: EstadoDeConservacao;
  preco: string | number;
  status: StatusDaOferta;
  criada_em: string;
  historico: { preco: string | number | null; status: StatusDaOferta; tipo_evento: string; rodada: number; registrado_em: string }[];
}

function ofertaDaApi(oferta: OfertaDaApi): Oferta {
  return {
    id: oferta.id,
    anuncioId: oferta.anuncio_id,
    produtoNome: oferta.produto_nome ?? "",
    produtoFoto: oferta.produto_foto,
    descricao: oferta.descricao,
    estadoDeConservacao: oferta.estado_conservacao,
    preco: Number(oferta.preco),
    status: oferta.status,
    criadaEm: oferta.criada_em,
    historico: (oferta.historico ?? []).map((evento) => ({
      preco: evento.preco === null ? null : Number(evento.preco),
      status: evento.status,
      tipo: evento.tipo_evento,
      rodada: evento.rodada,
      registradoEm: evento.registrado_em,
    })),
  };
}

const corpoDaOferta = (dados: Partial<DadosDaOferta>) => ({
  descricao: dados.descricao?.trim(),
  estado_conservacao: dados.estadoDeConservacao,
  preco: dados.preco === undefined ? undefined : dados.preco.toFixed(2),
});

function cursorDe(proxima: string | null) {
  if (!proxima) return null;
  try {
    return new URL(proxima).searchParams.get("cursor");
  } catch {
    return null;
  }
}

// ── Demonstração ────────────────────────────────────────────────────────────

let ofertasDemo: Oferta[] = [];

export function reiniciarDemoDeOfertas() {
  ofertasDemo = [];
}

const esperar = () => new Promise((resolve) => setTimeout(resolve, 250));

function encontrarDemo(id: string) {
  const oferta = ofertasDemo.find((item) => item.id === id);
  if (!oferta) throw new ErroDeApi("Não encontramos esta oferta.", { status: 404 });
  return oferta;
}

function recusarDemo(mensagem: string): never {
  throw new ErroDeApi(mensagem, { status: 400, detalhes: [mensagem] });
}

// ── Recursos ────────────────────────────────────────────────────────────────

/** A oferta da própria pessoa neste anúncio, se houver uma ainda em jogo. */
export async function minhaOfertaNoAnuncio(anuncioId: string): Promise<Oferta | null> {
  if (!apiConfigurada()) {
    await esperar();
    return ofertasDemo.find((oferta) => oferta.anuncioId === anuncioId && ofertaAtiva(oferta)) ?? null;
  }
  const resposta = await api.get<{ results: OfertaDaApi[] }>(`/anuncios/${anuncioId}/ofertas`);
  return resposta.results.map(ofertaDaApi).find(ofertaAtiva) ?? null;
}

export async function enviarOferta(anuncioId: string, dados: DadosDaOferta): Promise<Oferta> {
  if (!apiConfigurada()) {
    await esperar();
    if (ofertasDemo.some((oferta) => oferta.anuncioId === anuncioId && ofertaAtiva(oferta))) {
      recusarDemo("Você já tem uma oferta ativa neste anúncio.");
    }
    const nova: Oferta = {
      ...dados,
      id: `oferta-${Date.now()}`,
      anuncioId,
      produtoNome: "",
      produtoFoto: null,
      status: "enviada",
      criadaEm: new Date().toISOString(),
      historico: [{ preco: dados.preco, status: "enviada", tipo: "enviada", rodada: 0, registradoEm: new Date().toISOString() }],
    };
    ofertasDemo.unshift(nova);
    return nova;
  }
  return ofertaDaApi(await api.post<OfertaDaApi>(`/anuncios/${anuncioId}/ofertas`, corpoDaOferta(dados)));
}

export async function editarOferta(id: string, dados: DadosDaOferta): Promise<Oferta> {
  if (!apiConfigurada()) {
    await esperar();
    const oferta = encontrarDemo(id);
    if (!podeAlterarOferta(oferta.status)) recusarDemo("Esta oferta não pode mais ser alterada.");
    Object.assign(oferta, dados);
    return { ...oferta };
  }
  return ofertaDaApi(await api.patch<OfertaDaApi>(`/ofertas/${id}`, corpoDaOferta(dados)));
}

export async function retirarOferta(id: string): Promise<void> {
  if (!apiConfigurada()) {
    await esperar();
    const oferta = encontrarDemo(id);
    if (!podeAlterarOferta(oferta.status)) recusarDemo("Esta oferta não pode mais ser retirada.");
    oferta.status = "retirada";
    return;
  }
  await api.remove<void>(`/ofertas/${id}`);
}

export async function listarMinhasOfertas(cursor?: string | null): Promise<PaginaDeOfertas> {
  if (!apiConfigurada()) {
    await esperar();
    return { itens: ofertasDemo.map((oferta) => ({ ...oferta })), proximo: null };
  }
  const resposta = await api.get<{ next: string | null; results: OfertaDaApi[] }>("/ofertas/meus", {
    parametros: { cursor: cursor ?? undefined },
  });
  return { itens: resposta.results.map(ofertaDaApi), proximo: cursorDe(resposta.next) };
}
