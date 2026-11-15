import { Link, useSearchParams } from "react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { iniciais } from "@/api/autenticacao";
import {
  listarHistorico,
  resumirHistorico,
  type FiltrosDoHistorico,
  type Negociacao,
} from "@/api/negociacoes";
import { Avatar, Botao, Chip } from "@/componentes/base";
import { Carregando, ErroAoCarregar, EstadoVazio } from "@/componentes/estado";
import { fmtData, fmtNumero, fmtPrecoExato } from "@/utils/formato";
import estilos from "./Historico.module.css";

type Filtro = "todos" | "compras" | "vendas" | "encerradas";

/** Uma trilha só: cada chip vira o par papel/status que a API entende. */
const FILTROS: { valor: Filtro; rotulo: string; icone?: string; api: FiltrosDoHistorico }[] = [
  { valor: "todos", rotulo: "Todos", api: {} },
  { valor: "compras", rotulo: "Compras", icone: "🛒", api: { papel: "comprador" } },
  { valor: "vendas", rotulo: "Vendas", icone: "🏷️", api: { papel: "vendedor" } },
  { valor: "encerradas", rotulo: "Encerradas", icone: "❌", api: { status: "cancelada" } },
];

const filtroDaUrl = (valor: string | null): Filtro =>
  FILTROS.some((filtro) => filtro.valor === valor) ? (valor as Filtro) : "todos";

/** Data que encerrou a negociação, para ordenar a leitura do histórico. */
const dataDoDesfecho = (negociacao: Negociacao) =>
  negociacao.concluidaEm ?? negociacao.canceladaEm ?? negociacao.criadaEm;

/** `Lucas Tavares` → `Lucas T.`, como no protótipo. */
function nomeCurto(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length < 2) return nome.trim();
  return `${partes[0]} ${partes[partes.length - 1]![0]}.`;
}

const CORES_DE_AVATAR = [
  "var(--cat-eletronicos)",
  "var(--cat-veiculos)",
  "var(--cat-informatica)",
  "var(--cat-games)",
  "var(--cat-esportes)",
  "var(--cat-casa-jardim)",
];

/** A mesma pessoa sempre ganha a mesma cor. */
function corDoAvatar(id: string) {
  let soma = 0;
  for (const letra of id) soma = (soma + letra.charCodeAt(0)) % 997;
  return CORES_DE_AVATAR[soma % CORES_DE_AVATAR.length]!;
}

/**
 * Negociações concluídas e canceladas da própria pessoa (QRO-19). Somente
 * leitura; as em andamento ficam em Minhas ofertas e Meus anúncios.
 */
