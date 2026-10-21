/**
 * Formatação de valores exibidos na interface.
 *
 * RNF-18: distância sempre em KM, valor sempre em reais. Nenhuma tela
 * deve formatar número à mão — a regra fica aqui.
 */

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

/** `1234` → `R$ 1.234` */
export const fmtPrice = (valor: number) => BRL.format(valor).replace(/\s/g, " ");

/** `1500` → `R$ 1,5k` · `800` → `R$ 800` — usado em faixas e cards compactos. */
export const fmtCompacto = (valor: number) =>
  valor >= 1000
    ? `R$ ${(valor / 1000).toFixed(valor % 1000 === 0 ? 0 : 1).replace(".", ",")}k`
    : `R$ ${valor}`;

/** Faixa de orçamento de um anúncio de "procura-se". */
export const fmtRange = (min: number, max: number) =>
  `${fmtCompacto(min)} — ${fmtCompacto(max)}`;

/** Distância sempre em KM, nunca em metros ou milhas. */
export const fmtDistancia = (km: number) =>
  `${km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;

/** `2847` → `2.847` — métricas e contagens. */
export const fmtNumero = (valor: number) => valor.toLocaleString("pt-BR");

/** Pluralização simples: `fmtPlural(2, "oferta")` → `2 ofertas`. */
export const fmtPlural = (quantidade: number, singular: string, plural = `${singular}s`) =>
  `${fmtNumero(quantidade)} ${quantidade === 1 ? singular : plural}`;

/** Métrica de vitrine: milhar cheio abaixo de 10 mil, compacto acima. */
export const fmtMetrica = (valor: number) =>
  valor >= 10000
    ? `${(valor / 1000).toFixed(valor % 1000 === 0 ? 0 : 1).replace(".", ",")}k`
    : fmtNumero(valor);
