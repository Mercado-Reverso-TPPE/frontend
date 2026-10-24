/** Regras de formulário espelhadas do backend, para avisar antes de enviar. */

/** Mínimo exigido pelo cadastro e pela redefinição de senha no backend. */
export const SENHA_MINIMA = 10;

export function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Mensagem para a senha, ou `undefined` se passou. */
export function erroDeSenha(senha: string) {
  if (!senha) return "Informe a senha.";
  if (senha.length < SENHA_MINIMA) return `A senha precisa de pelo menos ${SENHA_MINIMA} caracteres.`;
  if (/^\d+$/.test(senha)) return "A senha não pode ter só números.";
  return undefined;
}

/** Mensagem para o e-mail, ou `undefined` se passou. */
export function erroDeEmail(email: string) {
  if (!email.trim()) return "Informe o e-mail.";
  if (!emailValido(email)) return "Informe um e-mail válido, como nome@exemplo.com.";
  return undefined;
}
