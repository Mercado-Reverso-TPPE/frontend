import { useQuery } from "@tanstack/react-query";
import { listarAnuncios, type FiltrosDeAnuncio } from "@/api/anuncios";

/** Chave de cache do feed — exportada para invalidação em mutações futuras. */
export const chaveDeAnuncios = (filtros: FiltrosDeAnuncio) => ["anuncios", filtros] as const;

/**
 * Feed de anúncios com cache, revalidação e estados de carregamento e erro
 * entregues prontos para a tela.
 */
export function useAnuncios(filtros: FiltrosDeAnuncio) {
  return useQuery({
    queryKey: chaveDeAnuncios(filtros),
    queryFn: ({ signal }) => listarAnuncios(filtros, { sinal: signal }),
  });
}
