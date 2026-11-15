import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { listarHistorico, type FiltrosDoHistorico, type Negociacao } from "@/api/negociacoes";
import { Badge, Botao, Chip } from "@/componentes/base";
import { Carregando, ErroAoCarregar, EstadoVazio } from "@/componentes/estado";
import { papelOposto, ROTULO_DA_NEGOCIACAO, ROTULO_DO_PAPEL, TOM_DA_NEGOCIACAO } from "@/componentes/negociacao/rotulos";
import { fmtData, fmtPrecoExato } from "@/utils/formato";
import estilos from "@/paginas/MeusAnuncios/MeusAnuncios.module.css";

const PAPEIS: { valor: FiltrosDoHistorico["papel"]; rotulo: string }[] = [
  { valor: undefined, rotulo: "Todas" },
  { valor: "comprador", rotulo: "Compras" },
  { valor: "vendedor", rotulo: "Vendas" },
];

const STATUS: { valor: FiltrosDoHistorico["status"]; rotulo: string }[] = [
  { valor: undefined, rotulo: "Qualquer status" },
  { valor: "concluida", rotulo: "Concluídas" },
  { valor: "cancelada", rotulo: "Canceladas" },
];

/** Data que encerrou a negociação, para ordenar a leitura do histórico. */
const dataDoDesfecho = (negociacao: Negociacao) =>
  negociacao.concluidaEm ?? negociacao.canceladaEm ?? negociacao.criadaEm;

/**
 * Negociações concluídas e canceladas da própria pessoa (QRO-19). Somente
 * leitura; as em andamento ficam em Minhas ofertas e Meus anúncios.
 */
export default function Historico() {
  const [busca, setBusca] = useSearchParams();
  const papelDaUrl = busca.get("papel");
  const statusDaUrl = busca.get("status");
  const filtros: FiltrosDoHistorico = {
    papel: papelDaUrl === "comprador" || papelDaUrl === "vendedor" ? papelDaUrl : undefined,
    status: statusDaUrl === "concluida" || statusDaUrl === "cancelada" ? statusDaUrl : undefined,
  };

  const filtrar = (mudanca: Partial<FiltrosDoHistorico>) => {
    const proximos = { ...filtros, ...mudanca };
    const parametros: Record<string, string> = {};
    if (proximos.papel) parametros.papel = proximos.papel;
    if (proximos.status) parametros.status = proximos.status;
    setBusca(parametros, { replace: true });
  };

  const historico = useInfiniteQuery({
    queryKey: ["historico", filtros.papel ?? "todas", filtros.status ?? "todos"],
    queryFn: ({ pageParam }) => listarHistorico(filtros, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (pagina) => pagina.proximo,
  });

  const lista = historico.data?.pages.flatMap((pagina) => pagina.itens) ?? [];
  const filtrando = Boolean(filtros.papel || filtros.status);

  return (
    <div className={estilos.pagina}>
      <div className={estilos.topo}>
        <div>
          <h1>Histórico</h1>
          <span className={estilos.resumo}>Negociações concluídas e canceladas.</span>
        </div>
      </div>

      <div className={estilos.acoes} role="group" aria-label="Filtrar por papel">
        {PAPEIS.map((item) => (
          <Chip key={item.rotulo} ativo={filtros.papel === item.valor} onClick={() => filtrar({ papel: item.valor })}>
            {item.rotulo}
          </Chip>
        ))}
      </div>
      <div className={estilos.acoes} role="group" aria-label="Filtrar por status" style={{ marginTop: "var(--espaco-1)" }}>
        {STATUS.map((item) => (
          <Chip key={item.rotulo} ativo={filtros.status === item.valor} onClick={() => filtrar({ status: item.valor })}>
            {item.rotulo}
          </Chip>
        ))}
      </div>

      {historico.isPending && <Carregando rotulo="Carregando histórico…" />}
      {historico.isError && <ErroAoCarregar erro={historico.error} aoTentarDeNovo={() => historico.refetch()} />}

      {historico.isSuccess && lista.length === 0 && (
        <EstadoVazio
          icone="🗂️"
          titulo={filtrando ? "Nada com esses filtros" : "Você ainda não tem negociações encerradas"}
          descricao={
            filtrando
              ? "Troque os filtros para ver as outras negociações."
              : "Publique o que procura ou responda a um anúncio com uma oferta. Quando uma negociação for concluída ou cancelada, ela aparece aqui."
          }
          acao={filtrando ? { rotulo: "Limpar filtros", aoClicar: () => setBusca({}, { replace: true }) } : { rotulo: "Explorar anúncios", para: "/" }}
          acaoSecundaria={filtrando ? undefined : { rotulo: "Anunciar", para: "/anunciar" }}
        />
      )}

      {lista.length > 0 && (
        <ul className={estilos.lista}>
          {lista.map((negociacao) => (
            <li key={negociacao.id} className={estilos.item}>
              <div className={estilos.info}>
                <div className={estilos.linhaTitulo}>
                  <h2>{negociacao.anuncio.titulo}</h2>
                  <Badge tom={TOM_DA_NEGOCIACAO[negociacao.status]}>{ROTULO_DA_NEGOCIACAO[negociacao.status]}</Badge>
                  <Badge tom="info">{negociacao.papel === "comprador" ? "Compra" : "Venda"}</Badge>
                </div>
                <p className={estilos.detalhes}>
                  <span className={estilos.preco}>{fmtPrecoExato(negociacao.valorFinal)}</span>
                  <span>
                    {ROTULO_DO_PAPEL[papelOposto(negociacao.papel)]}: {negociacao.contraparte.nome}
                  </span>
                  <span>{fmtData(dataDoDesfecho(negociacao))}</span>
                </p>
              </div>
              <div className={estilos.acoes}>
                <Botao para={`/historico/${negociacao.id}`} variante="secundario" tamanho="pequeno">
                  Ver detalhes
                </Botao>
                {negociacao.avaliacao.disponivel && (
                  <Botao para={`/negociacoes/${negociacao.ofertaId}/avaliar`} tamanho="pequeno">
                    Avaliar
                  </Botao>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {historico.hasNextPage && (
        <div className={estilos.carregarMais}>
          <Botao variante="secundario" carregando={historico.isFetchingNextPage} onClick={() => historico.fetchNextPage()}>
            Carregar mais
          </Botao>
        </div>
      )}
    </div>
  );
}
