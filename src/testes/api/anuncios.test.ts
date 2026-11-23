import { describe, expect, it } from "vitest";
import { listarFeed, obterAnuncio } from "@/api/anuncios";
import { simularApi } from "../apiFalsa";

describe("listarFeed", () => {
  it("manda os filtros combinados e lê o cursor", async () => {
    const chamadas = simularApi({
      "GET /anuncios": () => ({
        corpo: { count: 30, next: "http://api.teste/api/v1/anuncios?cursor=abc", results: [] },
      }),
    });

    const pagina = await listarFeed({
      tipo: "procurando",
      busca: " bike ",
      categoria: "esportes",
      precoMin: 100,
      precoMax: 3000,
      distanciaMaxKm: 25,
      ordenacao: "recentes",
      uf: "",
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

  it("repassa o 404 da API para anúncio inexistente", async () => {
    simularApi({});
    await expect(obterAnuncio("nao-existe")).rejects.toMatchObject({ status: 404 });
  });
});
