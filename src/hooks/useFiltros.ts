import { useCallback } from "react";
import { useSearchParams } from "react-router";
import type { FiltrosDeAnuncio, OrdenacaoDeAnuncio, TipoDeAnuncio } from "@/api/anuncios";

const TIPOS: TipoDeAnuncio[] = ["todos", "procurando", "vendendo"];
const ORDENACOES: OrdenacaoDeAnuncio[] = ["recentes", "proximos", "maior-valor"];

function valorValido<T extends string>(valor: string | null, permitidos: T[], padrao: T): T {
  return permitidos.includes((valor ?? "") as T) ? (valor as T) : padrao;
}

/**
 * Filtros do feed guardados na URL.
 *
 * A URL é o estado: um feed filtrado pode ser compartilhado, recarregado e
 * volta igual, e a busca do cabeçalho escreve no mesmo lugar (`?q=`).
 */
export function useFiltros() {
  const [parametros, definirParametros] = useSearchParams();

  const filtros: Required<FiltrosDeAnuncio> = {
    tipo: valorValido(parametros.get("tipo"), TIPOS, "todos"),
    categoria: parametros.get("categoria") ?? "all",
    busca: parametros.get("q") ?? "",
    ordenacao: valorValido(parametros.get("ordenar"), ORDENACOES, "recentes"),
  };

  const atualizar = useCallback(
    (chave: string, valor: string | undefined, padrao: string) => {
      definirParametros(
        (atuais) => {
          const proximos = new URLSearchParams(atuais);
          if (!valor || valor === padrao) proximos.delete(chave);
          else proximos.set(chave, valor);
          return proximos;
        },
        { replace: true },
      );
    },
    [definirParametros],
  );

  return {
    filtros,
    definirTipo: (tipo: TipoDeAnuncio) => atualizar("tipo", tipo, "todos"),
    definirCategoria: (categoria: string) => atualizar("categoria", categoria, "all"),
    definirBusca: (busca: string) => atualizar("q", busca, ""),
    definirOrdenacao: (ordenacao: OrdenacaoDeAnuncio) => atualizar("ordenar", ordenacao, "recentes"),
    limpar: () => definirParametros(new URLSearchParams(), { replace: true }),
    temFiltroAtivo:
      filtros.tipo !== "todos" ||
      filtros.categoria !== "all" ||
      filtros.busca !== "" ||
      filtros.ordenacao !== "recentes",
  };
}
