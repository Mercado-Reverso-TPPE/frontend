import { describe, expect, it } from "vitest";
import { fmtCompacto, fmtDistancia, fmtNumero, fmtPlural, fmtPrice, fmtRange } from "@/utils/formato";

describe("formatação", () => {
  it("valor em reais, sem centavos", () => {
    expect(fmtPrice(4700)).toBe("R$ 4.700");
  });

  it("faixa de orçamento em formato compacto", () => {
    expect(fmtCompacto(800)).toBe("R$ 800");
    expect(fmtCompacto(4000)).toBe("R$ 4k");
    expect(fmtCompacto(1500)).toBe("R$ 1,5k");
    expect(fmtRange(4200, 5000)).toBe("R$ 4,2k — R$ 5k");
  });

  it("distância sempre em KM", () => {
    expect(fmtDistancia(3.2)).toBe("3,2 km");
    expect(fmtDistancia(12)).toBe("12 km");
  });

  it("números e plurais em português", () => {
    expect(fmtNumero(18400)).toBe("18.400");
    expect(fmtPlural(1, "oferta")).toBe("1 oferta");
    expect(fmtPlural(7, "oferta")).toBe("7 ofertas");
    expect(fmtPlural(2, "resultado")).toBe("2 resultados");
  });
});
