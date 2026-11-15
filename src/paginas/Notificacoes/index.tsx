import { useEffect, useState, type ReactNode } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";
import { ErroDeApi, errosDeValidacao } from "@/api/cliente";
import {
  CANAIS,
  contarNaoLidas,
  destinoDaNotificacao,
  listarNotificacoes,
  marcarComoLida,
  obterPreferencias,
  rotuloDoTipo,
  salvarPreferencias,
  TIPO_OBRIGATORIO,
  TIPOS_DE_NOTIFICACAO,
  visualDaNotificacao,
  type Notificacao,
  type Preferencia,
} from "@/api/notificacoes";
import type { Pagina } from "@/api/paginacao";
import { Botao, Chip } from "@/componentes/base";
import { Aviso, Carregando, ErroAoCarregar, EstadoVazio } from "@/componentes/estado";
import negociacaoEstilos from "@/componentes/negociacao/Negociacao.module.css";
import { fmtDataHora, fmtPlural } from "@/utils/formato";
import { fmtHaQuanto } from "@/utils/tempo";
import estilos from "./Notificacoes.module.css";

/** Central de notificações e preferências de canal (QRO-17). */
export default function Notificacoes() {
  const [busca, setBusca] = useSearchParams();
  const aba = busca.get("aba") === "preferencias" ? "preferencias" : "central";

  const abas = (
    <div className={estilos.abas} role="group" aria-label="Seções">
      <Chip ativo={aba === "central"} onClick={() => setBusca({}, { replace: true })}>
        Central
      </Chip>
      <Chip ativo={aba === "preferencias"} onClick={() => setBusca({ aba: "preferencias" }, { replace: true })}>
        Preferências
      </Chip>
    </div>
  );

  return <div className={estilos.pagina}>{aba === "central" ? <Central abas={abas} /> : <Preferencias abas={abas} />}</div>;
}

