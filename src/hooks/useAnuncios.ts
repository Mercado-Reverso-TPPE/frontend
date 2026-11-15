import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  FILTROS_PADRAO,
  listarFeed,
  listarRecomendacoes,
  type FiltrosDoFeed,
} from "@/api/anuncios";
import { listarItensDoFeed, type CursorDoFeed } from "@/api/feed";
import { ESTATISTICAS_DE_DEMONSTRACAO, obterEstatisticas } from "@/api/estatisticas";

/**
 * Feed paginado da aba escolhida: cada "carregar mais" busca a página
 * seguinte de cada fonte pelo próprio cursor.
 */
export function useFeed(filtros: FiltrosDoFeed, habilitado = true) {
  return useInfiniteQuery({
    queryKey: ["anuncios", "feed", filtros],
    queryFn: ({ pageParam, signal }) => listarItensDoFeed(filtros, { cursor: pageParam, sinal: signal }),
    initialPageParam: {} as CursorDoFeed,
    getNextPageParam: (pagina) => pagina.proximo,
    enabled: habilitado,
  });
}

/** Carrossel "Perto de você": os mais próximos, sem os filtros da lista. */
export function usePertoDeVoce(habilitado = true) {
  return useQuery({
    queryKey: ["anuncios", "perto"],
    queryFn: ({ signal }) =>
      listarFeed({ ...FILTROS_PADRAO, ordenacao: "distancia" }, { tamanho: 10, sinal: signal }),
    enabled: habilitado,
  });
}

export function useRecomendacoes(habilitado = true) {
  return useQuery({ queryKey: ["anuncios", "recomendados"], queryFn: listarRecomendacoes, enabled: habilitado });
}

/**
 * Métricas públicas do hero. Qualquer falha cai para os números de
 * demonstração para não deixar o hero vazio.
 */
export function useEstatisticas() {
  const consulta = useQuery({
    queryKey: ["estatisticas"],
    queryFn: obterEstatisticas,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return consulta.isError ? ESTATISTICAS_DE_DEMONSTRACAO : consulta.data;
}
