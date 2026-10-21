import { Link } from "react-router";
import { Avatar, Badge, Botao } from "@/componentes/base";
import type { TomDeBadge } from "@/componentes/base";
import { IEye, IPin, IStar, ITag } from "@/componentes/icones";
import { catColor } from "@/estilos/tokens";
import { fmtDistancia, fmtNumero, fmtPrice } from "@/utils/formato";
import type { SellerAd } from "@/api/tipos";
import estilos from "./Cards.module.css";

const TOM_DA_CONSERVACAO: Record<SellerAd["condition"], TomDeBadge> = {
  "Novo": "sucesso",
  "Semi-novo": "info",
  "Usado": "aviso",
};

/** Card de produto do catálogo de um vendedor (QRO-08). */
export function CardVendendo({ anuncio }: { anuncio: SellerAd }) {
  const corDaCategoria = catColor(anuncio.category);

  return (
    <article className={`${estilos.card} ${estilos.cardVenda}`}>
      {anuncio.featured && <span className={estilos.faixaVertical} aria-hidden="true" />}

      <div className={estilos.foto}>
        <img src={anuncio.image} alt={anuncio.title} loading="lazy" />
        <span className={estilos.conservacao}>
          <Badge tom={TOM_DA_CONSERVACAO[anuncio.condition]}>{anuncio.condition}</Badge>
        </span>
      </div>

      <div className={estilos.corpoVenda}>
        <div className={estilos.topo}>
          <Badge tom="marca" icone="🏷️">
            Vendendo
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

        <p className={`${estilos.descricao} truncar-2`} style={{ flex: 1 }}>
          {anuncio.description}
        </p>

        <div className={estilos.linhaPreco}>
          <span className={estilos.preco}>{fmtPrice(anuncio.price)}</span>
          <div className={estilos.metricas}>
            <span className={estilos.metrica}>
              <IPin />
              {fmtDistancia(anuncio.distance)}
            </span>
            <span className={estilos.metrica}>
              <IEye />
              {fmtNumero(anuncio.views)} <span className="apenas-leitor-de-tela">visualizações</span>
            </span>
          </div>
        </div>

        <div className={estilos.rodapeVenda}>
          <Avatar
            iniciais={anuncio.seller.initials}
            cor={anuncio.seller.color}
            tamanho={28}
            nome={anuncio.seller.name}
          />
          <div className={estilos.pessoaDados}>
            <div className={estilos.pessoaNome}>{anuncio.seller.name}</div>
            <div className={estilos.reputacao}>
              <IStar size={11} />
              {anuncio.seller.rating.toFixed(1)}
            </div>
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
      </div>
    </article>
  );
}
