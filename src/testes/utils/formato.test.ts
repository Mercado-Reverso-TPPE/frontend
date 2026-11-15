import { describe, expect, it } from "vitest";
import {
  fmtCompacto,
  fmtDistancia,
  fmtNota,
  fmtNumero,
  fmtPlural,
  fmtPrice,
  fmtRange,
  fmtTempoRelativo,
} from "@/utils/formato";

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

  it("tempo relativo da publicação", () => {
    const agora = Date.UTC(2026, 10, 10, 12, 0);
    const antes = (minutos: number) => new Date(agora - minutos * 60000).toISOString();
    expect(fmtTempoRelativo(antes(0), agora)).toBe("agora");
    expect(fmtTempoRelativo(antes(12), agora)).toBe("12 min");
    expect(fmtTempoRelativo(antes(60), agora)).toBe("1 hora");
    expect(fmtTempoRelativo(antes(180), agora)).toBe("3 horas");
    expect(fmtTempoRelativo(antes(2 * 1440), agora)).toBe("2 dias");
    expect(fmtTempoRelativo(antes(40 * 1440), agora)).toBe("01/10/2026");
  });

  it("nota com uma casa decimal", () => {
    expect(fmtNota(4.9)).toBe("4,9");
    expect(fmtNota(5)).toBe("5,0");
  });
});
