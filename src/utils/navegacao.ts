/**
 * Destino de `?retorno=` aceito só quando é um caminho interno da SPA.
 * Barra dupla, barra invertida ou URL absoluta mandariam a pessoa para fora.
 */
export function destinoSeguro(valor: string | null | undefined, padrao = "/") {
  if (!valor || !valor.startsWith("/") || valor.startsWith("//") || valor.includes("\\")) return padrao;
  // Não faz sentido voltar para as próprias telas de autenticação.
  if (/^\/(entrar|cadastrar|redefinir-senha)(\/|\?|$)/.test(valor)) return padrao;
  return valor;
}