export default function Historico() {
  const [busca, setBusca] = useSearchParams();
  const ativo = filtroDaUrl(busca.get("filtro"));
  const filtros = FILTROS.find((filtro) => filtro.valor === ativo)!.api;

  const historico = useInfiniteQuery({
    queryKey: ["historico", ativo],
    queryFn: ({ pageParam }) => listarHistorico(filtros, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (pagina) => pagina.proximo,
  });

  const lista = historico.data?.pages.flatMap((pagina) => pagina.itens) ?? [];
  // Sem totais na API, a soma cobre só as páginas carregadas.
  const resumo = historico.data?.pages[0]?.resumo ?? resumirHistorico(lista);
  const parcial = !historico.data?.pages[0]?.resumo && historico.hasNextPage;
  const filtrando = ativo !== "todos";

  return (
    <div className={estilos.pagina}>
      <div className={estilos.topo}>
        <h1>Histórico</h1>
        <span className={estilos.subtitulo}>Negociações concluídas e canceladas</span>
      </div>

      {historico.isSuccess && (
        <section className={estilos.resumo} aria-label="Resumo">
          <div className={`${estilos.cartaoResumo} ${estilos.verde}`}>
            <span className={estilos.valorResumo}>{fmtNumero(resumo.concluidas)}</span>
            <span className={estilos.rotuloResumo}>Negociações concluídas</span>
          </div>
          <div className={`${estilos.cartaoResumo} ${estilos.laranja}`}>
            <span className={estilos.valorResumo}>{fmtPrecoExato(resumo.volume)}</span>
            <span className={estilos.rotuloResumo}>Volume negociado</span>
          </div>
          <div className={`${estilos.cartaoResumo} ${estilos.azul}`}>
            <span className={estilos.valorResumo}>{fmtNumero(resumo.total)}</span>
            <span className={estilos.rotuloResumo}>Total de negociações</span>
          </div>
          {parcial && <p className={estilos.notaResumo}>Totais das negociações carregadas até aqui.</p>}
        </section>
      )}

      <div className={`${estilos.filtros} sem-barra-de-rolagem`} role="group" aria-label="Filtrar histórico">
        {FILTROS.map((filtro) => (
          <Chip
            key={filtro.valor}
            ativo={ativo === filtro.valor}
            onClick={() => setBusca(filtro.valor === "todos" ? {} : { filtro: filtro.valor }, { replace: true })}
          >
            {filtro.icone && <span aria-hidden="true">{filtro.icone} </span>}
            {filtro.rotulo}
          </Chip>
        ))}
      </div>

      {historico.isPending && <Carregando rotulo="Carregando histórico…" />}
      {historico.isError && <ErroAoCarregar erro={historico.error} aoTentarDeNovo={() => historico.refetch()} />}

      {historico.isSuccess && lista.length === 0 && (
        <EstadoVazio
          icone="🗂️"
          titulo={filtrando ? "Nada com esse filtro" : "Você ainda não tem negociações encerradas"}
          descricao={
            filtrando
              ? "Troque o filtro para ver as outras negociações."
              : "Publique o que procura ou responda a um anúncio com uma oferta. Quando uma negociação for concluída ou cancelada, ela aparece aqui."
          }
          acao={
            filtrando
              ? { rotulo: "Ver todas", aoClicar: () => setBusca({}, { replace: true }) }
              : { rotulo: "Explorar anúncios", para: "/" }
          }
          acaoSecundaria={filtrando ? undefined : { rotulo: "Anunciar", para: "/anunciar" }}
        />
      )}

      {lista.length > 0 && (
        <ul className={estilos.lista}>
          {lista.map((negociacao) => (
            <ItemDoHistorico key={negociacao.id} negociacao={negociacao} />
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

/** Um cartão por negociação; o título é o link e cobre o cartão inteiro. */
function ItemDoHistorico({ negociacao }: { negociacao: Negociacao }) {
  const compra = negociacao.papel === "comprador";
  const concluida = negociacao.status === "concluida";
  const nome = nomeCurto(negociacao.contraparte.nome);
  const valor = fmtPrecoExato(negociacao.valorFinal);

  return (
    <li className={estilos.item}>
      <Avatar
        iniciais={iniciais(negociacao.contraparte.nome)}
        cor={corDoAvatar(negociacao.contraparte.id)}
        nome={negociacao.contraparte.nome}
        tamanho={40}
      />
      <div className={estilos.info}>
        <h2 className={estilos.produto}>
          <Link to={`/historico/${negociacao.id}`} className={estilos.link}>
            {negociacao.anuncio.titulo}
          </Link>
        </h2>
        <p className={estilos.detalhe}>
          {compra ? "Comprado de" : "Vendido para"} {nome} · {fmtData(dataDoDesfecho(negociacao))}
        </p>
      </div>
      <div className={estilos.lado}>
        {concluida ? (
          <span className={compra ? estilos.valorCompra : estilos.valorVenda}>
            <span className="apenas-leitor-de-tela">{compra ? "Pago " : "Recebido "}</span>
            <span aria-hidden="true">{compra ? "-" : "+"}</span>
            {valor}
          </span>
        ) : (
          <span className={estilos.valorCancelado}>{valor}</span>
        )}
        <span className={concluida ? estilos.selo : `${estilos.selo} ${estilos.seloCancelado}`}>
          {concluida ? (
            <>
              <span aria-hidden="true">✓ </span>Concluído
            </>
          ) : (
            <>
              <span aria-hidden="true">✕ </span>Cancelado
            </>
          )}
        </span>
        {negociacao.avaliacao.disponivel && (
          <Botao
            para={`/negociacoes/${negociacao.ofertaId}/avaliar`}
            tamanho="pequeno"
            variante="texto"
            className={estilos.avaliar}
          >
            Avaliar
          </Botao>
        )}
      </div>
    </li>
  );
}
