/**
 * Conversa, conclusão, histórico e avaliação (QRO-14, QRO-16, QRO-18, QRO-19).
 *
 * A conversa é a da oferta: `GET/POST /conversas/:ofertaId/mensagens` e
 * `POST /conversas/:ofertaId/leitura`. Não há endpoint para editar ou apagar
 * mensagem, e este módulo também não tem. A negociação nasce no aceite e
 * segue em `/negociacoes/:id` (conclusão bilateral e cancelamento); depois de
 * encerrada, aparece em `/historico`.
 *
 * Sem `VITE_API_URL`, as listas vêm vazias e o resto responde que depende da
 * API: nenhuma tela simula uma transação persistida.
 */

import { api, apiConfigurada, ErroDeApi } from "./cliente";
import { paginaDe, type Pagina, type RespostaPaginada } from "./paginacao";
import type { Papel, StatusDaOferta, TipoDeEvento } from "./ofertas";

export type StatusDaNegociacao = "em_andamento" | "concluida" | "cancelada";

export interface Contraparte {
  id: string;
  nome: string;
}

export interface Conversa {
  /** Id da oferta: cada oferta é uma conversa entre comprador e vendedor. */
  id: string;
  anuncioId: string;
  anuncioTitulo: string;
  statusDaOferta: StatusDaOferta;
  papel: Papel;
  contraparte: Contraparte;
  somenteLeitura: boolean;
  mensagensNaoLidas: number;
  ultimaMensagemEm: string | null;
}

export interface Mensagem {
  id: number;
  autorId: string;
  autorNome: string;
  minha: boolean;
  texto: string;
  registradaEm: string;
  lidaEm: string | null;
}

export interface Negociacao {
  id: string;
  ofertaId: string;
  anuncio: { id: string; titulo: string; categoria: string };
  papel: Papel;
  contraparte: Contraparte;
  status: StatusDaNegociacao;
  valorFinal: number;
  conclusaoSolicitadaEm: string | null;
  /** Até quando o comprador pode responder; depois, a API conclui sozinha. */
  prazoConfirmacaoEm: string | null;
  confirmadaEm: string | null;
  concluidaEm: string | null;
  canceladaEm: string | null;
  /** Concluída pelo prazo, sem a confirmação do comprador. */
  conclusaoAutomatica: boolean;
  avaliacao: { disponivel: boolean; enviada: boolean };
  criadaEm: string;
}

export interface PrecoNegociado {
  preco: number;
  tipo: TipoDeEvento;
  rodada: number;
  registradoEm: string;
}

export interface NegociacaoDetalhada extends Negociacao {
  precoInicial: number;
  precos: PrecoNegociado[];
  mensagens: Mensagem[];
}

// ── Conversão ───────────────────────────────────────────────────────────────

interface ConversaDaApi {
  id: string;
  anuncio_id: string;
  anuncio_titulo: string;
  status_oferta: StatusDaOferta;
  papel: Papel;
  contraparte: { id: string; nome: string };
  somente_leitura: boolean;
  mensagens_nao_lidas: number;
  ultima_mensagem_em: string | null;
}

interface MensagemDaApi {
  id: number;
  autor_id: string;
  autor_nome: string;
  minha: boolean;
  texto: string;
  registrado_em: string;
  lida_em: string | null;
}

interface NegociacaoDaApi {
  id: string;
  oferta_id: string;
  anuncio: { id: string; titulo: string; categoria: string };
  papel: Papel;
  contraparte: { id: string; nome: string };
  status: StatusDaNegociacao;
  valor_final: string | number;
  conclusao_solicitada_em: string | null;
  prazo_confirmacao_em: string | null;
  confirmada_em: string | null;
  concluida_em: string | null;
  cancelada_em: string | null;
  conclusao_automatica: boolean;
  avaliacao: { disponivel: boolean; enviada: boolean };
  criada_em: string;
}

interface NegociacaoDetalhadaDaApi extends NegociacaoDaApi {
  preco_inicial: string | number;
  precos: { preco: string | number; tipo_evento: TipoDeEvento; rodada: number; registrado_em: string }[];
  mensagens: MensagemDaApi[];
}

const contraparteDaApi = (contraparte: { id: string; nome: string }): Contraparte => ({
  id: String(contraparte.id),
  nome: contraparte.nome,
});

const conversaDaApi = (conversa: ConversaDaApi): Conversa => ({
  id: conversa.id,
  anuncioId: conversa.anuncio_id,
  anuncioTitulo: conversa.anuncio_titulo,
  statusDaOferta: conversa.status_oferta,
  papel: conversa.papel,
  contraparte: contraparteDaApi(conversa.contraparte),
  somenteLeitura: conversa.somente_leitura,
  mensagensNaoLidas: conversa.mensagens_nao_lidas ?? 0,
  ultimaMensagemEm: conversa.ultima_mensagem_em ?? null,
});

