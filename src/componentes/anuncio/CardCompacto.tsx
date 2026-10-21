import { Link } from "react-router";
import { IPin } from "@/componentes/icones";
import { T } from "@/estilos/tokens";
import { fmtDistancia, fmtPrice, fmtRange } from "@/utils/formato";
import type { AnyAd } from "@/api/tipos";
import estilos from "./Cards.module.css";

/** Card reduzido usado nos carrosséis de recomendação e proximidade. */
export function CardCompacto({ anuncio }: { anuncio: AnyAd }) {
  const procurando = anuncio.kind === "buyer";

  return (
    <article className={estilos.compacto}>
      <div className={estilos.compactoCapa}>
        {procurando ? (
          <div className={estilos.compactoSelo}>
            <div style={{ fontSize: 32 }} aria-hidden="true">
              🛒
            </div>
            Procurando
          </div>
        ) : (
          <img src={anuncio.image} alt={anuncio.title} loading="lazy" />
        )}
      </div>

      <div className={estilos.compactoCorpo}>
        <h3 className={`${estilos.compactoTitulo} truncar-2`}>
          <Link className={estilos.link} to={`/anuncios/${anuncio.id}`}>
            {anuncio.title}
          </Link>
        </h3>
        <div
          className={`${estilos.compactoValor} ${procurando ? estilos.compactoValorOrcamento : ""}`}
        >
          {procurando ? fmtRange(anuncio.budget.min, anuncio.budget.max) : fmtPrice(anuncio.price)}
        </div>
        <div className={estilos.compactoLocal}>
          <IPin size={11} color={T.textLight} />
          {fmtDistancia(anuncio.distance)} · {anuncio.location.split(",")[0]}
        </div>
      </div>
    </article>
  );
}
