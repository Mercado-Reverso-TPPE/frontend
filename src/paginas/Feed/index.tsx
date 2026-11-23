import { useState } from "react";
import { useLocation } from "react-router";
import type { Anuncio } from "@/api/meusAnuncios";
import { Botao } from "@/componentes/base";
import {
  BarraDeFiltros,
  Carrossel,
  ConviteDiscreto,
  ConviteParaEntrar,
  GradeDeAnuncios,
  Hero,
  ResumoDaLista,
} from "@/componentes/feed";
import type { MetricaDoHero } from "@/componentes/feed";
import { ErroAoCarregar, EsqueletoDeAnuncios, EstadoVazio } from "@/componentes/estado";
import type { EstatisticasPublicas } from "@/api/estatisticas";
import { ordenacaoPublica } from "@/api/anunciosPublicos";
import {
  useEstatisticas,
  useFeed,
  useFeedPublico,
  usePertoDeVoce,
  useRecomendacoes,
} from "@/hooks/useAnuncios";
import { useFiltros } from "@/hooks/useFiltros";
import { useSessao } from "@/hooks/useSessao";
import { cadastrarComRetorno, entrarComRetorno } from "@/utils/navegacao";
import estilos from "./Feed.module.css";

/**
 * Feed — tela inicial (QRO-07, QRO-09).
 *
 * Aba (Todos / Procurando / Vendendo), filtros e ordenação vivem na URL e
 * combinam entre si; a lista carrega por páginas. Para quem entrou, o
 * backend só mostra anúncios cujo raio alcança a localização do perfil.
 *
 * Sem sessão, a mesma tela vira a home pública: "procura-se" ativos do Brasil
 * inteiro ou de uma UF (`?uf=`), cards só com o superficial e convite para
 * entrar. A aba Vendendo só convida a entrar.
 */

const metricasDoHero = (estatisticas?: EstatisticasPublicas): MetricaDoHero[] =>
  estatisticas
    ? [
        { icone: "📋", valor: estatisticas.anunciosAtivos, rotulo: "anúncios ativos" },
        { icone: "🏙️", valor: estatisticas.cidades, rotulo: "cidades cobertas" },
        { icone: "🤝", valor: estatisticas.vendedores, rotulo: "vendedores" },
      ]
    : [];

const CHAVE_DESCARTADAS = "quero.recomendacoes.descartadas";

function lerDescartadas(): string[] {
  try {
    const bruto = localStorage.getItem(CHAVE_DESCARTADAS);
    return bruto ? (JSON.parse(bruto) as string[]) : [];
  } catch {
    return [];
  }
}

/** Recomendações dispensadas ficam lembradas neste navegador. */
function useDescartadas() {
  const [descartadas, setDescartadas] = useState<string[]>(lerDescartadas);
  const descartar = (id: string) => {
    const proximas = [...descartadas, id];
    setDescartadas(proximas);
    try {
      localStorage.setItem(CHAVE_DESCARTADAS, JSON.stringify(proximas));
    } catch {
      /* sem armazenamento: vale até recarregar */
    }
  };
  return { descartadas, descartar };
}

/** Quantos cards antes da chamada discreta para entrar, na home pública. */
const CARDS_ANTES_DO_CONVITE = 6;

