import type { Anuncio } from "@/api/meusAnuncios";
import { fmtCompacto, fmtPrice, fmtRange } from "@/utils/formato";

/** Orçamento do anúncio em texto: faixa, só teto, só piso ou "a combinar". */
export function faixaDoAnuncio({ precoMin, precoMax }: Pick<Anuncio, "precoMin" | "precoMax">) {
  if (precoMin !== null && precoMax !== null) return `${fmtPrice(precoMin)} a ${fmtPrice(precoMax)}`;
  if (precoMax !== null) return `Até ${fmtPrice(precoMax)}`;
  if (precoMin !== null) return `A partir de ${fmtPrice(precoMin)}`;
  return "A combinar";
}

/** Orçamento compacto dos cards do feed: `R$ 4,2k — R$ 5k`. */
export function faixaCompactaDoAnuncio({ precoMin, precoMax }: Pick<Anuncio, "precoMin" | "precoMax">) {
  if (precoMin !== null && precoMax !== null) return fmtRange(precoMin, precoMax);
  if (precoMax !== null) return `Até ${fmtCompacto(precoMax)}`;
  if (precoMin !== null) return `A partir de ${fmtCompacto(precoMin)}`;
  return "A combinar";
}

export const localDoAnuncio = (anuncio: Pick<Anuncio, "cidade" | "uf">) =>
  [anuncio.cidade, anuncio.uf].filter(Boolean).join(", ");