const mensagemDaApi = (mensagem: MensagemDaApi): Mensagem => ({
  id: mensagem.id,
  autorId: String(mensagem.autor_id),
  autorNome: mensagem.autor_nome,
  minha: mensagem.minha,
  texto: mensagem.texto,
  registradaEm: mensagem.registrado_em,
  lidaEm: mensagem.lida_em,
});

const negociacaoDaApi = (negociacao: NegociacaoDaApi): Negociacao => ({
  id: negociacao.id,
  ofertaId: negociacao.oferta_id,
  anuncio: { ...negociacao.anuncio, id: String(negociacao.anuncio.id) },
  papel: negociacao.papel,
  contraparte: contraparteDaApi(negociacao.contraparte),
  status: negociacao.status,
  valorFinal: Number(negociacao.valor_final),
  conclusaoSolicitadaEm: negociacao.conclusao_solicitada_em,
  prazoConfirmacaoEm: negociacao.prazo_confirmacao_em,
  confirmadaEm: negociacao.confirmada_em,
  concluidaEm: negociacao.concluida_em,
  canceladaEm: negociacao.cancelada_em,
  conclusaoAutomatica: negociacao.conclusao_automatica,
  avaliacao: negociacao.avaliacao ?? { disponivel: false, enviada: false },
  criadaEm: negociacao.criada_em,
});

const negociacaoDetalhadaDaApi = (negociacao: NegociacaoDetalhadaDaApi): NegociacaoDetalhada => ({
  ...negociacaoDaApi(negociacao),
  precoInicial: Number(negociacao.preco_inicial),
  precos: (negociacao.precos ?? []).map((preco) => ({
    preco: Number(preco.preco),
    tipo: preco.tipo_evento,
    rodada: preco.rodada,
    registradoEm: preco.registrado_em,
  })),
  mensagens: (negociacao.mensagens ?? []).map(mensagemDaApi),
});

function semApi(): never {
  throw new ErroDeApi("A negociação depende da API. Defina VITE_API_URL para integrar o backend.", {
    codigo: "sem-api",
  });
}

const vazia = <T>(): Pagina<T> => ({ itens: [], proximo: null });

/** Percorre as páginas de uma lista até achar o item (ou acabar o limite). */
async function procurarNasPaginas<T>(
  carregar: (cursor: string | null) => Promise<Pagina<T>>,
  achar: (item: T) => boolean,
  limiteDePaginas = 10,
): Promise<T | null> {
  let cursor: string | null = null;
  for (let pagina = 0; pagina < limiteDePaginas; pagina += 1) {
    const { itens, proximo } = await carregar(cursor);
    const encontrado = itens.find(achar);
    if (encontrado) return encontrado;
    if (!proximo) return null;
    cursor = proximo;
  }
  return null;
}

// ── Conversas (QRO-14) ──────────────────────────────────────────────────────

export async function listarConversas(cursor?: string | null): Promise<Pagina<Conversa>> {
  if (!apiConfigurada()) return vazia();
  const resposta = await api.get<RespostaPaginada<ConversaDaApi>>("/conversas", {
    parametros: { cursor: cursor ?? undefined },
  });
  return paginaDe(resposta, conversaDaApi);
}

/**
 * A conversa de uma oferta. A API não tem detalhe por id, então a busca
 * percorre a lista — é dela que vêm papel, contraparte e `somente_leitura`.
 */
export async function obterConversa(ofertaId: string): Promise<Conversa | null> {
  if (!apiConfigurada()) return null;
  return procurarNasPaginas(listarConversas, (conversa) => conversa.id === ofertaId);
}

/** Todas as mensagens da conversa, da mais antiga para a mais recente. */
export async function listarMensagens(ofertaId: string): Promise<Mensagem[]> {
  if (!apiConfigurada()) return [];
  const mensagens: Mensagem[] = [];
  let cursor: string | null = null;
  for (let pagina = 0; pagina < 20; pagina += 1) {
    const resposta: RespostaPaginada<MensagemDaApi> = await api.get(`/conversas/${ofertaId}/mensagens`, {
      parametros: { cursor: cursor ?? undefined },
    });
    const { itens, proximo } = paginaDe(resposta, mensagemDaApi);
    mensagens.push(...itens);
    if (!proximo) break;
    cursor = proximo;
  }
  return mensagens;
}

export async function enviarMensagem(ofertaId: string, texto: string): Promise<Mensagem> {
  if (!apiConfigurada()) semApi();
  return mensagemDaApi(await api.post<MensagemDaApi>(`/conversas/${ofertaId}/mensagens`, { texto: texto.trim() }));
}

export async function marcarConversaComoLida(ofertaId: string): Promise<void> {
  if (!apiConfigurada()) return;
  await api.post(`/conversas/${ofertaId}/leitura`);
}

// ── Negociação e conclusão (QRO-15, QRO-16) ─────────────────────────────────

export async function obterNegociacao(id: string): Promise<Negociacao> {
  if (!apiConfigurada()) semApi();
  return negociacaoDaApi(await api.get<NegociacaoDaApi>(`/negociacoes/${id}`));
}

