import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { FILTROS_PADRAO, type FiltrosDoFeed, type OrdenacaoDoFeed } from "@/api/anuncios";

const ORDENACOES: OrdenacaoDoFeed[] = ["distancia", "recentes", "preco_minimo", "preco_maximo"];

const numero = (valor: string | null) => {
  if (valor === null || valor === "") return null;
  const convertido = Number(valor);
  return Number.isFinite(convertido) && convertido >= 0 ? convertido : null;
};

/** Nome de cada filtro na URL. */
const CHAVES = {
  busca: "q",
  categoria: "categoria",
  precoMin: "preco_min",
  precoMax: "preco_max",
  distanciaMaxKm: "distancia",
  ordenacao: "ordenar",
} as const satisfies Record<keyof FiltrosDoFeed, string>;

/**
 * Filtros do feed guardados na URL (QRO-07).
 *
 * A URL é o estado: filtros e ordenação combinam entre si, um feed filtrado
 * pode ser compartilhado e recarregado, e voltar do detalhe devolve a mesma
 * busca. A busca do cabeçalho escreve no mesmo lugar (`?q=`).
 */
export function useFiltros() {
  const [parametros, definirParametros] = useSearchParams();

  const filtros = useMemo<FiltrosDoFeed>(() => {
    const ordenacao = parametros.get(CHAVES.ordenacao) as OrdenacaoDoFeed | null;
    return {
      busca: parametros.get(CHAVES.busca) ?? "",
      categoria: parametros.get(CHAVES.categoria) ?? "",
      precoMin: numero(parametros.get(CHAVES.precoMin)),
      precoMax: numero(parametros.get(CHAVES.precoMax)),
      distanciaMaxKm: numero(parametros.get(CHAVES.distanciaMaxKm)),
      ordenacao: ordenacao && ORDENACOES.includes(ordenacao) ? ordenacao : FILTROS_PADRAO.ordenacao,
    };
  }, [parametros]);

  const alterar = useCallback(
    (mudancas: Partial<FiltrosDoFeed>) => {
      definirParametros(
        (atuais) => {
          const proximos = new URLSearchParams(atuais);
          for (const [campo, valor] of Object.entries(mudancas) as [keyof FiltrosDoFeed, unknown][]) {
            const chave = CHAVES[campo];
            if (valor === null || valor === undefined || valor === "" || valor === FILTROS_PADRAO[campo]) {
              proximos.delete(chave);
            } else {
              proximos.set(chave, String(valor));
            }
          }
          return proximos;
        },
        { replace: true },
      );
    },
    [definirParametros],
  );

  const temFiltroAtivo = (Object.keys(CHAVES) as (keyof FiltrosDoFeed)[]).some(
    (campo) => campo !== "ordenacao" && filtros[campo] !== FILTROS_PADRAO[campo],
  );

  return {
    filtros,
    alterar,
    definirBusca: (busca: string) => alterar({ busca }),
    limpar: () => definirParametros(new URLSearchParams(), { replace: true }),
    temFiltroAtivo,
  };
}
