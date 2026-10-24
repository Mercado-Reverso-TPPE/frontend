import { Link } from "react-router";
import type { Anuncio } from "@/api/meusAnuncios";
import { Badge, Botao } from "@/componentes/base";
import { IPin, ITag } from "@/componentes/icones";
import { catColor } from "@/estilos/tokens";
import { fmtData, fmtDistancia } from "@/utils/formato";
import { faixaDoAnuncio, localDoAnuncio } from "./faixa";
import estilos from "./Cards.module.css";

/**
 * Card de anúncio de "procura-se" (QRO-07). Mostra só o que a API entrega a
 * quem busca: a identidade do comprador não vem no feed.
 */
export function CardProcurando({ anuncio }: { anuncio: Anuncio }) {
  const corDaCategoria = catColor(anuncio.categoriaNome);
  const disputado = anuncio.ofertasRecebidas >= 5;
  const local = localDoAnuncio(anuncio);

  return (
    <article className={estilos.card}>
      <div className={estilos.topo}>
        <Badge tom="info" icone="🛒">
          Procurando
        </Badge>
        <Badge cor={corDaCategoria} icone={<ITag size={10} color={corDaCategoria} />}>
          {anuncio.categoriaNome}
        </Badge>
        <span className={estilos.tempo}>{fmtData(anuncio.criadoEm)}</span>
      </div>

      <h3 className={estilos.titulo}>
        <Link className={estilos.link} to={`/anuncios/${anuncio.id}`}>
          {anuncio.titulo}
        </Link>
      </h3>

      <p className={`${estilos.descricao} truncar-2`}>{anuncio.descricao}</p>

      <div className={estilos.orcamento}>
        <span className={estilos.orcamentoRotulo}>Orçamento</span>
        <span className={estilos.orcamentoValor}>{faixaDoAnuncio(anuncio)}</span>
      </div>

      {(local || anuncio.distanciaKm !== null) && (
        <div className={estilos.local}>
          <IPin />
          {local}
          {anuncio.distanciaKm !== null && (
            <span className={estilos.distancia}>{fmtDistancia(anuncio.distanciaKm)}</span>
          )}
        </div>
      )}

      <div className={estilos.divisoria} />

      <div className={estilos.pessoa}>
        <div className={estilos.ofertas}>
          <div className={`${estilos.ofertasNumero} ${disputado ? estilos.ofertasDisputadas : ""}`}>
            {anuncio.ofertasRecebidas}
          </div>
          <div className={estilos.ofertasRotulo}>oferta{anuncio.ofertasRecebidas === 1 ? "" : "s"}</div>
        </div>

        <Botao
          variante="suave"
          tamanho="pequeno"
          className={estilos.acao}
          para={`/anuncios/${anuncio.id}/ofertar`}
          aria-label={`Ofertar no anúncio ${anuncio.titulo}`}
        >
          Ofertar
        </Botao>
      </div>
    </article>
  );
}
