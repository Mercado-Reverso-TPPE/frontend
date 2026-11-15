import { useQuery } from "@tanstack/react-query";
import { localizarNegociacao, obterNegociacao } from "@/api/negociacoes";

/** Chave do id da negociação aberta para uma oferta; o aceite grava aqui. */
export const chaveDaNegociacaoDaOferta = (ofertaId: string) => ["negociacao-da-oferta", ofertaId] as const;

/**
 * A negociação aberta pelo aceite de uma oferta. As rotas `/negociacoes/:id`
 * usam o id da oferta (é ele que identifica a conversa), então a negociação
 * é localizada a partir dela.
 */
export function useNegociacaoDaOferta(
  ofertaId: string,
  { habilitado = true, negociacaoConhecida }: { habilitado?: boolean; negociacaoConhecida?: string | null } = {},
) {
  const id = useQuery({
    queryKey: chaveDaNegociacaoDaOferta(ofertaId),
    queryFn: () => localizarNegociacao(ofertaId, negociacaoConhecida),
    enabled: habilitado && ofertaId !== "",
    staleTime: Infinity,
  });

  const negociacao = useQuery({
    queryKey: ["negociacao", id.data],
    queryFn: () => obterNegociacao(id.data as string),
    enabled: Boolean(id.data),
  });

  return {
    /** Ainda procurando ou carregando. */
    carregando: id.isPending && id.fetchStatus !== "idle" ? true : Boolean(id.data) && negociacao.isPending,
    erro: id.error ?? negociacao.error,
    naoEncontrada: id.isSuccess && id.data === null,
    negociacao: negociacao.data,
    recarregar: () => (id.data ? negociacao.refetch() : id.refetch()),
  };
}
