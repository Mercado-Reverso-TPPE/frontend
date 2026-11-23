/**
 * Destino de `?retorno=` aceito só quando é um caminho interno da SPA.
 * Barra dupla, barra invertida ou URL absoluta mandariam a pessoa para fora.
 */
export function destinoSeguro(valor: string | null | undefined, padrao = "/") {
  if (!valor || !valor.startsWith("/") || valor.startsWith("//") || valor.includes("\\")) return padrao;
  // Não faz sentido voltar para as próprias telas de autenticação.
  if (/^\/(entrar|cadastrar|redefinir-senha|confirmar-email)(\/|\?|$)/.test(valor)) return padrao;
  return valor;
}

/** Link para entrar e voltar a `destino` depois (QRO-02). */
export const entrarComRetorno = (destino: string) =>
  destino === "/" ? "/entrar" : `/entrar?retorno=${encodeURIComponent(destino)}`;

/** Link para criar conta e voltar a `destino` depois. */
export const cadastrarComRetorno = (destino: string) =>
  destino === "/" ? "/cadastrar" : `/cadastrar?retorno=${encodeURIComponent(destino)}`;
