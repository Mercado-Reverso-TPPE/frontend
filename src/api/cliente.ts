/**
 * Cliente HTTP da SPA.
 *
 * Toda chamada de rede passa por aqui: uma base de URL, um formato de erro e
 * um tempo limite. Nenhum componente deve chamar `fetch` direto — assim o
 * tratamento de carregamento e erro fica uniforme em todas as telas.
 *
 * O contrato oficial da API ainda não foi publicado. Enquanto `VITE_API_URL`
 * estiver vazia, os recursos em `api/` respondem com os dados de
 * demonstração e `apiConfigurada()` devolve `false`.
 */

/** Base da API. Lida a cada chamada para que os testes possam trocá-la. */
export const urlDaApi = () => (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

const TEMPO_LIMITE_PADRAO = Number(import.meta.env.VITE_API_TIMEOUT ?? 15000);

/** Há uma API configurada para este ambiente? */
export const apiConfigurada = () => urlDaApi() !== "";

export type CodigoDeErro =
  | "rede"
  | "tempo-esgotado"
  | "cancelado"
  | "http"
  | "formato"
  | "sem-api";

/** Erro único do cliente: as telas só precisam ler `mensagem` e `codigo`. */
export class ErroDeApi extends Error {
  readonly codigo: CodigoDeErro;
  readonly status: number;
  readonly detalhes?: unknown;

  constructor(
    mensagem: string,
    { codigo = "http", status = 0, detalhes }: { codigo?: CodigoDeErro; status?: number; detalhes?: unknown } = {},
  ) {
    super(mensagem);
    this.name = "ErroDeApi";
    this.codigo = codigo;
    this.status = status;
    this.detalhes = detalhes;
  }

  /** Vale oferecer "tentar de novo" para este erro? */
  get recuperavel() {
    return this.codigo === "rede" || this.codigo === "tempo-esgotado" || this.status >= 500;
  }
}

/** Mensagem em português para o usuário, por status HTTP. */
function mensagemPorStatus(status: number) {
  if (status === 400 || status === 422) return "Os dados enviados não foram aceitos. Revise e tente de novo.";
  if (status === 401) return "Sua sessão expirou. Entre novamente para continuar.";
  if (status === 403) return "Você não tem permissão para esta ação.";
  if (status === 404) return "Não encontramos o que você procura.";
  if (status === 409) return "Esta ação conflita com o estado atual da negociação.";
  if (status === 429) return "Muitas tentativas em pouco tempo. Aguarde um instante.";
  if (status >= 500) return "A plataforma está instável neste momento. Tente de novo em alguns instantes.";
  return "Não foi possível completar a solicitação.";
}

let tokenDeAcesso: string | null = null;

/** A sessão registra aqui o token que o cliente envia em cada requisição. */
export function definirTokenDeAcesso(token: string | null) {
  tokenDeAcesso = token;
}

/**
 * Renova o token de acesso quando ele expira. Devolve `true` se conseguiu.
 * Quem registra é a sessão, que sabe onde está o token de renovação.
 */
type Renovador = () => Promise<boolean>;
let renovador: Renovador | null = null;
let renovacaoEmCurso: Promise<boolean> | null = null;

export function definirRenovadorDeSessao(funcao: Renovador | null) {
  renovador = funcao;
}

/** Várias requisições com 401 ao mesmo tempo disparam uma renovação só. */
function renovarSessao() {
  if (!renovador) return Promise.resolve(false);
  renovacaoEmCurso ??= renovador()
    .catch(() => false)
    .finally(() => {
      renovacaoEmCurso = null;
    });
  return renovacaoEmCurso;
}

export type Parametros = Record<string, string | number | boolean | undefined | null>;

export interface OpcoesDeRequisicao {
  metodo?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  corpo?: unknown;
  parametros?: Parametros;
  cabecalhos?: Record<string, string>;
  sinal?: AbortSignal;
  tempoLimiteMs?: number;
  /** Não tenta renovar a sessão num 401 (login, renovação e a nova tentativa). */
  semRenovacao?: boolean;
}

function montarUrl(caminho: string, parametros?: Parametros) {
  const base = `${urlDaApi()}${caminho.startsWith("/") ? caminho : `/${caminho}`}`;
  if (!parametros) return base;

  const busca = new URLSearchParams();
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== null && valor !== "") busca.set(chave, String(valor));
  }
  const consulta = busca.toString();
  return consulta ? `${base}?${consulta}` : base;
}

/**
 * Executa uma requisição e devolve o corpo já convertido.
 * Qualquer falha — rede, tempo limite, status de erro, JSON inválido —
 * chega às telas como `ErroDeApi`.
 */
