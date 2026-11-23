import { Link } from "react-router";
import type { Anuncio } from "@/api/meusAnuncios";
import { Avatar, Badge, Botao } from "@/componentes/base";
import { IPin, IStar, ITag } from "@/componentes/icones";
import { catColor } from "@/estilos/tokens";
import { fmtDistancia, fmtNota, fmtTempoRelativo } from "@/utils/formato";
import { entrarComRetorno } from "@/utils/navegacao";
import { faixaCompactaDoAnuncio, localDoAnuncio } from "./faixa";
import { corDaPessoa, iniciaisDe, nomeCurto } from "./pessoa";
import estilos from "./Cards.module.css";

/**
 * Card de anúncio de "procura-se" (QRO-07), no layout do protótipo do feed.
 * O rodapé mostra o comprador só quando a API envia o resumo público dele;
 * sem isso, fica a contagem de ofertas.
 *
 * Em modo `publico` (home do visitante) o card mostra só título, categoria,
 * orçamento, cidade/UF e data, e todo clique leva a entrar com retorno ao
 * anúncio ou à oferta.
 */
export function CardProcurando({ anuncio, publico = false }: { anuncio: Anuncio; publico?: boolean }) {
  const corDaCategoria = catColor(anuncio.categoriaNome);
  const disputado = anuncio.ofertasRecebidas >= 5;
  const local = localDoAnuncio(anuncio);
  const comprador = anuncio.compradorPublico;
  const linkDoAnuncio = publico ? entrarComRetorno(`/anuncios/${anuncio.id}`) : `/anuncios/${anuncio.id}`;
  const linkDaOferta = publico
    ? entrarComRetorno(`/anuncios/${anuncio.id}/ofertar`)
    : `/anuncios/${anuncio.id}/ofertar`;

  return (
    <article className={estilos.card}>
      <span className={estilos.destaque} aria-hidden="true" />

      <div className={estilos.topo}>
        <Badge tom="info" icone="🛒">
          Procurando
        </Badge>
        <Badge cor={corDaCategoria} icone={<ITag size={10} color={corDaCategoria} />}>
          {anuncio.categoriaNome}
        </Badge>
        <time className={estilos.tempo} dateTime={anuncio.criadoEm}>
          {fmtTempoRelativo(anuncio.criadoEm)}
        </time>
      </div>

      <h3 className={estilos.titulo}>
        <Link className={estilos.link} to={linkDoAnuncio}>
          {anuncio.titulo}
        </Link>
      </h3>

      {!publico && <p className={`${estilos.descricao} truncar-2`}>{anuncio.descricao}</p>}

      <div className={estilos.orcamento}>
        <span className={estilos.orcamentoRotulo}>Orçamento</span>
        <span className={estilos.orcamentoValor}>{faixaCompactaDoAnuncio(anuncio)}</span>
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
        {comprador && (
          <>
            <Avatar
              iniciais={iniciaisDe(comprador.nome)}
              cor={corDaPessoa(comprador.id)}
              foto={comprador.foto ?? undefined}
              nome={nomeCurto(comprador.nome)}
              tamanho={30}
            />
            <div className={estilos.pessoaDados}>
              <div className={estilos.pessoaNome}>{nomeCurto(comprador.nome)}</div>
              {comprador.nota !== null && (
                <div className={estilos.reputacao}>
                  <IStar size={11} aria-hidden="true" />
                  {fmtNota(comprador.nota)}
                </div>
              )}
            </div>
          </>
        )}

        {publico ? (
          <span className={estilos.convite}>Entre para ver detalhes e ofertar</span>
        ) : (
          <div className={estilos.ofertas}>
            <div className={`${estilos.ofertasNumero} ${disputado ? estilos.ofertasDisputadas : ""}`}>
              {anuncio.ofertasRecebidas}
            </div>
            <div className={estilos.ofertasRotulo}>oferta{anuncio.ofertasRecebidas === 1 ? "" : "s"}</div>
          </div>
        )}

        <Botao
          variante="suave"
          tamanho="pequeno"
          className={estilos.acao}
          para={linkDaOferta}
          aria-label={`Ofertar no anúncio ${anuncio.titulo}`}
        >
          Ofertar
        </Botao>
      </div>
    </article>
  );
}
