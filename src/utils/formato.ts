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

/** Nota de reputação com uma casa: `4.9` → `4,9`. */
export const fmtNota = (nota: number) =>
  nota.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Tempo desde a publicação, como no protótipo: `12 min`, `1 hora`, `3 dias`.
 * Depois de 30 dias, volta para a data.
 */
export function fmtTempoRelativo(iso: string, agora: number = Date.now()) {
  const minutos = Math.floor((agora - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(minutos)) return "";
  if (minutos < 1) return "agora";
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return horas === 1 ? "1 hora" : `${horas} horas`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return dias === 1 ? "1 dia" : `${dias} dias`;
  return fmtData(iso);
}
