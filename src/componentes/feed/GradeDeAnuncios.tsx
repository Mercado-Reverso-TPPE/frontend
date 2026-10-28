import type { Anuncio } from "@/api/meusAnuncios";
import { CardProcurando } from "@/componentes/anuncio";
import estilos from "./Feed.module.css";

/** Grade do feed: 3 colunas em telas largas, 2 em médias, 1 em pequenas. */
export function GradeDeAnuncios({ anuncios }: { anuncios: Anuncio[] }) {
  if (anuncios.length === 0) return null;

  return (
    <div className={estilos.grade}>
      {anuncios.map((anuncio) => (
        <CardProcurando key={anuncio.id} anuncio={anuncio} />
      ))}
    </div>
  );
}
