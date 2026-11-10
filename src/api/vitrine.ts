/**
 * Produtos à venda no feed (aba "Vendendo").
 *
 * Contrato esperado do backend para cada item: dados do produto do catálogo,
 * foto principal, estado de conservação, visualizações, distância e o resumo
 * público do vendedor (`vendedor_publico`).
 */

import { pessoaDaApi, type PessoaDaApi, type PessoaPublica } from "./meusAnuncios";

/** Estados de conservação do catálogo (`Produto.EstadoConservacao`). */
export type EstadoDeConservacao = "novo" | "seminovo" | "usado_bom" | "usado_marcas" | "pecas";

export const ROTULO_DE_CONSERVACAO: Record<EstadoDeConservacao, string> = {
  novo: "Novo",
  seminovo: "Semi-novo",
  usado_bom: "Usado",
  usado_marcas: "Usado com marcas",
  pecas: "Para peças",
};

export interface ProdutoAVenda {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  categoriaNome: string;
  preco: number;
  estadoConservacao: EstadoDeConservacao;
  /** Foto principal; `null` quando o produto não tem foto. */
  foto: string | null;
  cidade: string;
  uf: string;
  distanciaKm: number | null;
  visualizacoes: number | null;
  criadoEm: string;
  vendedor: PessoaPublica | null;
}

/** Corpo de um produto no feed, como o backend devolve. */
export interface ProdutoDaApi {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  categoria_nome: string;
  preco: string | number;
  estado_conservacao: EstadoDeConservacao;
  foto?: string | null;
  fotos?: { url: string }[];
  cidade?: string;
  uf?: string;
  distancia_km?: number | null;
  visualizacoes?: number | null;
  criado_em: string;
  vendedor_publico?: PessoaDaApi | null;
}

export function produtoDaApi(produto: ProdutoDaApi): ProdutoAVenda {
  return {
    id: String(produto.id),
    titulo: produto.nome,
    descricao: produto.descricao,
    categoria: produto.categoria,
    categoriaNome: produto.categoria_nome,
    preco: Number(produto.preco),
    estadoConservacao: produto.estado_conservacao,
    foto: produto.foto || produto.fotos?.[0]?.url || null,
    cidade: produto.cidade ?? "",
    uf: produto.uf ?? "",
    distanciaKm: produto.distancia_km ?? null,
    visualizacoes: produto.visualizacoes ?? null,
    criadoEm: produto.criado_em,
    vendedor: pessoaDaApi(produto.vendedor_publico),
  };
}