export async function requisicao<T>(caminho: string, opcoes: OpcoesDeRequisicao = {}): Promise<T> {
  const {
    metodo = "GET",
    corpo,
    parametros,
    cabecalhos,
    sinal,
    tempoLimiteMs = TEMPO_LIMITE_PADRAO,
    semRenovacao = false,
  } = opcoes;

  if (!apiConfigurada()) {
    throw new ErroDeApi(
      "Nenhuma API configurada para este ambiente. Defina VITE_API_URL para integrar o backend.",
      { codigo: "sem-api" },
    );
  }

  const controlador = new AbortController();
  const expirou = { valor: false };
  const temporizador = setTimeout(() => {
    expirou.valor = true;
    controlador.abort();
  }, tempoLimiteMs);
  const cancelarExterno = () => controlador.abort();
  sinal?.addEventListener("abort", cancelarExterno);

  try {
    const resposta = await fetch(montarUrl(caminho, parametros), {
      method: metodo,
      signal: controlador.signal,
      headers: {
        Accept: "application/json",
        ...(corpo !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(tokenDeAcesso ? { Authorization: `Bearer ${tokenDeAcesso}` } : {}),
        ...cabecalhos,
      },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });

    // Token expirado: renova uma vez e repete a mesma chamada.
    if (resposta.status === 401 && tokenDeAcesso && !semRenovacao && (await renovarSessao())) {
      return await requisicao<T>(caminho, { ...opcoes, semRenovacao: true });
    }

    if (resposta.status === 204) return undefined as T;

    const texto = await resposta.text();
    let dados: unknown = undefined;
    if (texto) {
      try {
        dados = JSON.parse(texto);
      } catch {
        if (resposta.ok) {
          throw new ErroDeApi("A resposta da API não é um JSON válido.", {
            codigo: "formato",
            status: resposta.status,
          });
        }
      }
    }

    if (!resposta.ok) {
      const detalhe = (dados as { mensagem?: string; message?: string; detail?: string } | undefined);
      throw new ErroDeApi(detalhe?.mensagem ?? detalhe?.message ?? detalhe?.detail ?? mensagemPorStatus(resposta.status), {
        codigo: "http",
        status: resposta.status,
        detalhes: dados,
      });
    }

    return dados as T;
  } catch (erro) {
    if (erro instanceof ErroDeApi) throw erro;

    if (erro instanceof DOMException && erro.name === "AbortError") {
      throw expirou.valor
        ? new ErroDeApi("A API demorou demais para responder.", { codigo: "tempo-esgotado" })
        : new ErroDeApi("Requisição cancelada.", { codigo: "cancelado" });
    }

    throw new ErroDeApi("Não foi possível falar com o servidor. Verifique sua conexão.", {
      codigo: "rede",
      detalhes: erro,
    });
  } finally {
    clearTimeout(temporizador);
    sinal?.removeEventListener("abort", cancelarExterno);
  }
}

/** Erros de validação separados por campo, como o Django REST Framework devolve. */
export interface ErrosDeValidacao {
  campos: Record<string, string>;
  /** Erro que não pertence a um campo (`non_field_errors`, `detail` ou lista solta). */
  geral?: string;
}

function primeiraMensagem(valor: unknown): string | undefined {
  if (typeof valor === "string") return valor;
  if (Array.isArray(valor)) return valor.map(primeiraMensagem).find(Boolean);
  if (valor && typeof valor === "object") return Object.values(valor).map(primeiraMensagem).find(Boolean);
  return undefined;
}

/**
 * Lê o corpo de um 400 e devolve uma mensagem por campo. Objetos aninhados
 * (como `localizacao`) viram `localizacao.cidade`.
 */
export function errosDeValidacao(erro: unknown): ErrosDeValidacao {
  const resultado: ErrosDeValidacao = { campos: {} };
  if (!(erro instanceof ErroDeApi) || erro.status !== 400) return resultado;

  const corpo = erro.detalhes;
  if (Array.isArray(corpo) || typeof corpo === "string") {
    resultado.geral = primeiraMensagem(corpo);
    return resultado;
  }
  if (!corpo || typeof corpo !== "object") return resultado;

  const visitar = (objeto: Record<string, unknown>, prefixo: string) => {
    for (const [chave, valor] of Object.entries(objeto)) {
      if (chave === "non_field_errors" || chave === "detail") {
        resultado.geral ??= primeiraMensagem(valor);
      } else if (valor && typeof valor === "object" && !Array.isArray(valor)) {
        visitar(valor as Record<string, unknown>, `${prefixo}${chave}.`);
      } else {
        const mensagem = primeiraMensagem(valor);
        if (mensagem) resultado.campos[`${prefixo}${chave}`] = mensagem;
      }
    }
  };
  visitar(corpo as Record<string, unknown>, "");
  return resultado;
}

/** Atalhos por verbo. */
export const api = {
  get: <T>(caminho: string, opcoes?: Omit<OpcoesDeRequisicao, "metodo" | "corpo">) =>
    requisicao<T>(caminho, { ...opcoes, metodo: "GET" }),
  post: <T>(caminho: string, corpo?: unknown, opcoes?: Omit<OpcoesDeRequisicao, "metodo" | "corpo">) =>
    requisicao<T>(caminho, { ...opcoes, metodo: "POST", corpo }),
  put: <T>(caminho: string, corpo?: unknown, opcoes?: Omit<OpcoesDeRequisicao, "metodo" | "corpo">) =>
    requisicao<T>(caminho, { ...opcoes, metodo: "PUT", corpo }),
  patch: <T>(caminho: string, corpo?: unknown, opcoes?: Omit<OpcoesDeRequisicao, "metodo" | "corpo">) =>
    requisicao<T>(caminho, { ...opcoes, metodo: "PATCH", corpo }),
  remove: <T>(caminho: string, corpo?: unknown, opcoes?: Omit<OpcoesDeRequisicao, "metodo" | "corpo">) =>
    requisicao<T>(caminho, { ...opcoes, metodo: "DELETE", corpo }),
};
