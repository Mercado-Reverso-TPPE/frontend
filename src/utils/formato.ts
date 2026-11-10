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

/** Data no fuso de Brasília: `2026-08-31T14:00:00Z` → `31/08/2026`. */
export const fmtData = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

const BRL_EXATO = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Valor de negociação: mostra centavos quando existem, para que duas
 * propostas diferentes nunca apareçam iguais. `1999.9` → `R$ 1.999,90`.
 */
export const fmtPrecoExato = (valor: number) =>
  Number.isInteger(valor) ? fmtPrice(valor) : BRL_EXATO.format(valor).replace(/\s/g, " ");

/** Data e hora no fuso de Brasília: `31/08/2026 às 14:00`. */
export const fmtDataHora = (iso: string) => {
  const data = new Date(iso);
  const dia = data.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const hora = data.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
  return `${dia} às ${hora}`;
};
