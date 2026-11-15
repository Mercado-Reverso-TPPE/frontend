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
import { cursorDe } from "./paginacao";

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

/** Tipos de evento do histórico (`EventoNegociacao.TipoEvento`), com os valores exatos do backend. */
export type TipoDeEvento =
  | "enviada"
  | "editada"
  | "retirada"
  | "contraproposta"
  | "contraposta_aceita"
  | "contraposta_recusada"
  | "contraposta_expirada"
  | "contraposta_substituida"
  | "aceita"
  | "recusada"
  | "negociacao_cancelada";

export type ResultadoDoEvento = "pendente" | "aceita" | "recusada" | "expirada" | "substituida";

export interface EventoDaOferta {
  id: number;
  autorId: string;
  preco: number | null;
  status: StatusDaOferta;
  tipo: TipoDeEvento;
  /** Motivo de recusa; a API só o entrega a quem não é o autor. */
  justificativa: string;
  /** Texto que acompanha a contraproposta, visível às duas partes. */
  texto: string;
  rodada: number;
  expiraEm: string | null;
  respondidaEm: string | null;
  resultado: ResultadoDoEvento | null;
  registradoEm: string;
}

export interface Oferta {
  id: string;
  anuncioId: string;
  vendedorId: string;
  vendedorNome: string;
  produtoId: string | null;
  produtoNome: string;
  produtoFoto: string | null;
  descricao: string;
  estadoDeConservacao: EstadoDeConservacao;
  preco: number;
  status: StatusDaOferta;
  criadaEm: string;
  atualizadaEm: string;
  /** Presente quando a API passar a informar a negociação aberta pelo aceite. */
  negociacaoId: string | null;
  historico: EventoDaOferta[];
}

