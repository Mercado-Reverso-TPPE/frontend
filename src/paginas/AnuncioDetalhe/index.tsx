import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "react-router";
import { obterAnuncio } from "@/api/anuncios";
import { apiConfigurada, ErroDeApi } from "@/api/cliente";
import { acoesPermitidas } from "@/api/meusAnuncios";
import { faixaDoAnuncio, localDoAnuncio } from "@/componentes/anuncio";
import { Badge, Botao } from "@/componentes/base";
import { Carregando, ErroAoCarregar, EstadoVazio } from "@/componentes/estado";
import { useSessao } from "@/hooks/useSessao";
import { ROTULO_DO_STATUS, TOM_DO_STATUS } from "@/paginas/MeusAnuncios/status";
import { fmtData, fmtDistancia, fmtPlural } from "@/utils/formato";
import estilos from "./AnuncioDetalhe.module.css";

/** Detalhe de um anúncio de "procura-se". */
export default function AnuncioDetalhe() {
  const { id = "" } = useParams();
  const navegar = useNavigate();
  const localizacao = useLocation();
  const { autenticado, verificando, usuario } = useSessao();
  const exigeEntrar = apiConfigurada() && !autenticado;

  const anuncio = useQuery({
    queryKey: ["anuncio", id],
    queryFn: () => obterAnuncio(id),
    enabled: !exigeEntrar,
  });

  // Volta pelo histórico para o feed reaparecer com a mesma busca e filtros.
  const voltar = () => (localizacao.key !== "default" ? navegar(-1) : navegar("/"));

  if (exigeEntrar && !verificando) {
    return (
      <div className={estilos.pagina}>
        <EstadoVazio
          icone="🔐"
          titulo="Entre para ver este anúncio"
          descricao="Os anúncios aparecem para quem está dentro do raio de busca do comprador."
          acao={{ rotulo: "Entrar", para: `/entrar?retorno=${encodeURIComponent(localizacao.pathname)}` }}
        />
      </div>
    );
  }

  return (
    <div className={estilos.pagina}>
      <button type="button" className={estilos.voltar} onClick={voltar}>
        ← Voltar
      </button>

      {(anuncio.isPending || verificando) && <Carregando rotulo="Carregando anúncio…" />}

      {anuncio.isError &&
        (anuncio.error instanceof ErroDeApi && anuncio.error.status === 404 ? (
          <EstadoVazio
            icone="😕"
            titulo="Anúncio não encontrado"
            descricao="Ele pode ter sido encerrado ou estar fora do seu raio de alcance."
            acao={{ rotulo: "Voltar para o feed", para: "/" }}
          />
        ) : (
          <ErroAoCarregar erro={anuncio.error} aoTentarDeNovo={() => anuncio.refetch()} />
        ))}

      {anuncio.data && (
        <article className={estilos.cartao}>
          <div className={estilos.selos}>
            <Badge tom="info" icone="🛒">
              Procurando
            </Badge>
            <Badge>{anuncio.data.categoriaNome}</Badge>
            {anuncio.data.status !== "ativo" && (
              <Badge tom={TOM_DO_STATUS[anuncio.data.status]}>{ROTULO_DO_STATUS[anuncio.data.status]}</Badge>
            )}
          </div>

          <h1 className={estilos.titulo}>{anuncio.data.titulo}</h1>
          <p className={estilos.descricao}>{anuncio.data.descricao}</p>

          <dl className={estilos.dados}>
            <div>
              <dt>Orçamento</dt>
              <dd>{faixaDoAnuncio(anuncio.data)}</dd>
            </div>
            {localDoAnuncio(anuncio.data) && (
              <div>
                <dt>Local</dt>
                <dd>
                  {localDoAnuncio(anuncio.data)}
                  {anuncio.data.distanciaKm !== null && ` · ${fmtDistancia(anuncio.data.distanciaKm)}`}
                </dd>
              </div>
            )}
            <div>
              <dt>Raio de busca</dt>
              <dd>{fmtDistancia(anuncio.data.raioKm)}</dd>
            </div>
            <div>
              <dt>Publicado em</dt>
              <dd>{fmtData(anuncio.data.criadoEm)}</dd>
            </div>
            <div>
              <dt>Ofertas</dt>
              <dd>{fmtPlural(anuncio.data.ofertasRecebidas, "recebida")}</dd>
            </div>
          </dl>

          <div className={estilos.acoes}>
            {usuario && anuncio.data.comprador === usuario.id ? (
              <>
                <Botao para={`/anuncios/${id}/ofertas`}>Ver ofertas recebidas</Botao>
                {acoesPermitidas(anuncio.data.status).includes("editar") && (
                  <Botao variante="secundario" para={`/meus-anuncios/${id}/editar`}>
                    Editar anúncio
                  </Botao>
                )}
              </>
            ) : anuncio.data.status === "ativo" ? (
              <Botao para={`/anuncios/${id}/ofertar`}>Fazer oferta</Botao>
            ) : (
              <p className={estilos.descricao}>Este anúncio não está recebendo ofertas.</p>
            )}
          </div>
        </article>
      )}
    </div>
  );
}
