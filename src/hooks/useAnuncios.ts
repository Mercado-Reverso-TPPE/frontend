import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  FILTROS_PADRAO,
  listarFeed,
  listarRecomendacoes,
  type FiltrosDoFeed,
} from "@/api/anuncios";

/** Feed paginado: cada "carregar mais" busca a página seguinte pelo cursor. */
export function useFeed(filtros: FiltrosDoFeed, habilitado = true) {
  return useInfiniteQuery({
    queryKey: ["anuncios", "feed", filtros],
    queryFn: ({ pageParam, signal }) => listarFeed(filtros, { cursor: pageParam, sinal: signal }),
    initialPageParam: null as string | null,
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
