import { useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { ErroDeApi } from "@/api/cliente";
import { obterMeuAnuncio } from "@/api/meusAnuncios";
import { listarOfertasRecebidas, ofertaFoiEditada, rotuloDaConservacao, type Oferta } from "@/api/ofertas";
import { Badge, Botao, Campo } from "@/componentes/base";
import { Carregando, ErroAoCarregar, EstadoVazio } from "@/componentes/estado";
import negociacaoEstilos from "@/componentes/negociacao/Negociacao.module.css";
import { EstimativaDePreco } from "@/componentes/negociacao/Palpites";
import { ROTULO_DA_OFERTA, TOM_DA_OFERTA } from "@/componentes/oferta/status";
import { fmtDataHora, fmtPlural, fmtPrecoExato } from "@/utils/formato";
import estilos from "@/paginas/MeusAnuncios/MeusAnuncios.module.css";

type Ordem = "menor_preco" | "maior_preco" | "recentes" | "atualizadas";

const ORDENS: { valor: Ordem; rotulo: string }[] = [
  { valor: "menor_preco", rotulo: "Menor preço" },
  { valor: "maior_preco", rotulo: "Maior preço" },
  { valor: "recentes", rotulo: "Mais recentes" },
  { valor: "atualizadas", rotulo: "Alteradas por último" },
];

const COMPARADORES: Record<Ordem, (a: Oferta, b: Oferta) => number> = {
  menor_preco: (a, b) => a.preco - b.preco,
  maior_preco: (a, b) => b.preco - a.preco,
  recentes: (a, b) => b.criadaEm.localeCompare(a.criadaEm),
  atualizadas: (a, b) => b.atualizadaEm.localeCompare(a.atualizadaEm),
};

const tituloDaOferta = (oferta: Oferta) =>
  oferta.produtoNome || oferta.descricao.split("\n")[0]?.slice(0, 80) || "Oferta";

const rodadas = (oferta: Oferta) =>
  oferta.historico.reduce((maior, evento) => (evento.tipo === "contraproposta" ? Math.max(maior, evento.rodada) : maior), 0);

/** Atributos comparados lado a lado — os mesmos para toda oferta selecionada. */
const ATRIBUTOS: { rotulo: string; valor: (oferta: Oferta) => string }[] = [
  { rotulo: "Preço", valor: (oferta) => fmtPrecoExato(oferta.preco) },
  { rotulo: "Conservação", valor: (oferta) => rotuloDaConservacao(oferta.estadoDeConservacao) },
  { rotulo: "Vendedor", valor: (oferta) => oferta.vendedorNome || "—" },
  { rotulo: "Produto", valor: (oferta) => oferta.produtoNome || "Oferta avulsa" },
  { rotulo: "Status", valor: (oferta) => ROTULO_DA_OFERTA[oferta.status] },
  { rotulo: "Enviada em", valor: (oferta) => fmtDataHora(oferta.criadaEm) },
  { rotulo: "Valor alterado", valor: (oferta) => (ofertaFoiEditada(oferta) ? "Sim" : "Não") },
  { rotulo: "Rodadas de contraproposta", valor: (oferta) => String(rodadas(oferta)) },
];

/**
 * Ofertas recebidas pelo comprador no próprio anúncio (QRO-11). A lista só é
 * pedida depois de confirmar que o anúncio é da pessoa: um vendedor que
 * chegue aqui não recebe nem vê ofertas concorrentes.
 */
export default function OfertasRecebidas() {
  const { id = "" } = useParams();
  const [ordem, setOrdem] = useState<Ordem>("menor_preco");
  const [selecionadas, setSelecionadas] = useState<string[]>([]);

  const anuncio = useQuery({ queryKey: ["meus-anuncios", "detalhe", id], queryFn: () => obterMeuAnuncio(id) });

  const ofertas = useInfiniteQuery({
    queryKey: ["ofertas", "recebidas", id],
    queryFn: ({ pageParam }) => listarOfertasRecebidas(id, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (pagina) => pagina.proximo,
    enabled: anuncio.isSuccess,
  });

  const lista = useMemo(
    () => [...(ofertas.data?.pages.flatMap((pagina) => pagina.itens) ?? [])].sort(COMPARADORES[ordem]),
    [ofertas.data, ordem],
  );
  const comparadas = lista.filter((oferta) => selecionadas.includes(oferta.id));

  const alternar = (ofertaId: string) =>
    setSelecionadas((atuais) =>
      atuais.includes(ofertaId) ? atuais.filter((item) => item !== ofertaId) : [...atuais, ofertaId],
    );

  if (anuncio.isPending) {
    return (
      <div className={estilos.pagina}>
        <Carregando rotulo="Carregando anúncio…" />
      </div>
    );
  }

  if (anuncio.isError) {
    const naoEhDono = anuncio.error instanceof ErroDeApi && [403, 404].includes(anuncio.error.status);
    return (
      <div className={estilos.pagina}>
        {naoEhDono ? (
          <EstadoVazio
            icone="🔒"
            titulo="Só quem publicou vê as ofertas"
            descricao="As ofertas de um anúncio ficam visíveis apenas para o comprador. Se você é vendedor, acompanhe a sua oferta."
            acao={{ rotulo: "Ver o anúncio", para: `/anuncios/${id}` }}
            acaoSecundaria={{ rotulo: "Minhas ofertas", para: "/minhas-ofertas" }}
          />
        ) : (
          <ErroAoCarregar erro={anuncio.error} aoTentarDeNovo={() => anuncio.refetch()} />
        )}
      </div>
    );
  }

  return (
    <div className={estilos.pagina}>
      <Link to="/meus-anuncios" className={negociacaoEstilos.meta}>
        ← Meus anúncios
      </Link>
      <div className={estilos.topo}>
        <div>
          <h1>Ofertas recebidas</h1>
          <span className={estilos.resumo}>
            {anuncio.data.titulo}
            {ofertas.isSuccess && ` · ${fmtPlural(lista.length, "oferta ativa", "ofertas ativas")}`}
          </span>
        </div>
        {lista.length > 1 && (
          <Campo
            como="select"
            rotulo="Ordenar por"
            value={ordem}
            onChange={(evento) => setOrdem(evento.target.value as Ordem)}
          >
            {ORDENS.map((item) => (
              <option key={item.valor} value={item.valor}>
                {item.rotulo}
              </option>
            ))}
          </Campo>
        )}
      </div>

      <EstimativaDePreco anuncioId={id} />

      {ofertas.isPending && <Carregando rotulo="Carregando ofertas…" />}
      {ofertas.isError && <ErroAoCarregar erro={ofertas.error} aoTentarDeNovo={() => ofertas.refetch()} />}

      {ofertas.isSuccess && lista.length === 0 && (
        <EstadoVazio
          icone="📭"
          titulo="Nenhuma oferta ativa"
          descricao="Quando vendedores da região responderem, as ofertas aparecem aqui. Ofertas retiradas ou recusadas saem da lista."
          acao={{ rotulo: "Ver o anúncio", para: `/anuncios/${id}` }}
        />
      )}

      {comparadas.length >= 2 && (
        <section className={negociacaoEstilos.secao} aria-label="Comparação de ofertas">
          <h2>Comparando {comparadas.length} ofertas</h2>
          <div className={negociacaoEstilos.tabelaRolavel}>
            <table className={negociacaoEstilos.tabela}>
              <thead>
                <tr>
                  <th scope="col">Atributo</th>
                  {comparadas.map((oferta) => (
                    <th key={oferta.id} scope="col">
                      {tituloDaOferta(oferta)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ATRIBUTOS.map((atributo) => (
                  <tr key={atributo.rotulo}>
                    <th scope="row">{atributo.rotulo}</th>
                    {comparadas.map((oferta) => (
                      <td key={oferta.id}>{atributo.valor(oferta)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={negociacaoEstilos.acoes}>
            <Botao variante="texto" onClick={() => setSelecionadas([])}>
              Limpar comparação
            </Botao>
          </div>
        </section>
      )}
      {comparadas.length === 1 && (
        <p className={negociacaoEstilos.meta} role="status">
          Selecione mais uma oferta para comparar lado a lado.
        </p>
      )}

      {lista.length > 0 && (
        <ul className={estilos.lista}>
          {lista.map((oferta) => (
            <li key={oferta.id} className={estilos.item}>
              {oferta.produtoFoto && (
                <img className={negociacaoEstilos.miniatura} src={oferta.produtoFoto} alt={tituloDaOferta(oferta)} />
              )}
              <div className={estilos.info}>
                <div className={estilos.linhaTitulo}>
                  <h2>{tituloDaOferta(oferta)}</h2>
                  <Badge tom={TOM_DA_OFERTA[oferta.status]}>{ROTULO_DA_OFERTA[oferta.status]}</Badge>
                  {ofertaFoiEditada(oferta) && <Badge tom="aviso">Valor alterado</Badge>}
                </div>
                <p className={estilos.detalhes}>
                  <span className={estilos.preco}>{fmtPrecoExato(oferta.preco)}</span>
                  <span>{rotuloDaConservacao(oferta.estadoDeConservacao)}</span>
                  {oferta.vendedorNome && <span>{oferta.vendedorNome}</span>}
                  <span>Enviada em {fmtDataHora(oferta.criadaEm)}</span>
                </p>
              </div>
              <div className={estilos.acoes}>
                <label className={negociacaoEstilos.linha}>
                  <input
                    type="checkbox"
                    checked={selecionadas.includes(oferta.id)}
                    onChange={() => alternar(oferta.id)}
                    aria-label={`Comparar ${tituloDaOferta(oferta)}`}
                  />
                  Comparar
                </label>
                <Botao para={`/negociacoes/${oferta.id}`} tamanho="pequeno">
                  Abrir negociação
                </Botao>
              </div>
            </li>
          ))}
        </ul>
      )}

      {ofertas.hasNextPage && (
        <div className={estilos.carregarMais}>
          <Botao variante="secundario" carregando={ofertas.isFetchingNextPage} onClick={() => ofertas.fetchNextPage()}>
            Carregar mais
          </Botao>
        </div>
      )}
    </div>
  );
}
