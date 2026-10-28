/**
 * Recurso do perfil da pessoa autenticada (QRO-03).
 *
 * `PATCH /perfil` atualiza nome, telefone, foto e localização; o backend
 * geocodifica CEP ou cidade/UF e devolve o perfil inteiro. A troca de e-mail
 * tem duas etapas: `POST /perfil/email` envia um link ao novo endereço e
 * `POST /perfil/email/confirmar` efetiva a troca.
 */

import { api, apiConfigurada } from "./cliente";
import { iniciais, usuarioDoPerfil, type PerfilDaApi } from "./autenticacao";
import type { User } from "./tipos";

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

const esperar = () => new Promise((resolve) => setTimeout(resolve, 300));

/** Salva uma parte do perfil e devolve o usuário já atualizado. */
export async function atualizarPerfil(alteracao: AlteracaoDePerfil, atual: User): Promise<User> {
  if ("dadosPessoais" in alteracao) {
    const { nome, telefone, foto } = alteracao.dadosPessoais;
    const corpo = { nome: nome.trim(), telefone: telefone.trim(), foto: foto.trim() };
    if (!apiConfigurada()) {
      await esperar();
      return {
        ...atual,
        name: corpo.nome,
        initials: iniciais(corpo.nome),
        phone: corpo.telefone,
        photo: corpo.foto || undefined,
      };
    }
    return usuarioDoPerfil(await api.patch<PerfilDaApi>("/perfil", corpo));
  }

  const { cep, cidade, uf } = alteracao.localizacao;
  const corpo = { localizacao: { cep: cep.trim(), cidade: cidade.trim(), uf: uf.trim().toUpperCase() } };
  if (!apiConfigurada()) {
    await esperar();
    return { ...atual, cep: corpo.localizacao.cep, city: corpo.localizacao.cidade, state: corpo.localizacao.uf };
  }
  return usuarioDoPerfil(await api.patch<PerfilDaApi>("/perfil", corpo));
}

/** Envia o link de confirmação ao novo endereço. O e-mail atual segue valendo. */
export async function solicitarAlteracaoDeEmail(novoEmail: string): Promise<void> {
  if (!apiConfigurada()) {
    await esperar();
    return;
  }
  await api.post("/perfil/email", { novo_email: novoEmail.trim() });
}

/** Efetiva a troca a partir do token do link. */
export async function confirmarAlteracaoDeEmail(token: string): Promise<void> {
  if (!apiConfigurada()) {
    await esperar();
    return;
  }
  await api.post("/perfil/email/confirmar", { token });
}
