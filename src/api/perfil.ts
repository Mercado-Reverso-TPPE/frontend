/**
 * Recurso do perfil da pessoa autenticada (QRO-03).
 *
 * `PATCH /perfil` atualiza nome, telefone, foto e localização; o backend
 * geocodifica CEP ou cidade/UF e devolve o perfil inteiro. A troca de e-mail
 * tem duas etapas: `POST /perfil/email` envia um link ao novo endereço e
 * `POST /perfil/email/confirmar` efetiva a troca.
 */

import { api } from "./cliente";
import { iniciais, usuarioDoPerfil, type PerfilDaApi } from "./autenticacao";
import type { User } from "./tipos";
import { fmtData } from "@/utils/formato";

export interface DadosPessoais {
  nome: string;
  telefone: string;
  foto: string;
}

export interface LocalizacaoInformada {
  cep: string;
  cidade: string;
  uf: string;
}

export type AlteracaoDePerfil =
  | { dadosPessoais: DadosPessoais }
  | { localizacao: LocalizacaoInformada };

/** Salva uma parte do perfil e devolve o usuário já atualizado. */
export async function atualizarPerfil(alteracao: AlteracaoDePerfil, atual: User): Promise<User> {
  if ("dadosPessoais" in alteracao) {
    const { nome, telefone, foto } = alteracao.dadosPessoais;
    const corpo = { nome: nome.trim(), telefone: telefone.trim(), foto: foto.trim() };
    return usuarioDoPerfil(await api.patch<PerfilDaApi>("/perfil", corpo));
  }

  const { cep, cidade, uf } = alteracao.localizacao;
  const corpo = { localizacao: { cep: cep.trim(), cidade: cidade.trim(), uf: uf.trim().toUpperCase() } };
  return usuarioDoPerfil(await api.patch<PerfilDaApi>("/perfil", corpo));
}

/** Envia o link de confirmação ao novo endereço. O e-mail atual segue valendo. */
export async function solicitarAlteracaoDeEmail(novoEmail: string): Promise<void> {
  await api.post("/perfil/email", { novo_email: novoEmail.trim() });
}

/** Efetiva a troca a partir do token do link. */
export async function confirmarAlteracaoDeEmail(token: string): Promise<void> {
  await api.post("/perfil/email/confirmar", { token });
}

export interface AvaliacaoDoPerfil {
  id: string;
  nota: number;
  comentario: string;
  autorNome: string;
  autorIniciais?: string;
  autorFoto?: string;
  data: string;
}

export interface AvaliacaoDoPerfilDaApi {
  id: string;
  nota: number;
  comentario: string | null;
  autor_nome?: string | null;
  publicada_em: string | null;
  criada_em: string;
}

/** Avaliações publicadas sobre a pessoa (`GET /usuarios/:id/avaliacoes`), mais recentes primeiro. */
export async function listarAvaliacoesDoPerfil(usuario?: User | null): Promise<AvaliacaoDoPerfil[]> {
  if (!usuario) return [];
  const resposta = await api.get<{ results: AvaliacaoDoPerfilDaApi[] }>(`/usuarios/${usuario.id}/avaliacoes`);
  return resposta.results.map((item) => ({
    id: String(item.id),
    nota: Number(item.nota),
    comentario: item.comentario ?? "",
    autorNome: item.autor_nome || "Usuário",
    autorIniciais: iniciais(item.autor_nome || "Usuário"),
    data: fmtData(item.publicada_em ?? item.criada_em),
  }));
}
