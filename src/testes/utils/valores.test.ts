import { describe, expect, it } from "vitest";
import { lerValorEmReais, valorParaCampo } from "@/utils/valores";

describe("lerValorEmReais", () => {
  it("entende o formato brasileiro", () => {
    expect(lerValorEmReais("1.200,50")).toBe(1200.5);
    expect(lerValorEmReais("2.100")).toBe(2100);
    expect(lerValorEmReais("1.000.000")).toBe(1000000);
    expect(lerValorEmReais("R$ 800")).toBe(800);
  });

  it("aceita ponto decimal quando não há milhar", () => {
    expect(lerValorEmReais("1200.5")).toBe(1200.5);
    expect(lerValorEmReais("19.90")).toBe(19.9);
  });

  it("distingue vazio de inválido", () => {
    expect(lerValorEmReais("")).toBeNull();
    expect(lerValorEmReais("abc")).toBeNaN();
    expect(lerValorEmReais("1,2,3")).toBeNaN();
  });

  it("devolve o valor para o campo", () => {
    expect(valorParaCampo(1200)).toBe("1200");
    expect(valorParaCampo(1200.5)).toBe("1200,50");
    expect(valorParaCampo(null)).toBe("");
  });
});
