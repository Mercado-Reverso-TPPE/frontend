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
  id: string | number;
  nota: number;
  comentario: string;
  autor_nome?: string;
  autor_foto?: string;
  criado_em?: string;
}

const AVALIACOES_DEMO_PADRAO: AvaliacaoDoPerfil[] = [
  {
    id: "av-1",
    nota: 5,
    comentario: "Excelente negociação, pontual e produto conforme o combinado!",
    autorNome: "Diego M.",
    data: "28/08/2026",
  },
  {
    id: "av-2",
    nota: 5,
    comentario: "Muito atenciosa e rápida nas respostas. Recomendo a todos!",
    autorNome: "Ana P.",
    data: "15/08/2026",
  },
  {
    id: "av-3",
    nota: 4,
    comentario: "Transação tranquila, tudo certo.",
    autorNome: "Carlos M.",
    data: "02/08/2026",
  },
];

let avaliacoesDemo: AvaliacaoDoPerfil[] | null = null;

export function definirAvaliacoesDemo(avaliacoes: AvaliacaoDoPerfil[] | null) {
  avaliacoesDemo = avaliacoes;
}

export async function listarAvaliacoesDoPerfil(usuario?: User | null): Promise<AvaliacaoDoPerfil[]> {
  if (!apiConfigurada()) {
    if (avaliacoesDemo !== null) return avaliacoesDemo;
    if (usuario && (usuario.reviews === 0 || usuario.rating === 0)) return [];
    return AVALIACOES_DEMO_PADRAO;
  }

  try {
    const res = await api.get<{ results?: AvaliacaoDoPerfilDaApi[] } | AvaliacaoDoPerfilDaApi[]>("/perfil/avaliacoes");
    const lista = Array.isArray(res) ? res : (res.results ?? []);
    return lista.map((item) => ({
      id: String(item.id),
      nota: Number(item.nota),
      comentario: item.comentario ?? "",
      autorNome: item.autor_nome ?? "Usuário",
      autorFoto: item.autor_foto,
      data: item.criado_em ? item.criado_em.slice(0, 10) : "",
    }));
  } catch {
    return [];
  }
}
