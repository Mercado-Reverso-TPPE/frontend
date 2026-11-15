/**
 * Central e preferências de notificação (QRO-17).
 *
 * `GET /notificacoes` (paginada por número de página), `GET /notificacoes/nao-lidas`,
 * `PATCH /notificacoes/:id/lida` e `GET/PATCH /preferencias/notificacoes`.
 * O agrupamento de eventos parecidos e os lembretes de prazo são feitos pelo
 * backend; a tela só mostra o que chega. Sem `VITE_API_URL` a central fica vazia.
 */

import { api, apiConfigurada, ErroDeApi } from "./cliente";
import { paginaDe, type Pagina, type RespostaPaginada } from "./paginacao";

/** Tipos de `notificacoes/catalogo.py`, na mesma ordem. */
export const TIPOS_DE_NOTIFICACAO = [
  { tipo: "anuncio_compativel", rotulo: "Anúncio compatível na região" },
  { tipo: "convite_recomendacao", rotulo: "Convite para enviar oferta" },
  { tipo: "oferta_recebida", rotulo: "Oferta recebida" },
  { tipo: "oferta_atualizada", rotulo: "Oferta atualizada" },
  { tipo: "contraproposta_recebida", rotulo: "Contraproposta recebida" },
  { tipo: "contraproposta_vencendo", rotulo: "Contraproposta perto do vencimento" },
  { tipo: "mensagem_recebida", rotulo: "Mensagem recebida" },
  { tipo: "negociacao_atualizada", rotulo: "Negociação atualizada" },
  { tipo: "negociacao_concluida", rotulo: "Negociação concluída" },
  { tipo: "avaliacao_recebida", rotulo: "Avaliação publicada" },
  { tipo: "seguranca_conta", rotulo: "Segurança da conta" },
] as const;

export type TipoDeNotificacao = (typeof TIPOS_DE_NOTIFICACAO)[number]["tipo"];
export type Canal = "aplicativo" | "email";

export const CANAIS: { canal: Canal; rotulo: string }[] = [
  { canal: "aplicativo", rotulo: "No aplicativo" },
  { canal: "email", rotulo: "Por e-mail" },
];

/** Avisos de segurança não podem ser desligados (regra do backend). */
export const TIPO_OBRIGATORIO: TipoDeNotificacao = "seguranca_conta";

export const rotuloDoTipo = (tipo: string) =>
  TIPOS_DE_NOTIFICACAO.find((item) => item.tipo === tipo)?.rotulo ?? "Aviso";

export interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  anuncioId: string | null;
  ofertaId: string | null;
  negociacaoId: string | null;
  criadaEm: string;
  lidaEm: string | null;
}

export interface Preferencia {
  tipo: TipoDeNotificacao;
  canal: Canal;
  habilitada: boolean;
}

interface NotificacaoDaApi {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  anuncio: string | null;
  oferta: string | null;
  negociacao: string | null;
  criada_em: string;
  lida_em: string | null;
}

const notificacaoDaApi = (notificacao: NotificacaoDaApi): Notificacao => ({
  id: notificacao.id,
  tipo: notificacao.tipo,
  titulo: notificacao.titulo,
  mensagem: notificacao.mensagem,
  anuncioId: notificacao.anuncio ?? null,
  ofertaId: notificacao.oferta ?? null,
  negociacaoId: notificacao.negociacao ?? null,
  criadaEm: notificacao.criada_em,
  lidaEm: notificacao.lida_em,
});

/**
 * Para onde a notificação leva. Conversa, contraproposta e andamento abrem a
 * negociação da oferta; ofertas novas abrem a lista do comprador.
 */
export function destinoDaNotificacao(notificacao: Notificacao): string | null {
  const { tipo, anuncioId, ofertaId, negociacaoId } = notificacao;
  if (tipo === "seguranca_conta") return "/perfil";
  if (tipo === "negociacao_concluida" && ofertaId) return `/negociacoes/${ofertaId}/avaliar`;
  if (tipo === "avaliacao_recebida" && negociacaoId) return `/historico/${negociacaoId}`;
  if ((tipo === "oferta_recebida" || tipo === "oferta_atualizada") && anuncioId) return `/anuncios/${anuncioId}/ofertas`;
  if (ofertaId) return `/negociacoes/${ofertaId}`;
  if (anuncioId) return `/anuncios/${anuncioId}`;
  return null;
}

export async function listarNotificacoes(pagina: number | string | null = 1): Promise<Pagina<Notificacao>> {
  if (!apiConfigurada()) return { itens: [], proximo: null };
  const resposta = await api.get<RespostaPaginada<NotificacaoDaApi>>("/notificacoes", {
    parametros: { page: pagina ?? 1 },
  });
  return paginaDe(resposta, notificacaoDaApi, "page");
}

export async function contarNaoLidas(): Promise<number> {
  if (!apiConfigurada()) return 0;
  const resposta = await api.get<{ nao_lidas: number }>("/notificacoes/nao-lidas");
  return resposta.nao_lidas ?? 0;
}

export async function marcarComoLida(id: string): Promise<Notificacao> {
  if (!apiConfigurada()) throw new ErroDeApi("Notificações dependem da API.", { codigo: "sem-api" });
  return notificacaoDaApi(await api.patch<NotificacaoDaApi>(`/notificacoes/${id}/lida`));
}

export async function obterPreferencias(): Promise<Preferencia[]> {
  if (!apiConfigurada()) {
    return TIPOS_DE_NOTIFICACAO.flatMap(({ tipo }) => CANAIS.map(({ canal }) => ({ tipo, canal, habilitada: true })));
  }
  const resposta = await api.get<{ preferencias: Preferencia[] }>("/preferencias/notificacoes");
  return resposta.preferencias;
}

export async function salvarPreferencias(preferencias: Preferencia[]): Promise<Preferencia[]> {
  if (!apiConfigurada()) throw new ErroDeApi("Preferências dependem da API.", { codigo: "sem-api" });
  const resposta = await api.patch<{ preferencias: Preferencia[] }>("/preferencias/notificacoes", { preferencias });
  return resposta.preferencias;
}
