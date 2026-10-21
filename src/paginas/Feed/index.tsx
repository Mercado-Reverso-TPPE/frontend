import { Carrossel, FaixaDeConversao, GradeDeAnuncios, Hero } from "@/componentes/feed";
import { BarraDeFiltros } from "@/componentes/feed";
import { ErroAoCarregar, EsqueletoDeAnuncios, EstadoVazio } from "@/componentes/estado";
import { useAnuncios } from "@/hooks/useAnuncios";
import { useFiltros } from "@/hooks/useFiltros";
import { BUYER_ADS, SELLER_ADS } from "@/dados/demo";
import type { MetricaDoHero } from "@/componentes/feed";
import type { AnyAd } from "@/api/tipos";

/**
 * Feed — tela inicial (QRO-04, QRO-07, QRO-09).
 *
 * Os filtros vivem na URL, a lista vem do recurso de anúncios e os três
 * estados da listagem — carregando, erro e vazio — usam os componentes
 * compartilhados. Recomendações e proximidade ainda são de demonstração:
 * dependem dos endpoints de recomendação e geolocalização.
 */

const METRICAS: MetricaDoHero[] = [
  { icone: "📋", valor: 2847, rotulo: "anúncios ativos" },
  { icone: "🏙️", valor: 314, rotulo: "cidades cobertas" },
  { icone: "🤝", valor: 18400, rotulo: "vendedores" },
];

const RECOMENDADOS: AnyAd[] = [
  BUYER_ADS[0], SELLER_ADS[0], BUYER_ADS[2], SELLER_ADS[1], BUYER_ADS[4], SELLER_ADS[2],
];
const PERTO_DE_VOCE: AnyAd[] = [
  SELLER_ADS[0], BUYER_ADS[1], SELLER_ADS[3], BUYER_ADS[3], SELLER_ADS[1],
];
const CIDADE_DE_REFERENCIA = "São Paulo, SP";
const INTERESSES = ["Eletrônicos", "Informática", "Games"];

export default function Feed() {
  const { filtros, definirTipo, definirCategoria, definirOrdenacao, limpar, temFiltroAtivo } = useFiltros();
  const { data, isPending, isError, error, refetch } = useAnuncios(filtros);

  const anuncios = data?.itens ?? [];
  const primeiroBloco = anuncios.slice(0, 6);
  const segundoBloco = anuncios.slice(6);

  return (
    <>
      <Hero metricas={METRICAS} />

      <BarraDeFiltros
        tipo={filtros.tipo}
        categoria={filtros.categoria}
        ordenacao={filtros.ordenacao}
        resultados={isPending ? undefined : data?.total}
        aoMudarTipo={definirTipo}
        aoMudarCategoria={definirCategoria}
        aoMudarOrdenacao={definirOrdenacao}
      />

      <div className="conteudo" style={{ paddingBlock: "var(--espaco-3) var(--espaco-5)" }}>
        {isPending && <EsqueletoDeAnuncios />}

        {isError && (
          <ErroAoCarregar
            titulo="Não foi possível carregar o feed"
            erro={error}
            aoTentarDeNovo={() => refetch()}
          />
        )}

        {!isPending && !isError && anuncios.length === 0 && (
          <EstadoVazio
            titulo="Nenhum anúncio encontrado"
            descricao={
              temFiltroAtivo
                ? "Nenhum anúncio corresponde a estes filtros. Limpe os filtros para ver tudo ou publique o que você procura."
                : "Ainda não há anúncios publicados. Seja a primeira pessoa a dizer o que quer."
            }
            acao={{ rotulo: "Publicar o que eu quero", para: "/anunciar" }}
            acaoSecundaria={temFiltroAtivo ? { rotulo: "Limpar filtros", aoClicar: limpar } : undefined}
          />
        )}

        {!isPending && !isError && anuncios.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-4)" }}>
            <GradeDeAnuncios anuncios={primeiroBloco} />

            <Carrossel
              titulo="Recomendados para você"
              subtitulo={`Baseado nos seus interesses: ${INTERESSES.join(", ")}`}
              icone="🎯"
              anuncios={RECOMENDADOS}
            />

            <FaixaDeConversao />

            <GradeDeAnuncios anuncios={segundoBloco} />

            <Carrossel
              titulo={`Perto de você · ${CIDADE_DE_REFERENCIA}`}
              subtitulo="Anúncios na sua cidade para negociar com facilidade"
              icone="📍"
              anuncios={PERTO_DE_VOCE}
              acento="info"
            />
          </div>
        )}
      </div>
    </>
  );
}