function Central({ abas }: { abas: ReactNode }) {
  const navegar = useNavigate();
  const clienteDeConsulta = useQueryClient();
  const [erro, setErro] = useState<string>();

  const notificacoes = useInfiniteQuery({
    queryKey: ["notificacoes", "lista"],
    queryFn: ({ pageParam }) => listarNotificacoes(pageParam),
    initialPageParam: "1" as string | null,
    getNextPageParam: (pagina) => pagina.proximo,
  });
  // A mesma consulta do sino: os dois contadores andam juntos.
  const contagem = useQuery({ queryKey: ["notificacoes", "nao-lidas"], queryFn: contarNaoLidas });

  const lista = notificacoes.data?.pages.flatMap((pagina) => pagina.itens) ?? [];
  const naoLidasDaLista = lista.filter((notificacao) => !notificacao.lidaEm);
  const naoLidas = contagem.data ?? naoLidasDaLista.length;

  /** Marca na tela na hora (lista e sino) e confirma com o servidor depois. */
  const marcarNaTela = (ids: string[]) => {
    const agora = new Date().toISOString();
    clienteDeConsulta.setQueryData<InfiniteData<Pagina<Notificacao>>>(["notificacoes", "lista"], (dados) =>
      dados && {
        ...dados,
        pages: dados.pages.map((pagina) => ({
          ...pagina,
          itens: pagina.itens.map((item) => (ids.includes(item.id) && !item.lidaEm ? { ...item, lidaEm: agora } : item)),
        })),
      },
    );
    clienteDeConsulta.setQueryData<number>(["notificacoes", "nao-lidas"], (atual) =>
      atual === undefined ? atual : Math.max(0, atual - ids.length),
    );
  };

  const atualizar = () => clienteDeConsulta.invalidateQueries({ queryKey: ["notificacoes"] });

  const marcar = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(marcarComoLida)),
    onMutate: marcarNaTela,
    onError: (falha) => setErro(falha instanceof ErroDeApi ? falha.message : "Não foi possível marcar como lida."),
    onSettled: atualizar,
  });

  const abrir = (notificacao: Notificacao) => {
    if (!notificacao.lidaEm) marcar.mutate([notificacao.id]);
    const destino = destinoDaNotificacao(notificacao);
    if (destino) navegar(destino);
  };

  return (
    <>
      <div className={estilos.topo}>
        <div>
          <h1>Notificações</h1>
          {notificacoes.isSuccess && (
            <span className={estilos.resumo} role="status">
              {naoLidas ? fmtPlural(naoLidas, "não lida", "não lidas") : "Tudo lido"}
            </span>
          )}
        </div>
        {naoLidasDaLista.length > 0 && (
          <Botao
            variante="texto"
            tamanho="pequeno"
            carregando={marcar.isPending}
            onClick={() => marcar.mutate(naoLidasDaLista.map((notificacao) => notificacao.id))}
          >
            Marcar todas como lidas
          </Botao>
        )}
      </div>
      {abas}

      {erro && <Aviso tom="erro">{erro}</Aviso>}
      {notificacoes.isPending && <Carregando rotulo="Carregando notificações…" />}
      {notificacoes.isError && (
        <ErroAoCarregar erro={notificacoes.error} aoTentarDeNovo={() => notificacoes.refetch()} />
      )}

      {notificacoes.isSuccess && lista.length === 0 && (
        <EstadoVazio
          icone="🔔"
          titulo="Nenhuma notificação por aqui"
          descricao="Ofertas, contrapropostas, mensagens e conclusões das suas negociações aparecem aqui."
          acao={{ rotulo: "Explorar anúncios", para: "/" }}
        />
      )}

      {lista.length > 0 && (
        <ul className={estilos.lista} aria-label="Notificações">
          {lista.map((notificacao) => (
            <CartaoDeNotificacao key={notificacao.id} notificacao={notificacao} aoAbrir={() => abrir(notificacao)} />
          ))}
        </ul>
      )}

      {notificacoes.hasNextPage && (
        <div className={estilos.carregarMais}>
          <Botao
            variante="secundario"
            carregando={notificacoes.isFetchingNextPage}
            onClick={() => notificacoes.fetchNextPage()}
          >
            Carregar mais
          </Botao>
        </div>
      )}
    </>
  );
}

/**
 * Cartão de uma notificação. O título é o botão: o cartão inteiro reage ao
 * clique, que marca como lida e leva ao anúncio ou à negociação.
 */
function CartaoDeNotificacao({ notificacao, aoAbrir }: { notificacao: Notificacao; aoAbrir: () => void }) {
  const naoLida = !notificacao.lidaEm;
  const { icone, tom } = visualDaNotificacao(notificacao);
  const temDestino = destinoDaNotificacao(notificacao) !== null;

  return (
    <li className={`${estilos.cartao} ${naoLida ? estilos.naoLida : ""} ${temDestino ? estilos.clicavel : ""}`}>
      <span className={`${estilos.icone} ${estilos[`tom_${tom}`]}`} aria-hidden="true">
        {icone}
      </span>
      <div className={estilos.corpo}>
        <h2 className={estilos.titulo}>
          {temDestino || naoLida ? (
            <button type="button" className={estilos.abrir} onClick={aoAbrir}>
              {notificacao.titulo}
            </button>
          ) : (
            notificacao.titulo
          )}
        </h2>
        <p className={estilos.mensagem}>{notificacao.mensagem}</p>
        <p className={estilos.meta}>
          <span className="apenas-leitor-de-tela">{rotuloDoTipo(notificacao.tipo)} · </span>
          <time dateTime={notificacao.criadaEm} title={fmtDataHora(notificacao.criadaEm)}>
            {fmtHaQuanto(notificacao.criadaEm)}
          </time>
        </p>
      </div>
      {naoLida && (
        <span className={estilos.ponto}>
          <span className="apenas-leitor-de-tela">Não lida</span>
        </span>
      )}
    </li>
  );
}

