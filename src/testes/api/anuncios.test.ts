import { describe, expect, it } from "vitest";
import { FILTROS_PADRAO, filtrarDemandas, listarFeed, obterAnuncio } from "@/api/anuncios";
import type { Anuncio } from "@/api/meusAnuncios";
import { simularApi } from "../apiFalsa";

const base: Anuncio = {
  id: "1",
  comprador: "c",
  titulo: "Bicicleta aro 29",
  categoria: "esportes",
  categoriaNome: "Esportes",
  descricao: "Com freio a disco",
  precoMin: 1000,
  precoMax: 2000,
  raioKm: 25,
  status: "ativo",
  ofertasRecebidas: 0,
  cidade: "Brasília",
  uf: "DF",
  criadoEm: "2026-10-01T00:00:00Z",
  distanciaKm: 5,
};

const anuncios: Anuncio[] = [
  base,
  { ...base, id: "2", titulo: "Notebook", descricao: "16GB", categoria: "informatica", precoMin: 3000, precoMax: 5000, distanciaKm: 2, criadoEm: "2026-10-03T00:00:00Z" },
  { ...base, id: "3", titulo: "Bicicleta infantil", descricao: "aro 16", precoMin: null, precoMax: 300, distanciaKm: 30, criadoEm: "2026-10-02T00:00:00Z" },
  { ...base, id: "4", titulo: "Pausado", status: "pausado" },
];

const ids = (lista: Anuncio[]) => lista.map((anuncio) => anuncio.id);

describe("filtrarDemandas", () => {
  it("só mostra anúncios ativos", () => {
    expect(ids(filtrarDemandas(anuncios, FILTROS_PADRAO))).not.toContain("4");
  });

  it("exige todas as palavras da busca", () => {
    expect(ids(filtrarDemandas(anuncios, { ...FILTROS_PADRAO, busca: "bicicleta disco" }))).toEqual(["1"]);
  });

  it("combina categoria, faixa de preço e distância", () => {
    const filtros = { ...FILTROS_PADRAO, categoria: "esportes", precoMin: 500, distanciaMaxKm: 10 };
    expect(ids(filtrarDemandas(anuncios, filtros))).toEqual(["1"]);
  });

  it("ordena por distância, recentes e orçamento", () => {
    expect(ids(filtrarDemandas(anuncios, FILTROS_PADRAO))).toEqual(["2", "1", "3"]);
    expect(ids(filtrarDemandas(anuncios, { ...FILTROS_PADRAO, ordenacao: "recentes" }))).toEqual(["2", "3", "1"]);
    expect(ids(filtrarDemandas(anuncios, { ...FILTROS_PADRAO, ordenacao: "preco_maximo" }))).toEqual(["2", "1", "3"]);
    expect(ids(filtrarDemandas(anuncios, { ...FILTROS_PADRAO, ordenacao: "preco_minimo" }))).toEqual(["3", "1", "2"]);
  });
});

describe("listarFeed", () => {
  it("sem API, pagina os dados de demonstração", async () => {
    const primeira = await listarFeed(FILTROS_PADRAO, { tamanho: 2 });

    expect(primeira.itens).toHaveLength(2);
    expect(primeira.proximo).toBe("2");
    expect(primeira.total).toBeGreaterThan(2);
  });

  it("com API, manda os filtros combinados e lê o cursor", async () => {
    const chamadas = simularApi({
      "GET /anuncios": () => ({
        corpo: { count: 30, next: "http://api.teste/api/v1/anuncios?cursor=abc", results: [] },
      }),
    });

    const pagina = await listarFeed({
      busca: " bike ",
      categoria: "esportes",
      precoMin: 100,
      precoMax: 3000,
      distanciaMaxKm: 25,
      ordenacao: "recentes",
    });

    expect(pagina).toMatchObject({ total: 30, proximo: "abc" });
    expect(chamadas[0]?.parametros).toEqual({
      q: "bike",
      categoria: "esportes",
      preco_min: "100",
      preco_max: "3000",
      distancia_max_km: "25",
      ordenacao: "recentes",
      tamanho: "12",
    });
  });

  it("devolve 404 explícito para anúncio inexistente na demonstração", async () => {
    await expect(obterAnuncio("nao-existe")).rejects.toMatchObject({ status: 404 });
  });
});
