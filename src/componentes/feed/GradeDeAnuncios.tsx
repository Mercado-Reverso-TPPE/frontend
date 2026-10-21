import { CardDeAnuncio } from "@/componentes/anuncio";
import type { AnyAd } from "@/api/tipos";
import estilos from "./Feed.module.css";

/** Grade do feed: 3 colunas em telas largas, 2 em médias, 1 em pequenas. */
export function GradeDeAnuncios({ anuncios }: { anuncios: AnyAd[] }) {
  if (anuncios.length === 0) return null;

  return (
    <div className={estilos.grade}>
      {anuncios.map((anuncio) => (
        <CardDeAnuncio key={`${anuncio.kind}-${anuncio.id}`} anuncio={anuncio} />
      ))}
    </div>
  );
}
