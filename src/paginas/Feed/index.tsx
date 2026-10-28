import { useState } from "react";
import { useLocation } from "react-router";
import { apiConfigurada } from "@/api/cliente";
import type { Anuncio } from "@/api/meusAnuncios";
import { Botao } from "@/componentes/base";
import {
  BarraDeFiltros,
  Carrossel,
  FaixaDeConversao,
  GradeDeAnuncios,
  Hero,
  ResumoDaLista,
} from "@/componentes/feed";
import type { MetricaDoHero } from "@/componentes/feed";
import { ErroAoCarregar, EsqueletoDeAnuncios, EstadoVazio } from "@/componentes/estado";
import { useFeed, usePertoDeVoce, useRecomendacoes } from "@/hooks/useAnuncios";
import { useFiltros } from "@/hooks/useFiltros";
import { useSessao } from "@/hooks/useSessao";

/**
 * Feed — tela inicial (QRO-07, QRO-09).
 *
 * Filtros e ordenação vivem na URL e combinam entre si; a lista carrega por
 * páginas. Com a API, o feed exige sessão e localização: o backend só mostra
 * anúncios cujo raio alcança quem busca.
 */

const METRICAS_DE_DEMONSTRACAO: MetricaDoHero[] = [
  { icone: "📋", valor: 2847, rotulo: "anúncios ativos" },
  { icone: "🏙️", valor: 314, rotulo: "cidades cobertas" },
  { icone: "🤝", valor: 18400, rotulo: "vendedores" },
];

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

export default function Feed() {
  const { autenticado, verificando, usuario } = useSessao();
  const localizacao = useLocation();
  const { filtros, alterar, limpar, temFiltroAtivo } = useFiltros();

  const comApi = apiConfigurada();
  const semLocalizacao = comApi && autenticado && !usuario?.city && !usuario?.cep;
  const podeBuscar = !comApi || (autenticado && !semLocalizacao);

  const feed = useFeed(filtros, podeBuscar);
  const perto = usePertoDeVoce(podeBuscar);
  const recomendacoes = useRecomendacoes(podeBuscar && autenticado);
  const { descartadas, descartar } = useDescartadas();

  const anuncios = feed.data?.pages.flatMap((pagina) => pagina.itens) ?? [];
  const total = feed.data?.pages[0]?.total;
  const recomendados = (recomendacoes.data ?? []).filter(
    (anuncio) => !descartadas.includes(anuncio.id) && anuncio.comprador !== usuario?.id,
  );
  const primeiroBloco = anuncios.slice(0, 6);
  const segundoBloco = anuncios.slice(6);

  const metricas: MetricaDoHero[] = !comApi
    ? METRICAS_DE_DEMONSTRACAO
    : total !== undefined
      ? [{ icone: "📋", valor: total, rotulo: "anúncios ao seu alcance" }]
      : [];

  if (comApi && !podeBuscar && !verificando) {
    const retorno = encodeURIComponent(`${localizacao.pathname}${localizacao.search}`);
    return (
      <>
        <Hero metricas={[]} />
        <div className="conteudo" style={{ paddingBlock: "var(--espaco-4)" }}>
          {semLocalizacao ? (
            <EstadoVazio
              icone="📍"
              titulo="Falta sua localização"
              descricao="O feed mostra anúncios cujo raio alcança você. Cadastre seu CEP ou cidade no perfil para ver o que procuram por perto."
              acao={{ rotulo: "Cadastrar localização", para: "/perfil" }}
            />
          ) : (
            <EstadoVazio
              icone="🔐"
              titulo="Entre para ver anúncios perto de você"
              descricao="O feed usa a sua localização para mostrar só o que está ao seu alcance."
              acao={{ rotulo: "Entrar", para: `/entrar?retorno=${retorno}` }}
              acaoSecundaria={{ rotulo: "Criar conta", para: `/cadastrar?retorno=${retorno}` }}
            />
          )}
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
      />

      <div className="conteudo" style={{ paddingBlock: "var(--espaco-3) var(--espaco-5)" }}>
        {(feed.isPending || verificando) && <EsqueletoDeAnuncios />}

        {feed.isError && (
          <ErroAoCarregar titulo="Não foi possível carregar o feed" erro={feed.error} aoTentarDeNovo={() => feed.refetch()} />
        )}

        {feed.isSuccess && anuncios.length === 0 && (
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

        {anuncios.length > 0 && total !== undefined && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-4)" }}>
            <div>
              <ResumoDaLista total={total} ordenacao={filtros.ordenacao} aoMudarOrdenacao={(ordenacao) => alterar({ ordenacao })} />
              <GradeDeAnuncios anuncios={primeiroBloco} />
            </div>

            <Carrossel
              titulo="Recomendados para você"
              subtitulo="Pedidos que combinam com o que você vende. Recomendar não envia oferta: você decide."
              icone="🎯"
              anuncios={recomendados}
              acoesDoCard={acoesDaRecomendacao}
            />

            {!autenticado && <FaixaDeConversao />}

            <GradeDeAnuncios anuncios={segundoBloco} />

            {feed.hasNextPage && (
              <div style={{ display: "flex", justifyContent: "center" }}>
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
