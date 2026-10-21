import type { AnyAd } from "@/api/tipos";
import { CardProcurando } from "./CardProcurando";
import { CardVendendo } from "./CardVendendo";

/** Escolhe o card pelo tipo do anúncio. */
export function CardDeAnuncio({ anuncio }: { anuncio: AnyAd }) {
  return anuncio.kind === "buyer" ? (
    <CardProcurando anuncio={anuncio} />
  ) : (
    <CardVendendo anuncio={anuncio} />
  );
}