const chave = (preferencia: Pick<Preferencia, "tipo" | "canal">) => `${preferencia.tipo}:${preferencia.canal}`;

function Preferencias({ abas }: { abas: ReactNode }) {
  const clienteDeConsulta = useQueryClient();
  const preferencias = useQuery({ queryKey: ["notificacoes", "preferencias"], queryFn: obterPreferencias });
  const [marcadas, setMarcadas] = useState<Record<string, boolean>>({});
  const [resultado, setResultado] = useState<{ tom: "sucesso" | "erro"; texto: string }>();

  useEffect(() => {
    if (preferencias.data) {
      setMarcadas(Object.fromEntries(preferencias.data.map((item) => [chave(item), item.habilitada])));
    }
  }, [preferencias.data]);

  const salvar = useMutation({
    mutationFn: () =>
      salvarPreferencias(
        (preferencias.data ?? [])
          .filter((item) => item.tipo !== TIPO_OBRIGATORIO)
          .map((item) => ({ ...item, habilitada: marcadas[chave(item)] ?? item.habilitada })),
      ),
    onSuccess: (salvas) => {
      clienteDeConsulta.setQueryData(["notificacoes", "preferencias"], salvas);
      setResultado({ tom: "sucesso", texto: "Preferências salvas." });
    },
    onError: (falha) => {
      const { geral } = errosDeValidacao(falha);
      setResultado({
        tom: "erro",
        texto: geral ?? (falha instanceof ErroDeApi ? falha.message : "Não foi possível salvar."),
      });
    },
  });

  const topo = (
    <>
      <div className={estilos.topo}>
        <div>
          <h1>Notificações</h1>
          <span className={estilos.resumo}>Escolha o que receber e por qual canal</span>
        </div>
      </div>
      {abas}
    </>
  );

  if (preferencias.isPending) {
    return (
      <>
        {topo}
        <Carregando rotulo="Carregando preferências…" />
      </>
    );
  }
  if (preferencias.isError) {
    return (
      <>
        {topo}
        <ErroAoCarregar erro={preferencias.error} aoTentarDeNovo={() => preferencias.refetch()} />
      </>
    );
  }

  return (
    <>
    {topo}
    <form
      className={negociacaoEstilos.secao}
      onSubmit={(evento) => {
        evento.preventDefault();
        setResultado(undefined);
        salvar.mutate();
      }}
      aria-label="Preferências de notificação"
    >
      <h2>O que você quer receber</h2>
      <p className={negociacaoEstilos.texto}>
        Escolha os avisos e os canais. Os avisos de segurança da conta não podem ser desligados.
      </p>
      {resultado && <Aviso tom={resultado.tom}>{resultado.texto}</Aviso>}
      <div className={negociacaoEstilos.tabelaRolavel}>
        <table className={negociacaoEstilos.tabela}>
          <thead>
            <tr>
              <th scope="col">Aviso</th>
              {CANAIS.map((canal) => (
                <th key={canal.canal} scope="col">
                  {canal.rotulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIPOS_DE_NOTIFICACAO.map(({ tipo, rotulo }) => (
              <tr key={tipo}>
                <th scope="row">{rotulo}</th>
                {CANAIS.map((canal) => {
                  const obrigatorio = tipo === TIPO_OBRIGATORIO;
                  return (
                    <td key={canal.canal}>
                      <input
                        type="checkbox"
                        aria-label={`${rotulo} ${canal.rotulo.toLowerCase()}`}
                        checked={obrigatorio || (marcadas[chave({ tipo, canal: canal.canal })] ?? true)}
                        disabled={obrigatorio}
                        onChange={(evento) =>
                          setMarcadas((atuais) => ({
                            ...atuais,
                            [chave({ tipo, canal: canal.canal })]: evento.target.checked,
                          }))
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={negociacaoEstilos.acoes}>
        <Botao type="submit" carregando={salvar.isPending}>
          Salvar preferências
        </Botao>
      </div>
    </form>
    </>
  );
}