export interface DadosDaOferta {
  descricao: string;
  estadoDeConservacao: EstadoDeConservacao;
  preco: number;
  /** Produto do catálogo: a API copia nome e foto para a oferta. Só no envio. */
  produtoId?: string;
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

/** O vendedor mudou o preço depois de enviar. */
export const ofertaFoiEditada = (oferta: Oferta) => oferta.historico.some((evento) => evento.tipo === "editada");

interface EventoDaApi {
  id: number;
  autor_id: string;
  preco: string | number | null;
  status: StatusDaOferta;
  tipo_evento: TipoDeEvento;
  justificativa?: string;
  texto?: string;
  rodada: number;
  expira_em?: string | null;
  respondida_em?: string | null;
  resultado?: ResultadoDoEvento | null;
  registrado_em: string;
}

export interface OfertaDaApi {
  id: string;
  anuncio_id: string;
  vendedor_id?: string;
  vendedor_nome?: string;
  produto_id?: string | null;
  produto_nome: string;
  produto_foto: string | null;
  descricao: string;
  estado_conservacao: EstadoDeConservacao;
  preco: string | number;
  status: StatusDaOferta;
  criada_em: string;
  atualizada_em?: string;
  negociacao_id?: string | null;
  historico: EventoDaApi[];
}

const numeroOuNulo = (valor: string | number | null | undefined) =>
  valor === null || valor === undefined ? null : Number(valor);

function eventoDaApi(evento: EventoDaApi): EventoDaOferta {
  return {
    id: evento.id,
    autorId: String(evento.autor_id ?? ""),
    preco: numeroOuNulo(evento.preco),
    status: evento.status,
    tipo: evento.tipo_evento,
    justificativa: evento.justificativa ?? "",
    texto: evento.texto ?? "",
    rodada: evento.rodada ?? 0,
    expiraEm: evento.expira_em ?? null,
    respondidaEm: evento.respondida_em ?? null,
    resultado: evento.resultado ?? null,
    registradoEm: evento.registrado_em,
  };
}

export function ofertaDaApi(oferta: OfertaDaApi): Oferta {
  return {
    id: oferta.id,
    anuncioId: oferta.anuncio_id,
    vendedorId: String(oferta.vendedor_id ?? ""),
    vendedorNome: oferta.vendedor_nome ?? "",
    produtoId: oferta.produto_id ?? null,
    produtoNome: oferta.produto_nome ?? "",
    produtoFoto: oferta.produto_foto,
    descricao: oferta.descricao,
    estadoDeConservacao: oferta.estado_conservacao,
    preco: Number(oferta.preco),
    status: oferta.status,
    criadaEm: oferta.criada_em,
    atualizadaEm: oferta.atualizada_em ?? oferta.criada_em,
    negociacaoId: oferta.negociacao_id ?? null,
    historico: (oferta.historico ?? []).map(eventoDaApi),
  };
}

const corpoDaOferta = (dados: Partial<DadosDaOferta>) => ({
  descricao: dados.descricao?.trim(),
  estado_conservacao: dados.estadoDeConservacao,
  preco: dados.preco === undefined ? undefined : dados.preco.toFixed(2),
  ...(dados.produtoId ? { produto_id: dados.produtoId } : {}),
});

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
    const agora = new Date().toISOString();
    const nova: Oferta = {
      descricao: dados.descricao,
      estadoDeConservacao: dados.estadoDeConservacao,
      preco: dados.preco,
      id: `oferta-${Date.now()}`,
      anuncioId,
      vendedorId: "",
      vendedorNome: "",
      produtoId: dados.produtoId ?? null,
      produtoNome: "",
      produtoFoto: null,
      status: "enviada",
      criadaEm: agora,
      atualizadaEm: agora,
      negociacaoId: null,
      historico: [
        {
          id: 1,
          autorId: "",
          preco: dados.preco,
          status: "enviada",
          tipo: "enviada",
          justificativa: "",
          texto: "",
          rodada: 0,
          expiraEm: null,
          respondidaEm: null,
          resultado: null,
          registradoEm: agora,
        },
      ],
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
    const { produtoId: _ignorado, ...campos } = dados;
    Object.assign(oferta, campos);
    return { ...oferta };
  }
  // O produto de uma oferta enviada não pode ser trocado: `produto_id` fica de fora.
  return ofertaDaApi(await api.patch<OfertaDaApi>(`/ofertas/${id}`, corpoDaOferta({ ...dados, produtoId: undefined })));
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

// ── Ofertas recebidas e negociação de valor (QRO-11, QRO-12, QRO-13, QRO-15) ─

/** Negociação aberta pelo aceite, como `POST /ofertas/:id/aceitar` devolve. */
export interface NegociacaoAberta {
  id: string;
  ofertaId: string;
  anuncioId: string;
  valorFinal: number;
  status: string;
}

interface NegociacaoAbertaDaApi {
  id: string;
  oferta_id: string;
  anuncio_id: string;
  valor_final: string | number;
  status: string;
}

const negociacaoAbertaDaApi = (negociacao: NegociacaoAbertaDaApi): NegociacaoAberta => ({
  id: negociacao.id,
  ofertaId: negociacao.oferta_id,
  anuncioId: negociacao.anuncio_id,
  valorFinal: Number(negociacao.valor_final),
  status: negociacao.status,
});

function semApi(): never {
  throw new ErroDeApi(
    "A negociação depende da API. Defina VITE_API_URL para integrar o backend.",
    { codigo: "sem-api" },
  );
}

/**
 * Ofertas que o comprador recebeu no próprio anúncio. Só deve ser chamada
 * para o dono do anúncio: para qualquer outra pessoa a API devolve apenas a
 * oferta dela, e a tela não usa este recurso fora desse caso.
 */
export async function listarOfertasRecebidas(anuncioId: string, cursor?: string | null): Promise<PaginaDeOfertas> {
  if (!apiConfigurada()) {
    await esperar();
    return { itens: [], proximo: null };
  }
  const resposta = await api.get<{ next: string | null; results: OfertaDaApi[] }>(`/anuncios/${anuncioId}/ofertas`, {
    parametros: { cursor: cursor ?? undefined },
  });
  return { itens: resposta.results.map(ofertaDaApi), proximo: cursorDe(resposta.next) };
}

export async function obterOferta(id: string): Promise<Oferta> {
  if (!apiConfigurada()) {
    await esperar();
    return { ...encontrarDemo(id) };
  }
  return ofertaDaApi(await api.get<OfertaDaApi>(`/ofertas/${id}`));
}

export async function aceitarOferta(id: string): Promise<NegociacaoAberta> {
  if (!apiConfigurada()) semApi();
  return negociacaoAbertaDaApi(await api.post<NegociacaoAbertaDaApi>(`/ofertas/${id}/aceitar`));
}

export async function recusarOferta(id: string, justificativa = ""): Promise<Oferta> {
  if (!apiConfigurada()) semApi();
  return ofertaDaApi(await api.post<OfertaDaApi>(`/ofertas/${id}/recusar`, { justificativa: justificativa.trim() }));
}

export interface DadosDaContraproposta {
  preco: number;
  /** Justificativa opcional, exibida à outra parte junto do valor. */
  texto?: string;
}

export async function enviarContraproposta(id: string, dados: DadosDaContraproposta): Promise<EventoDaOferta> {
  if (!apiConfigurada()) semApi();
  return eventoDaApi(
    await api.post<EventoDaApi>(`/ofertas/${id}/contrapropostas`, {
      preco: dados.preco.toFixed(2),
      texto: dados.texto?.trim() ?? "",
    }),
  );
}

export type RespostaAContraproposta =
  | { acao: "aceitar" }
  | { acao: "recusar"; justificativa?: string }
  | { acao: "contrapropor"; preco: number; texto?: string };

/**
 * Responde à contraproposta aberta. Um 409 significa que ela expirou antes
 * da resposta; a tela mostra a mensagem da API e recarrega o histórico.
 */
export async function responderContraproposta(id: string, resposta: RespostaAContraproposta): Promise<Oferta> {
  if (!apiConfigurada()) semApi();
  const corpo =
    resposta.acao === "contrapropor"
      ? { acao: "contrapropor", preco: resposta.preco.toFixed(2), texto: resposta.texto?.trim() ?? "" }
      : resposta.acao === "recusar"
        ? { acao: "recusar", justificativa: resposta.justificativa?.trim() ?? "" }
        : { acao: "aceitar" };
  return ofertaDaApi(await api.post<OfertaDaApi>(`/ofertas/${id}/contrapropostas/responder`, corpo));
}

// ── Palpites e faixa estimada (QRO-10) ──────────────────────────────────────

/**
 * Faixa agregada dos palpites. A API só a libera ao comprador e a partir de
 * três palpites; abaixo disso devolve apenas `disponivel: false`. Ninguém
 * recebe valores individuais nem quem palpitou.
 */
export type EstimativaDePreco =
  | { disponivel: false }
  | {
      disponivel: true;
      minimo: number;
      media: number;
      maximo: number;
      /** `null` quando o anúncio não tem faixa de preço para comparar. */
      divergeDaFaixa: boolean | null;
    };

interface EstimativaDaApi {
  disponivel: boolean;
  minimo?: string | number;
  media?: string | number;
  maximo?: string | number;
  diverge_da_faixa_solicitada?: boolean | null;
}

export async function obterEstimativaDePreco(anuncioId: string): Promise<EstimativaDePreco> {
  if (!apiConfigurada()) {
    await esperar();
    return { disponivel: false };
  }
  const resposta = await api.get<EstimativaDaApi>(`/anuncios/${anuncioId}/estimativa-preco`);
  if (!resposta.disponivel) return { disponivel: false };
  return {
    disponivel: true,
    minimo: Number(resposta.minimo),
    media: Number(resposta.media),
    maximo: Number(resposta.maximo),
    divergeDaFaixa: resposta.diverge_da_faixa_solicitada ?? null,
  };
}

/** Registra ou substitui o palpite da pessoa. Não cria oferta. */
export async function enviarPalpite(anuncioId: string, valor: number): Promise<number> {
  if (!apiConfigurada()) {
    await esperar();
    return valor;
  }
  const resposta = await api.post<{ valor: string | number }>(`/anuncios/${anuncioId}/palpite`, {
    valor: valor.toFixed(2),
  });
  return Number(resposta.valor);
}

// ── Leitura do estado da negociação ─────────────────────────────────────────

const RESPOSTAS_DE_CONTRAPROPOSTA: TipoDeEvento[] = [
  "contraposta_aceita",
  "contraposta_recusada",
  "contraposta_expirada",
  "contraposta_substituida",
];

export type Papel = "comprador" | "vendedor";

export interface SituacaoDaNegociacao {
  /** Contraproposta aguardando resposta, se houver. */
  pendente: EventoDaOferta | null;
  /** Rodada mais recente registrada pela API (0 antes da primeira contraproposta). */
  rodadaAtual: number;
  /** Quem deve responder à contraproposta pendente é esta pessoa. */
  devoResponder: boolean;
  /** A oferta ainda aceita ações de negociação de valor. */
  emAberto: boolean;
  /** Comprador pode aceitar ou recusar a oferta diretamente (sem contraproposta aberta). */
  podeDecidirOferta: boolean;
  /** Esta pessoa pode iniciar uma nova contraproposta (fora de uma resposta). */
  podeContrapor: boolean;
}

/**
 * Lê o histórico que a API devolveu para saber quais ações mostrar. Não
 * decide transições: espelha as checagens de `ofertas/services.py`
 * (`_open_counteroffer`, `_may_counter`) para não oferecer um botão que a
 * API certamente recusaria. Limite de rodadas e expiração continuam com a
 * API, que responde com a mensagem exibida na tela.
 */
export function situacaoDaNegociacao(
  oferta: Oferta,
  { usuarioId, papel, anuncioAtivo }: { usuarioId: string; papel: Papel; anuncioAtivo: boolean },
): SituacaoDaNegociacao {
  const contrapropostas = oferta.historico.filter((evento) => evento.tipo === "contraproposta" && evento.rodada > 0);
  const pendente =
    [...contrapropostas]
      .reverse()
      .find((evento) => !evento.respondidaEm && (evento.resultado === "pendente" || evento.resultado === null)) ?? null;
  const rodadaAtual = contrapropostas.reduce((maior, evento) => Math.max(maior, evento.rodada), 0);
  const emAberto = anuncioAtivo && (oferta.status === "enviada" || oferta.status === "em_negociacao");

  let podeContrapor = false;
  if (emAberto && !pendente) {
    const ultima = [...contrapropostas].sort((a, b) => a.rodada - b.rodada || a.id - b.id).at(-1);
    if (!ultima) {
      podeContrapor = papel === "comprador";
    } else {
      const resposta = oferta.historico
        .filter((evento) => evento.rodada === ultima.rodada && RESPOSTAS_DE_CONTRAPROPOSTA.includes(evento.tipo))
        .at(-1);
      podeContrapor =
        resposta && resposta.tipo !== "contraposta_expirada"
          ? resposta.autorId === usuarioId
          : ultima.autorId !== usuarioId;
    }
  }

  return {
    pendente,
    rodadaAtual,
    devoResponder: emAberto && pendente !== null && pendente.autorId !== usuarioId,
    emAberto,
    podeDecidirOferta: emAberto && papel === "comprador" && pendente === null,
    podeContrapor,
  };
}