/** O vendedor marca a venda como concluída; o comprador recebe o pedido de confirmação. */
export async function solicitarConclusao(id: string): Promise<Negociacao> {
  if (!apiConfigurada()) semApi();
  return negociacaoDaApi(await api.post<NegociacaoDaApi>(`/negociacoes/${id}/conclusao`));
}

export async function confirmarConclusao(id: string): Promise<Negociacao> {
  if (!apiConfigurada()) semApi();
  return negociacaoDaApi(await api.post<NegociacaoDaApi>(`/negociacoes/${id}/conclusao/confirmacao`));
}

export async function recusarConclusao(id: string): Promise<Negociacao> {
  if (!apiConfigurada()) semApi();
  return negociacaoDaApi(await api.post<NegociacaoDaApi>(`/negociacoes/${id}/conclusao/recusa`));
}

/** Cancela a negociação em andamento; o anúncio volta a aceitar ofertas. */
export async function cancelarNegociacao(id: string): Promise<void> {
  if (!apiConfigurada()) semApi();
  await api.post(`/negociacoes/${id}/cancelar`);
}

// ── Histórico (QRO-19) ──────────────────────────────────────────────────────

export interface FiltrosDoHistorico {
  papel?: Papel;
  status?: Exclude<StatusDaNegociacao, "em_andamento">;
}

/** Totais do histórico para os filtros pedidos. */
export interface ResumoDoHistorico {
  concluidas: number;
  /** Soma do valor final das negociações concluídas. */
  volume: number;
  total: number;
}

export interface PaginaDoHistorico extends Pagina<Negociacao> {
  /** Totais vindos da API, quando ela os envia (`resumo`); senão, a tela soma o que carregou. */
  resumo?: ResumoDoHistorico;
}

interface ResumoDaApi {
  concluidas: number;
  volume: string | number;
  total: number;
}

export async function listarHistorico(
  filtros: FiltrosDoHistorico = {},
  cursor?: string | null,
): Promise<PaginaDoHistorico> {
  if (!apiConfigurada()) return vazia();
  const resposta = await api.get<RespostaPaginada<NegociacaoDaApi> & { resumo?: ResumoDaApi }>("/historico", {
    parametros: { papel: filtros.papel, status: filtros.status, cursor: cursor ?? undefined },
  });
  const pagina: PaginaDoHistorico = paginaDe(resposta, negociacaoDaApi);
  if (resposta.resumo) {
    pagina.resumo = {
      concluidas: Number(resposta.resumo.concluidas),
      volume: Number(resposta.resumo.volume),
      total: Number(resposta.resumo.total),
    };
  }
  return pagina;
}

/** Totais calculados sobre as negociações já carregadas. */
export function resumirHistorico(negociacoes: Negociacao[]): ResumoDoHistorico {
  const concluidas = negociacoes.filter((negociacao) => negociacao.status === "concluida");
  return {
    concluidas: concluidas.length,
    volume: concluidas.reduce((soma, negociacao) => soma + negociacao.valorFinal, 0),
    total: negociacoes.length,
  };
}

export async function obterHistorico(id: string): Promise<NegociacaoDetalhada> {
  if (!apiConfigurada()) semApi();
  return negociacaoDetalhadaDaApi(await api.get<NegociacaoDetalhadaDaApi>(`/historico/${id}`));
}

// ── Avaliação (QRO-18) ──────────────────────────────────────────────────────

export const COMENTARIO_MAXIMO = 2000;

export async function avaliarNegociacao(id: string, nota: number, comentario = ""): Promise<void> {
  if (!apiConfigurada()) semApi();
  await api.post(`/negociacoes/${id}/avaliacoes`, { nota, comentario: comentario.trim() });
}

// ── Da oferta para a negociação ─────────────────────────────────────────────

interface NotificacaoComVinculo {
  oferta: string | null;
  negociacao: string | null;
}

/**
 * Descobre a negociação aberta para uma oferta aceita.
 *
 * A API ainda não expõe `negociacao_id` na oferta nem na conversa. Até lá, a
 * busca usa o que existe: o id que a própria oferta trouxer, o histórico
 * (negociações encerradas) e as notificações de quem participa, que carregam
 * oferta e negociação juntas.
 */
export async function localizarNegociacao(ofertaId: string, negociacaoConhecida?: string | null): Promise<string | null> {
  if (negociacaoConhecida) return negociacaoConhecida;
  if (!apiConfigurada()) return null;

  const encerrada = await procurarNasPaginas(
    (cursor) => listarHistorico({}, cursor),
    (negociacao) => negociacao.ofertaId === ofertaId,
    5,
  );
  if (encerrada) return encerrada.id;

  let pagina: number | null = 1;
  for (let lidas = 0; pagina !== null && lidas < 5; lidas += 1) {
    const resposta: { next: string | null; results: NotificacaoComVinculo[] } = await api.get("/notificacoes", {
      parametros: { page: pagina, page_size: 100 },
    });
    const vinculada = resposta.results.find((item) => item.oferta === ofertaId && item.negociacao);
    if (vinculada?.negociacao) return vinculada.negociacao;
    pagina = resposta.next ? pagina + 1 : null;
  }
  return null;
}
