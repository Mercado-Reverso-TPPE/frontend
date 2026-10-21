import { describe, expect, it } from "vitest";
import { filtrarEOrdenar, listarAnuncios } from "@/api/anuncios";
import { ALL_ADS, BUYER_ADS, SELLER_ADS } from "@/dados/demo";

describe("filtrarEOrdenar", () => {
  it("sem filtro, devolve todos os anúncios", () => {
    expect(filtrarEOrdenar(ALL_ADS)).toHaveLength(ALL_ADS.length);
  });

  it("filtra por tipo de anúncio", () => {
    expect(filtrarEOrdenar(ALL_ADS, { tipo: "procurando" })).toHaveLength(BUYER_ADS.length);
    expect(filtrarEOrdenar(ALL_ADS, { tipo: "vendendo" })).toHaveLength(SELLER_ADS.length);
  });

  it("filtra por categoria", () => {
    const resultado = filtrarEOrdenar(ALL_ADS, { categoria: "Games" });

    expect(resultado.length).toBeGreaterThan(0);
    expect(resultado.every((anuncio) => anuncio.category === "Games")).toBe(true);
  });

  it("busca no título e na descrição, sem diferenciar maiúsculas", () => {
    const resultado = filtrarEOrdenar(ALL_ADS, { busca: "IPHONE" });

    expect(resultado.length).toBeGreaterThan(0);
    expect(
      resultado.every((anuncio) =>
        `${anuncio.title} ${anuncio.description}`.toLowerCase().includes("iphone"),
      ),
    ).toBe(true);
  });

  it("ordena pelos mais próximos", () => {
    const distancias = filtrarEOrdenar(ALL_ADS, { ordenacao: "proximos" }).map((a) => a.distance);

    expect(distancias).toEqual([...distancias].sort((a, b) => a - b));
  });

  it("ordena pelo maior valor, comparando preço e teto do orçamento", () => {
    const resultado = filtrarEOrdenar(ALL_ADS, { ordenacao: "maior-valor" });
    const valores = resultado.map((a) => (a.kind === "seller" ? a.price : a.budget.max));

    expect(valores).toEqual([...valores].sort((a, b) => b - a));
  });

  it("devolve lista vazia quando a busca não casa com nada", () => {
    expect(filtrarEOrdenar(ALL_ADS, { busca: "zepelim de borracha" })).toHaveLength(0);
  });
});

describe("listarAnuncios", () => {
  it("sem API configurada, responde com os dados de demonstração", async () => {
    const pagina = await listarAnuncios({ tipo: "vendendo" });

    expect(pagina.total).toBe(SELLER_ADS.length);
    expect(pagina.itens).toHaveLength(SELLER_ADS.length);
  });
});
