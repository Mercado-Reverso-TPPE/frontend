/**
 * Paginação por cursor do Django REST Framework: a resposta traz `next` com a
 * URL da próxima página, e a SPA só guarda o parâmetro `cursor` dela.
 */

export interface RespostaPaginada<T> {
  next: string | null;
  results: T[];
}

export interface Pagina<T> {
  itens: T[];
  /** Cursor da próxima página; `null` quando acabou. */
  proximo: string | null;
}

/** Extrai um parâmetro da URL `next` (por padrão, `cursor`). */
export function cursorDe(proxima: string | null, parametro = "cursor") {
  if (!proxima) return null;
  try {
    return new URL(proxima).searchParams.get(parametro);
  } catch {
    return null;
  }
}

/** Converte uma página da API com a função de conversão de cada item. */
export function paginaDe<D, T>(resposta: RespostaPaginada<D>, converter: (item: D) => T, parametro = "cursor"): Pagina<T> {
  return { itens: resposta.results.map(converter), proximo: cursorDe(resposta.next, parametro) };
}
