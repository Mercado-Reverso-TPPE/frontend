import type { ItemDoFeed } from "@/api/feed";
import { CardProcurando, CardVendendo } from "@/componentes/anuncio";
import estilos from "./Feed.module.css";

/**
 * Grade do feed: 3 colunas em telas largas, 2 em médias, 1 em pequenas.
 * `publico` deixa os cards no modo do visitante.
 */
export function GradeDeAnuncios({ itens, publico = false }: { itens: ItemDoFeed[]; publico?: boolean }) {
  if (itens.length === 0) return null;

  return (
    <div className={estilos.grade}>
      {itens.map((item) =>
        item.tipo === "procurando" ? (
          <CardProcurando key={`procurando-${item.anuncio.id}`} anuncio={item.anuncio} publico={publico} />
        ) : (
          <CardVendendo key={`vendendo-${item.produto.id}`} produto={item.produto} />
        ),
      )}
    </div>
  );
}
