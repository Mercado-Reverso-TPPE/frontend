/**
 * Recurso de contas e sessão (QRO-01, QRO-02).
 *
 * Fala com os endpoints do backend: `POST /usuarios`, `POST|DELETE /sessoes`,
 * `POST /sessoes/renovar`, `GET /perfil` e `POST /senha/redefinir[/confirmar]`.
 * Sem `VITE_API_URL`, responde com o usuário de demonstração.
 *
 * A senha só passa por aqui dentro do corpo da requisição: não vai para a URL,
 * para o armazenamento do navegador nem para logs.
 */

import { api, apiConfigurada } from "./cliente";
import type { User } from "./tipos";
import { ME } from "@/dados/demo";

export interface Credenciais {
  email: string;
  senha: string;
}

export interface DadosDeCadastro extends Credenciais {
  nome: string;
  telefone?: string;
  cidade?: string;
  uf?: string;
}

export interface Tokens {
  acesso: string;
  renovacao: string;
}

/** Corpo de `GET /perfil`. */
export interface PerfilDaApi {
  id: string | number;
  nome: string;
  email: string;
  telefone: string;
  foto: string;
  reputacao: number | string;
  localizacao: {
    cep: string;
    cidade: string;
    uf: string;
    longitude: number;
    latitude: number;
  } | null;
}

const ATRASO_DEMO_MS = 400;
const esperar = () => new Promise((resolve) => setTimeout(resolve, ATRASO_DEMO_MS));

/** Iniciais exibidas no avatar: primeira e última palavra do nome. */
export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0]![0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1]![0] ?? "") : "";
  return (primeira + ultima).toUpperCase();
}

/** Converte o perfil da API no `User` que as telas consomem. */
export function usuarioDoPerfil(perfil: PerfilDaApi): User {
  return {
    id: String(perfil.id),
    name: perfil.nome,
    initials: iniciais(perfil.nome),
    color: ME.color,
    rating: Number(perfil.reputacao) || 0,
    reviews: 0,
    city: perfil.localizacao?.cidade ?? "",
    state: perfil.localizacao?.uf ?? "",
    phone: perfil.telefone,
    role: "both",
    joinedAt: "",
    email: perfil.email,
    photo: perfil.foto || undefined,
  };
}

/** Abre a sessão e devolve os dois tokens. */
export async function abrirSessao({ email, senha }: Credenciais): Promise<Tokens> {
  if (!apiConfigurada()) {
    await esperar();
    return { acesso: "demo", renovacao: "demo" };
  }
  const resposta = await api.post<{ access: string; refresh: string }>(
    "/sessoes",
    { email: email.trim(), password: senha },
    { semRenovacao: true },
  );
  return { acesso: resposta.access, renovacao: resposta.refresh };
}

/** Troca o token de renovação por um novo par (o backend gira os dois). */
export async function renovarTokens(renovacao: string): Promise<Tokens> {
  if (!apiConfigurada()) return { acesso: "demo", renovacao };
  const resposta = await api.post<{ access: string; refresh?: string }>(
    "/sessoes/renovar",
    { refresh: renovacao },
    { semRenovacao: true },
  );
  return { acesso: resposta.access, renovacao: resposta.refresh ?? renovacao };
}

/** Invalida o token de renovação no servidor. */
export async function encerrarSessao(renovacao: string): Promise<void> {
  if (!apiConfigurada()) return;
  await api.remove<void>("/sessoes", { refresh: renovacao });
}

/** Perfil da pessoa autenticada. */
export async function obterPerfil(): Promise<User> {
  if (!apiConfigurada()) return ME;
  return usuarioDoPerfil(await api.get<PerfilDaApi>("/perfil"));
}

/** Cria a conta. Não abre sessão: quem chama entra em seguida. */
export async function cadastrarConta(dados: DadosDeCadastro): Promise<void> {
  if (!apiConfigurada()) {
    await esperar();
    return;
  }
  const opcional = (valor?: string) => (valor?.trim() ? valor.trim() : undefined);
  await api.post("/usuarios", {
    nome: dados.nome.trim(),
    email: dados.email.trim(),
    senha: dados.senha,
    telefone: opcional(dados.telefone),
    cidade: opcional(dados.cidade),
    uf: opcional(dados.cidade) ? opcional(dados.uf) : undefined,
  });
}

/**
 * Pede o link de redefinição. A resposta é a mesma exista ou não a conta,
 * então a tela também não diferencia os casos.
 */
export async function solicitarRedefinicaoDeSenha(email: string): Promise<void> {
  if (!apiConfigurada()) {
    await esperar();
    return;
  }
  await api.post("/senha/redefinir", { email: email.trim() });
}

/** Grava a nova senha a partir do `uid` e do `token` do link enviado por e-mail. */
export async function confirmarRedefinicaoDeSenha(dados: {
  uid: string;
  token: string;
  novaSenha: string;
}): Promise<void> {
  if (!apiConfigurada()) {
    await esperar();
    return;
  }
  await api.post("/senha/redefinir/confirmar", {
    uid: dados.uid,
    token: dados.token,
    nova_senha: dados.novaSenha,
  });
}
