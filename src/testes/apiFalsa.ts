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
}

type Manipulador = (corpo: unknown, chamada: ChamadaRegistrada) => RespostaFalsa;

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
      corpo: init.body ? JSON.parse(String(init.body)) : undefined,
      autorizacao: cabecalhos.Authorization,
    };
    chamadas.push(chamada);

    const manipulador = rotas[`${chamada.metodo} ${chamada.caminho}`];
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
