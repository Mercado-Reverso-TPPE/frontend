/**
 * Produtos à venda no feed (aba "Vendendo").
 *
 * Contrato esperado do backend para cada item: dados do produto do catálogo,
 * foto principal, estado de conservação, visualizações, distância e o resumo
 * público do vendedor (`vendedor_publico`).
 *
 * `GET /vitrine` aceita os mesmos filtros do feed de anúncios e só devolve
 * produtos disponíveis de vendedores cujo alcance cobre quem busca.
 */

import { api } from "./cliente";
import { TAMANHO_DA_PAGINA, type FiltrosDoFeed } from "./anuncios";
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

export interface PaginaDaVitrine {
  itens: ProdutoAVenda[];
  total: number;
  proximo: string | null;
}

// ── Recursos ────────────────────────────────────────────────────────────────

/** Uma página de produtos à venda com os filtros do feed. */
export async function listarVitrine(
  filtros: FiltrosDoFeed,
  { cursor, tamanho = TAMANHO_DA_PAGINA, sinal }: { cursor?: string | null; tamanho?: number; sinal?: AbortSignal } = {},
): Promise<PaginaDaVitrine> {
  const resposta = await api.get<{ count: number; next: string | null; results: ProdutoDaApi[] }>("/vitrine", {
    parametros: {
      q: filtros.busca.trim() || undefined,
      categoria: filtros.categoria || undefined,
      preco_min: filtros.precoMin ?? undefined,
      preco_max: filtros.precoMax ?? undefined,
      distancia_max_km: filtros.distanciaMaxKm ?? undefined,
      ordenacao: filtros.ordenacao,
      cursor: cursor ?? undefined,
      tamanho,
    },
    sinal,
  });
  let proximo: string | null = null;
  if (resposta.next) {
    try {
      proximo = new URL(resposta.next).searchParams.get("cursor");
    } catch {
      proximo = null;
    }
  }
  return { itens: resposta.results.map(produtoDaApi), total: resposta.count, proximo };
}
