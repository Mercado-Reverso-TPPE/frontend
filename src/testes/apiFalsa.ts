import { vi } from "vitest";

export interface RespostaFalsa {
  status?: number;
  corpo?: unknown;
}

export interface ChamadaRegistrada {
  metodo: string;
  caminho: string;
  corpo: unknown;
  autorizacao?: string;
  /** Parâmetros da query string. */
  parametros: Record<string, string>;
}

type Manipulador = (corpo: unknown, chamada: ChamadaRegistrada) => RespostaFalsa;

/**
 * Rotas que a tela consulta sozinha (sino do cabeçalho, avaliações do perfil,
 * métricas e contagens do feed, vitrine). Quando o teste não as define, elas
 * respondem vazias e não entram em `chamadas`, para os testes contarem só o
 * que a tela pediu.
 */
const EM_SEGUNDO_PLANO: [RegExp, RespostaFalsa][] = [
  [/^GET \/notificacoes\/nao-lidas$/, { corpo: { nao_lidas: 0 } }],
  [/^GET \/usuarios\/[^/]+\/avaliacoes$/, { corpo: { next: null, previous: null, results: [] } }],
  [/^GET \/estatisticas$/, { corpo: { anuncios_ativos: 0, cidades: 0, vendedores: 0 } }],
  // Sem contagem definida pelo teste, a consulta falha e os chips aparecem sem número.
  [/^GET \/(anuncios|vitrine)\/categorias$/, { status: 503, corpo: { detail: "Indisponível." } }],
  [/^GET \/vitrine$/, { corpo: { count: 0, next: null, results: [] } }],
];

/**
 * Liga `VITE_API_URL` e troca o `fetch` por um backend em memória.
 * As rotas são `"MÉTODO /caminho"` sem o prefixo `/api/v1`.
 */
export function simularApi(rotas: Record<string, Manipulador>) {
  vi.stubEnv("VITE_API_URL", "http://api.teste/api/v1");
  const chamadas: ChamadaRegistrada[] = [];

  const falso = vi.fn(async (url: string, init: RequestInit = {}) => {
    const endereco = new URL(url);
    const cabecalhos = (init.headers ?? {}) as Record<string, string>;
    const chamada: ChamadaRegistrada = {
      metodo: init.method ?? "GET",
      caminho: endereco.pathname.replace(/^\/api\/v1/, ""),
      corpo: init.body instanceof FormData ? init.body : init.body ? JSON.parse(String(init.body)) : undefined,
      autorizacao: cabecalhos.Authorization,
      parametros: Object.fromEntries(endereco.searchParams),
    };
    const rota = `${chamada.metodo} ${chamada.caminho}`;
    const padrao = rotas[rota] ? undefined : EM_SEGUNDO_PLANO.find(([expressao]) => expressao.test(rota));
    if (!padrao) chamadas.push(chamada);

    const manipulador: Manipulador | undefined = padrao ? () => padrao[1] : rotas[rota];
    const { status = 200, corpo } = manipulador
      ? manipulador(chamada.corpo, chamada)
      : { status: 404, corpo: { detail: "Não encontrado." } };
    const semCorpo = corpo === undefined || status === 204 || status === 205;
    return new Response(semCorpo ? null : JSON.stringify(corpo), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  });

  vi.stubGlobal("fetch", falso);
  return chamadas;
}

/** Perfil devolvido por `GET /perfil` nos testes. */
export const perfilDeTeste = {
  id: "7f1c",
  nome: "Joana da Silva",
  email: "joana@exemplo.com",
  telefone: "(61) 99999-0000",
  foto: "",
  reputacao: 4.5,
  localizacao: { cep: "70000-000", cidade: "Brasília", uf: "DF", longitude: -47.9, latitude: -15.8 },
};
