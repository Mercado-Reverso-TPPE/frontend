/**
 * Produtos à venda no feed (aba "Vendendo").
 *
 * Contrato esperado do backend para cada item: dados do produto do catálogo,
 * foto principal, estado de conservação, visualizações, distância e o resumo
 * público do vendedor (`vendedor_publico`).
 *
 * `GET /vitrine` aceita os mesmos filtros do feed de anúncios. Enquanto o
 * backend não expõe a rota, a aba "Vendendo" fica vazia (404 vira lista
 * vazia). Sem `VITE_API_URL`, os produtos vêm dos dados de demonstração.
 */

import { api, apiConfigurada, ErroDeApi } from "./cliente";
import { dataDeDemo, pessoaDeDemo, TAMANHO_DA_PAGINA, type FiltrosDoFeed } from "./anuncios";
import { pessoaDaApi, slug, type PessoaDaApi, type PessoaPublica } from "./meusAnuncios";
import type { SellerAd } from "./tipos";
import { SELLER_ADS } from "@/dados/demo";

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

// ── Demonstração ────────────────────────────────────────────────────────────

const CONSERVACAO_DEMO: Record<SellerAd["condition"], EstadoDeConservacao> = {
  Novo: "novo",
  "Semi-novo": "seminovo",
  Usado: "usado_bom",
};

function produtoDeDemo(produto: SellerAd, indice: number): ProdutoAVenda {
  const [cidade = "", uf = ""] = produto.location.split(",").map((parte) => parte.trim());
  return {
    id: `p${produto.id}`,
    titulo: produto.title,
    descricao: produto.description,
    categoria: slug(produto.category),
    categoriaNome: produto.category,
    preco: produto.price,
    estadoConservacao: CONSERVACAO_DEMO[produto.condition],
    foto: produto.image || null,
    cidade,
    uf,
    distanciaKm: produto.distance,
    visualizacoes: produto.views,
    criadoEm: dataDeDemo(produto.timeAgo, indice),
    vendedor: pessoaDeDemo(produto.seller),
  };
}

/** Produtos ativos de demonstração no formato da API. */
export const listarProdutosDeDemo = () =>
  SELLER_ADS.filter((produto) => produto.status === "active").map(produtoDeDemo);

/** A mesma regra da busca de anúncios, com o preço do produto no lugar do orçamento. */
export function filtrarProdutos(produtos: ProdutoAVenda[], filtros: FiltrosDoFeed): ProdutoAVenda[] {
  const palavras = filtros.busca.toLowerCase().split(/\s+/).filter(Boolean);
  const filtrados = produtos.filter((produto) => {
    const texto = `${produto.titulo} ${produto.descricao}`.toLowerCase();
    if (!palavras.every((palavra) => texto.includes(palavra))) return false;
    if (filtros.categoria && produto.categoria !== filtros.categoria) return false;
    if (filtros.precoMin !== null && produto.preco < filtros.precoMin) return false;
    if (filtros.precoMax !== null && produto.preco > filtros.precoMax) return false;
    if (filtros.distanciaMaxKm !== null && (produto.distanciaKm ?? 0) > filtros.distanciaMaxKm) return false;
    return true;
  });
  return [...filtrados].sort((a, b) => {
    if (filtros.ordenacao === "distancia") return (a.distanciaKm ?? 0) - (b.distanciaKm ?? 0);
    if (filtros.ordenacao === "preco_minimo") return a.preco - b.preco;
    if (filtros.ordenacao === "preco_maximo") return b.preco - a.preco;
    return b.criadoEm.localeCompare(a.criadoEm);
  });
}

// ── Recursos ────────────────────────────────────────────────────────────────

/** Uma página de produtos à venda com os filtros do feed. */
export async function listarVitrine(
  filtros: FiltrosDoFeed,
  { cursor, tamanho = TAMANHO_DA_PAGINA, sinal }: { cursor?: string | null; tamanho?: number; sinal?: AbortSignal } = {},
): Promise<PaginaDaVitrine> {
  if (!apiConfigurada()) {
    await new Promise((resolve) => setTimeout(resolve, 320));
    const todos = filtrarProdutos(listarProdutosDeDemo(), filtros);
    const inicio = cursor ? Number(cursor) : 0;
    const fim = inicio + tamanho;
    return { itens: todos.slice(inicio, fim), total: todos.length, proximo: fim < todos.length ? String(fim) : null };
  }

  try {
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
  } catch (erro) {
    // Rota ainda não publicada no backend: a aba fica vazia em vez de quebrar o feed.
    if (erro instanceof ErroDeApi && erro.status === 404) return { itens: [], total: 0, proximo: null };
    throw erro;
  }
}
