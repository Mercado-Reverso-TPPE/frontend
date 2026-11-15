/**
 * Catálogo de produtos do vendedor (QRO-08).
 *
 * Endpoints: `GET/POST /produtos`, `GET/PATCH/DELETE /produtos/:id`,
 * `PATCH /produtos/:id/status`, `POST /produtos/:id/fotos` (multipart, campo
 * `fotos`) e `DELETE /produtos/:id/fotos/:fotoId`. O backend só devolve os
 * produtos da própria pessoa.
 */

import { api } from "./cliente";
import { paginaDe, type Pagina, type RespostaPaginada } from "./paginacao";
import type { EstadoDeConservacao } from "./ofertas";

export type StatusDoProduto = "disponivel" | "reservado" | "vendido";

/** Limites de `PRODUTO_FOTOS_MAXIMO`, `PRODUTO_FOTO_TAMANHO_MAXIMO_MB` e `PRODUTO_FOTO_FORMATOS`. */
export const LIMITE_DE_FOTOS = 6;
export const TAMANHO_MAXIMO_DA_FOTO_MB = 5;
export const TIPOS_DE_FOTO = ["image/jpeg", "image/png", "image/webp"];
export const FORMATOS_DE_FOTO = "JPEG, PNG ou WEBP";

export interface FotoDoProduto {
  id: number;
  url: string;
  ordem: number;
}

export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  categoriaNome: string;
  estadoDeConservacao: EstadoDeConservacao;
  preco: number;
  status: StatusDoProduto;
  fotos: FotoDoProduto[];
  criadoEm: string;
}

export interface DadosDoProduto {
  nome: string;
  descricao: string;
  categoria: string;
  estadoDeConservacao: EstadoDeConservacao;
  preco: number;
}

/**
 * O vendedor só muda o status à mão para estas transições — as mesmas de
 * `TRANSICOES_STATUS` no backend. Vendido é final. Enquanto o produto está em
 * negociação, a API recusa e explica; a tela mostra o motivo.
 */
export function transicoesDoProduto(status: StatusDoProduto): StatusDoProduto[] {
  if (status === "disponivel") return ["reservado", "vendido"];
  if (status === "reservado") return ["disponivel", "vendido"];
  return [];
}

/** Só produto disponível entra numa oferta (`_snapshot_do_produto`). */
export const podeOfertarProduto = (produto: Produto) => produto.status === "disponivel";

/** Produto vendido não pode ser editado nem receber fotos; reservado não pode ser excluído. */
export const podeEditarProduto = (produto: Produto) => produto.status !== "vendido";
export const podeExcluirProduto = (produto: Produto) => produto.status !== "reservado";

/**
 * Confere quantidade, tamanho e formato antes do envio, com as mesmas regras
 * do backend. Devolve uma mensagem por problema; vazio quando está tudo certo.
 */
export function validarFotos(arquivos: File[], jaEnviadas: number): string[] {
  const erros: string[] = [];
  if (jaEnviadas + arquivos.length > LIMITE_DE_FOTOS) {
    erros.push(`Cada produto pode ter no máximo ${LIMITE_DE_FOTOS} fotos.`);
  }
  for (const arquivo of arquivos) {
    if (!TIPOS_DE_FOTO.includes(arquivo.type)) {
      erros.push(`O arquivo ${arquivo.name} deve estar em um dos formatos: ${FORMATOS_DE_FOTO}.`);
    } else if (arquivo.size > TAMANHO_MAXIMO_DA_FOTO_MB * 1024 * 1024) {
      erros.push(`O arquivo ${arquivo.name} excede o limite de ${TAMANHO_MAXIMO_DA_FOTO_MB} MB.`);
    }
  }
  return erros;
}

interface ProdutoDaApi {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  categoria_nome: string;
  estado_conservacao: EstadoDeConservacao;
  preco: string | number;
  status: StatusDoProduto;
  fotos: { id: number; url: string; ordem: number }[];
  criado_em: string;
}

function produtoDaApi(produto: ProdutoDaApi): Produto {
  return {
    id: produto.id,
    nome: produto.nome,
    descricao: produto.descricao,
    categoria: produto.categoria,
    categoriaNome: produto.categoria_nome,
    estadoDeConservacao: produto.estado_conservacao,
    preco: Number(produto.preco),
    status: produto.status,
    fotos: (produto.fotos ?? []).map(({ id, url, ordem }) => ({ id, url, ordem })),
    criadoEm: produto.criado_em,
  };
}

const corpoDoProduto = (dados: DadosDoProduto) => ({
  nome: dados.nome.trim(),
  descricao: dados.descricao.trim(),
  categoria: dados.categoria,
  estado_conservacao: dados.estadoDeConservacao,
  preco: dados.preco.toFixed(2),
});

// ── Recursos ────────────────────────────────────────────────────────────────

export async function listarProdutos(
  { status, cursor }: { status?: StatusDoProduto; cursor?: string | null } = {},
): Promise<Pagina<Produto>> {
  const resposta = await api.get<RespostaPaginada<ProdutoDaApi>>("/produtos", {
    parametros: { status, cursor: cursor ?? undefined },
  });
  return paginaDe(resposta, produtoDaApi);
}

export async function criarProduto(dados: DadosDoProduto, categoriaNome = ""): Promise<Produto> {
  return produtoDaApi(await api.post<ProdutoDaApi>("/produtos", corpoDoProduto(dados)));
}

export async function editarProduto(id: string, dados: DadosDoProduto, categoriaNome = ""): Promise<Produto> {
  return produtoDaApi(await api.patch<ProdutoDaApi>(`/produtos/${id}`, corpoDoProduto(dados)));
}

export async function excluirProduto(id: string): Promise<void> {
  await api.remove<void>(`/produtos/${id}`);
}

export async function alterarStatusDoProduto(id: string, status: StatusDoProduto): Promise<Produto> {
  return produtoDaApi(await api.patch<ProdutoDaApi>(`/produtos/${id}/status`, { status }));
}

export async function enviarFotos(id: string, arquivos: File[]): Promise<FotoDoProduto[]> {
  const formulario = new FormData();
  for (const arquivo of arquivos) formulario.append("fotos", arquivo);
  return api.post<FotoDoProduto[]>(`/produtos/${id}/fotos`, formulario);
}

export async function removerFoto(id: string, fotoId: number): Promise<void> {
  await api.remove<void>(`/produtos/${id}/fotos/${fotoId}`);
}
