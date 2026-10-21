import { QueryClient } from "@tanstack/react-query";
import { ErroDeApi } from "./cliente";

/**
 * Cliente do TanStack Query usado pela SPA e pelos testes.
 *
 * Erro de dados (400, 404, validação) não se resolve repetindo a chamada;
 * por isso só falha de rede, tempo limite e 5xx são tentadas de novo.
 */
export function criarClienteDeConsulta() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (tentativas, erro) =>
          erro instanceof ErroDeApi && erro.recuperavel ? tentativas < 2 : false,
        refetchOnWindowFocus: false,
      },
    },
  });
}