function FeedPublico({ metricas }: { metricas: MetricaDoHero[] }) {
  const localizacao = useLocation();
  const { filtros, alterar, limpar } = useFiltros();
  const retorno = `${localizacao.pathname}${localizacao.search}`;
  const filtrosPublicos = {
    ...filtros,
    tipo: filtros.tipo === "vendendo" ? ("vendendo" as const) : ("procurando" as const),
    distanciaMaxKm: null,
    ordenacao: ordenacaoPublica(filtros.ordenacao),
  };
  const naVitrine = filtrosPublicos.tipo === "vendendo";
  const feed = useFeedPublico(filtrosPublicos, !naVitrine);

  const itens = feed.data?.pages.flatMap((pagina) => pagina.itens) ?? [];
  const total = feed.data?.pages[0]?.total;
  // A distância não vale para o visitante: só contam UF, busca, categoria e preço.
  const temFiltroPublico =
    filtros.uf !== "" ||
    filtros.busca !== "" ||
    filtros.categoria !== "" ||
    filtros.precoMin !== null ||
    filtros.precoMax !== null;

  return (
    <>
      <Hero metricas={metricas} />

      <div className={`conteudo ${estilos.convite}`}>
        <ConviteParaEntrar retorno={retorno} />
      </div>

      <BarraDeFiltros
        publico
        filtros={filtrosPublicos}
        resultados={naVitrine ? undefined : feed.isPending ? undefined : total}
        aoAlterar={alterar}
        temFiltroAtivo={temFiltroPublico}
        aoLimpar={limpar}
      />

      <div className={`conteudo ${estilos.corpo}`}>
        {naVitrine ? (
          <EstadoVazio
            icone="🔒"
            titulo="Entre para ver produtos à venda perto de você"
            descricao="A vitrine mostra o que vendedores da sua região têm à pronta-entrega, filtrado pela localização do seu cadastro."
            acao={{ rotulo: "Entrar", para: entrarComRetorno(retorno) }}
            acaoSecundaria={{ rotulo: "Criar conta", para: cadastrarComRetorno(retorno) }}
          />
        ) : (
          <>
            {feed.isPending && <EsqueletoDeAnuncios />}

            {feed.isError && (
              <ErroAoCarregar titulo="Não foi possível carregar os anúncios" erro={feed.error} aoTentarDeNovo={() => feed.refetch()} />
            )}

            {feed.isSuccess && itens.length === 0 && (
              <EstadoVazio
                titulo="Nenhum anúncio encontrado"
                descricao={
                  temFiltroPublico
                    ? "Nenhum pedido corresponde a estes filtros. Tente outro estado, outra categoria ou amplie a faixa de preço."
                    : "Ainda não há pedidos publicados. Crie uma conta e seja o primeiro a anunciar o que procura."
                }
                acao={{ rotulo: "Publicar o que eu quero", para: entrarComRetorno("/anunciar") }}
                acaoSecundaria={temFiltroPublico ? { rotulo: "Limpar filtros", aoClicar: limpar } : undefined}
              />
            )}

            {itens.length > 0 && total !== undefined && (
              <div className={estilos.blocos}>
                <div>
                  <ResumoDaLista
                    total={total}
                    ordenacao={filtrosPublicos.ordenacao}
                    aoMudarOrdenacao={(ordenacao) => alterar({ ordenacao })}
                    semDistancia
                  />
                  <GradeDeAnuncios publico itens={itens.slice(0, CARDS_ANTES_DO_CONVITE)} />
                </div>

                {itens.length > CARDS_ANTES_DO_CONVITE && <ConviteDiscreto retorno={retorno} />}

                <GradeDeAnuncios publico itens={itens.slice(CARDS_ANTES_DO_CONVITE)} />

                {feed.hasNextPage && (
                  <div className={estilos.carregarMais}>
                    <Botao variante="secundario" carregando={feed.isFetchingNextPage} onClick={() => feed.fetchNextPage()}>
                      Carregar mais anúncios
                    </Botao>
                  </div>
                )}

                <ConviteDiscreto retorno={retorno} />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default function Feed() {
  const { autenticado, verificando, usuario } = useSessao();
  const { filtros, alterar, limpar, temFiltroAtivo } = useFiltros();

  // O backend só devolve o que alcança quem busca: exige sessão e localização.
  const semLocalizacao = autenticado && !usuario?.city && !usuario?.cep;
  const podeBuscar = autenticado && !semLocalizacao;

  const feed = useFeed(filtros, podeBuscar);
  const perto = usePertoDeVoce(podeBuscar);
  const recomendacoes = useRecomendacoes(podeBuscar && autenticado);
  const { descartadas, descartar } = useDescartadas();

  const itens = feed.data?.pages.flatMap((pagina) => pagina.itens) ?? [];
  const total = feed.data?.pages[0]?.total;
  const recomendados = (recomendacoes.data ?? []).filter(
    (anuncio) => !descartadas.includes(anuncio.id) && anuncio.comprador !== usuario?.id,
  );
  const primeiroBloco = itens.slice(0, 6);
  const segundoBloco = itens.slice(6);

  const metricas = metricasDoHero(useEstatisticas());

  if (!autenticado && !verificando) return <FeedPublico metricas={metricas} />;

  if (semLocalizacao) {
    return (
      <>
        <Hero metricas={metricas} />
        <div className="conteudo conteudo-com-respiro">
          <EstadoVazio
            icone="📍"
            titulo="Falta sua localização"
            descricao="O feed mostra anúncios cujo raio alcança você. Cadastre seu CEP ou cidade no perfil para ver o que procuram por perto."
            acao={{ rotulo: "Cadastrar localização", para: "/perfil" }}
          />
        </div>
      </>
    );
  }

  const acoesDaRecomendacao = (anuncio: Anuncio) => (
    <>
      <Botao
        tamanho="pequeno"
        variante="suave"
        para={`/anuncios/${anuncio.id}/ofertar`}
        aria-label={`Fazer oferta em ${anuncio.titulo}`}
      >
        Fazer oferta
      </Botao>
      <Botao
        tamanho="pequeno"
        variante="texto"
        onClick={() => descartar(anuncio.id)}
        aria-label={`Descartar recomendação ${anuncio.titulo}`}
      >
        Descartar
      </Botao>
    </>
  );

  return (
    <>
      <Hero metricas={metricas} />

      <BarraDeFiltros
        filtros={filtros}
        resultados={feed.isPending ? undefined : total}
        aoAlterar={alterar}
        temFiltroAtivo={temFiltroAtivo}
        aoLimpar={limpar}
        habilitarContagem={podeBuscar}
      />

      <div className={`conteudo ${estilos.corpo}`}>
        {(feed.isPending || verificando) && <EsqueletoDeAnuncios />}

        {feed.isError && (
          <ErroAoCarregar titulo="Não foi possível carregar o feed" erro={feed.error} aoTentarDeNovo={() => feed.refetch()} />
        )}

        {feed.isSuccess && itens.length === 0 && (
          <EstadoVazio
            titulo="Nenhum anúncio encontrado"
            descricao={
              temFiltroAtivo
                ? "Nenhum anúncio corresponde a estes filtros. Tente outra categoria, aumente a distância ou amplie a faixa de preço."
                : "Ainda não há anúncios ao seu alcance. Publique o que você procura e vendedores próximos te encontram."
            }
            acao={{ rotulo: "Publicar o que eu quero", para: "/anunciar" }}
            acaoSecundaria={temFiltroAtivo ? { rotulo: "Limpar filtros", aoClicar: limpar } : undefined}
          />
        )}

        {itens.length > 0 && total !== undefined && (
          <div className={estilos.blocos}>
            <div>
              <ResumoDaLista total={total} ordenacao={filtros.ordenacao} aoMudarOrdenacao={(ordenacao) => alterar({ ordenacao })} />
              <GradeDeAnuncios itens={primeiroBloco} />
            </div>

            <Carrossel
              titulo="Recomendados para você"
              subtitulo="Pedidos que combinam com o que você vende. Recomendar não envia oferta: você decide."
              icone="🎯"
              anuncios={recomendados}
              acoesDoCard={acoesDaRecomendacao}
            />


            <GradeDeAnuncios itens={segundoBloco} />

            {feed.hasNextPage && (
              <div className={estilos.carregarMais}>
                <Botao variante="secundario" carregando={feed.isFetchingNextPage} onClick={() => feed.fetchNextPage()}>
                  Carregar mais anúncios
                </Botao>
              </div>
            )}

            <Carrossel
              titulo={usuario?.city ? `Perto de você · ${usuario.city}` : "Perto de você"}
              subtitulo="Os pedidos mais próximos, sem os filtros acima"
              icone="📍"
              anuncios={perto.data?.itens ?? []}
              acento="info"
            />
          </div>
        )}
      </div>
    </>
  );
}
