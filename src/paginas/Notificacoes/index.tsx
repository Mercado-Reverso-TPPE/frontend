import { useEffect, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";
import { ErroDeApi, errosDeValidacao } from "@/api/cliente";
import {
  CANAIS,
  destinoDaNotificacao,
  listarNotificacoes,
  marcarComoLida,
  obterPreferencias,
  rotuloDoTipo,
  salvarPreferencias,
  TIPO_OBRIGATORIO,
  TIPOS_DE_NOTIFICACAO,
  type Notificacao,
  type Preferencia,
} from "@/api/notificacoes";
import { Badge, Botao, Chip } from "@/componentes/base";
import { Aviso, Carregando, ErroAoCarregar, EstadoVazio } from "@/componentes/estado";
import negociacaoEstilos from "@/componentes/negociacao/Negociacao.module.css";
import { fmtDataHora, fmtPlural } from "@/utils/formato";
import estilos from "@/paginas/MeusAnuncios/MeusAnuncios.module.css";

/** Central de notificações e preferências de canal (QRO-17). */
export default function Notificacoes() {
  const [busca, setBusca] = useSearchParams();
  const aba = busca.get("aba") === "preferencias" ? "preferencias" : "central";

  return (
    <div className={estilos.pagina}>
      <div className={estilos.topo}>
        <h1>Notificações</h1>
        <div className={estilos.acoes} role="group" aria-label="Seções">
          <Chip ativo={aba === "central"} onClick={() => setBusca({}, { replace: true })}>
            Central
          </Chip>
          <Chip ativo={aba === "preferencias"} onClick={() => setBusca({ aba: "preferencias" }, { replace: true })}>
            Preferências
          </Chip>
        </div>
      </div>
      {aba === "central" ? <Central /> : <Preferencias />}
    </div>
  );
}

function Central() {
  const navegar = useNavigate();
  const clienteDeConsulta = useQueryClient();
  const [erro, setErro] = useState<string>();

  const notificacoes = useInfiniteQuery({
    queryKey: ["notificacoes", "lista"],
    queryFn: ({ pageParam }) => listarNotificacoes(pageParam),
    initialPageParam: "1" as string | null,
    getNextPageParam: (pagina) => pagina.proximo,
  });

  const atualizar = () => clienteDeConsulta.invalidateQueries({ queryKey: ["notificacoes"] });

  const marcar = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(marcarComoLida)),
    onError: (falha) => setErro(falha instanceof ErroDeApi ? falha.message : "Não foi possível marcar como lida."),
    onSettled: atualizar,
  });

  const lista = notificacoes.data?.pages.flatMap((pagina) => pagina.itens) ?? [];
  const naoLidas = lista.filter((notificacao) => !notificacao.lidaEm);

  const abrir = async (notificacao: Notificacao) => {
    if (!notificacao.lidaEm) {
      try {
        await marcarComoLida(notificacao.id);
        void atualizar();
      } catch {
        // Abrir o destino importa mais que a marcação; ela é refeita na próxima visita.
      }
    }
    const destino = destinoDaNotificacao(notificacao);
    if (destino) navegar(destino);
  };

  return (
    <>
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
        <div className={estilos.topo}>
          <span className={estilos.resumo} role="status">
            {naoLidas.length ? fmtPlural(naoLidas.length, "não lida", "não lidas") : "Tudo lido"}
          </span>
          {naoLidas.length > 0 && (
            <Botao
              variante="texto"
              tamanho="pequeno"
              carregando={marcar.isPending}
              onClick={() => marcar.mutate(naoLidas.map((notificacao) => notificacao.id))}
            >
              Marcar todas como lidas
            </Botao>
          )}
        </div>
      )}

      {lista.length > 0 && (
        <ul className={estilos.lista} aria-label="Notificações">
          {lista.map((notificacao) => {
            const destino = destinoDaNotificacao(notificacao);
            return (
              <li key={notificacao.id} className={estilos.item}>
                <div className={estilos.info}>
                  <div className={estilos.linhaTitulo}>
                    <h2>{notificacao.titulo}</h2>
                    {!notificacao.lidaEm && <Badge tom="marca">Não lida</Badge>}
                  </div>
                  <p className={negociacaoEstilos.texto}>{notificacao.mensagem}</p>
                  <p className={estilos.detalhes}>
                    <span>{rotuloDoTipo(notificacao.tipo)}</span>
                    <span>{fmtDataHora(notificacao.criadaEm)}</span>
                  </p>
                </div>
                <div className={estilos.acoes}>
                  {destino && (
                    <Botao tamanho="pequeno" variante="secundario" onClick={() => void abrir(notificacao)}>
                      Abrir
                    </Botao>
                  )}
                  {!notificacao.lidaEm && (
                    <Botao
                      tamanho="pequeno"
                      variante="texto"
                      onClick={() => marcar.mutate([notificacao.id])}
                      aria-label={`Marcar “${notificacao.titulo}” como lida`}
                    >
                      Marcar como lida
                    </Botao>
                  )}
                </div>
              </li>
            );
          })}
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

const chave = (preferencia: Pick<Preferencia, "tipo" | "canal">) => `${preferencia.tipo}:${preferencia.canal}`;

function Preferencias() {
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

  if (preferencias.isPending) return <Carregando rotulo="Carregando preferências…" />;
  if (preferencias.isError) {
    return <ErroAoCarregar erro={preferencias.error} aoTentarDeNovo={() => preferencias.refetch()} />;
  }

  return (
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
  );
}
