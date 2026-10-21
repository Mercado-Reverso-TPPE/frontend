import { Link } from "react-router";
import { Avatar, Badge, Botao } from "@/componentes/base";
import { IPin, IStar, ITag } from "@/componentes/icones";
import { catColor } from "@/estilos/tokens";
import { fmtDistancia, fmtRange } from "@/utils/formato";
import type { BuyerAd } from "@/api/tipos";
import estilos from "./Cards.module.css";

/** Card de anúncio de "procura-se" publicado por um comprador (QRO-04). */
export function CardProcurando({ anuncio }: { anuncio: BuyerAd }) {
  const corDaCategoria = catColor(anuncio.category);
  const disputado = anuncio.offers >= 5;

  return (
    <article className={estilos.card}>
      {anuncio.featured && <span className={estilos.destaque} aria-hidden="true" />}

      <div className={estilos.topo}>
        <Badge tom="info" icone="🛒">
          Procurando
        </Badge>
        <Badge cor={corDaCategoria} icone={<ITag size={10} color={corDaCategoria} />}>
          {anuncio.category}
        </Badge>
        <span className={estilos.tempo}>{anuncio.timeAgo}</span>
      </div>

      <h3 className={estilos.titulo}>
        <Link className={estilos.link} to={`/anuncios/${anuncio.id}`}>
          {anuncio.title}
        </Link>
      </h3>

      <p className={`${estilos.descricao} truncar-2`}>{anuncio.description}</p>

      <div className={estilos.orcamento}>
        <span className={estilos.orcamentoRotulo}>Orçamento</span>
        <span className={estilos.orcamentoValor}>
          {fmtRange(anuncio.budget.min, anuncio.budget.max)}
        </span>
      </div>

      <div className={estilos.local}>
        <IPin />
        {anuncio.location}
        <span className={estilos.distancia}>{fmtDistancia(anuncio.distance)}</span>
      </div>

      <div className={estilos.divisoria} />

      <div className={estilos.pessoa}>
        <Avatar iniciais={anuncio.buyer.initials} cor={anuncio.buyer.color} nome={anuncio.buyer.name} />
        <div className={estilos.pessoaDados}>
          <div className={estilos.pessoaNome}>{anuncio.buyer.name}</div>
          <div className={estilos.reputacao}>
            <IStar size={11} />
            {anuncio.buyer.rating.toFixed(1)} · {anuncio.buyer.reviews} av.
          </div>
        </div>

        <div className={estilos.ofertas}>
          <div className={`${estilos.ofertasNumero} ${disputado ? estilos.ofertasDisputadas : ""}`}>
            {anuncio.offers}
          </div>
          <div className={estilos.ofertasRotulo}>oferta{anuncio.offers === 1 ? "" : "s"}</div>
        </div>

        <Botao
          variante="secundario"
          tamanho="pequeno"
          className={estilos.acao}
          para={`/anuncios/${anuncio.id}/ofertar`}
          aria-label={`Ofertar no anúncio ${anuncio.title}`}
        >
          Ofertar
        </Botao>
      </div>
    </article>
  );
}
