import type { ReactNode } from "react";
import { Link } from "react-router";
import type { Anuncio } from "@/api/meusAnuncios";
import { IPin } from "@/componentes/icones";
import { T } from "@/estilos/tokens";
import { fmtDistancia } from "@/utils/formato";
import { faixaDoAnuncio } from "./faixa";
import estilos from "./Cards.module.css";

/** Card reduzido dos carrosséis de recomendação e proximidade. */
export function CardCompacto({ anuncio, acoes }: { anuncio: Anuncio; acoes?: ReactNode }) {
  return (
    <article className={estilos.compacto}>
      <div className={estilos.compactoCapa}>
        <div className={estilos.compactoSelo}>
          <div style={{ fontSize: 32 }} aria-hidden="true">
            🛒
          </div>
          Procurando
        </div>
      </div>

      <div className={estilos.compactoCorpo}>
        <h3 className={`${estilos.compactoTitulo} truncar-2`}>
          <Link className={estilos.link} to={`/anuncios/${anuncio.id}`}>
            {anuncio.titulo}
          </Link>
        </h3>
        <div className={`${estilos.compactoValor} ${estilos.compactoValorOrcamento}`}>{faixaDoAnuncio(anuncio)}</div>
        <div className={estilos.compactoLocal}>
          <IPin size={11} color={T.textLight} />
          {anuncio.distanciaKm !== null ? `${fmtDistancia(anuncio.distanciaKm)} · ` : ""}
          {anuncio.cidade}
        </div>
        {acoes && <div className={estilos.compactoAcoes}>{acoes}</div>}
      </div>
    </article>
  );
}
