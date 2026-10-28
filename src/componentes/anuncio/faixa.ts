import type { Anuncio } from "@/api/meusAnuncios";
import { fmtPrice } from "@/utils/formato";

/** Orçamento do anúncio em texto: faixa, só teto, só piso ou "a combinar". */
export function faixaDoAnuncio({ precoMin, precoMax }: Pick<Anuncio, "precoMin" | "precoMax">) {
  if (precoMin !== null && precoMax !== null) return `${fmtPrice(precoMin)} a ${fmtPrice(precoMax)}`;
  if (precoMax !== null) return `Até ${fmtPrice(precoMax)}`;
  if (precoMin !== null) return `A partir de ${fmtPrice(precoMin)}`;
  return "A combinar";
}

export const localDoAnuncio = (anuncio: Pick<Anuncio, "cidade" | "uf">) =>
  [anuncio.cidade, anuncio.uf].filter(Boolean).join(", ");
