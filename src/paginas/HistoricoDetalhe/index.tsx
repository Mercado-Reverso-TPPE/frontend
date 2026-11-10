import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { ErroDeApi } from "@/api/cliente";
import { obterHistorico } from "@/api/negociacoes";
import { Badge, Botao } from "@/componentes/base";
import { Carregando, ErroAoCarregar, EstadoVazio } from "@/componentes/estado";
import negociacaoEstilos from "@/componentes/negociacao/Negociacao.module.css";
import {
  papelOposto,
  ROTULO_DA_NEGOCIACAO,
  ROTULO_DO_EVENTO,
  ROTULO_DO_PAPEL,
  TOM_DA_NEGOCIACAO,
} from "@/componentes/negociacao/rotulos";
import { fmtDataHora, fmtPrecoExato } from "@/utils/formato";
import estilos from "@/paginas/OfertarProduto/Ofertar.module.css";

/**
 * Uma negociação encerrada (QRO-19): valores propostos e mensagens trocadas.
 * Somente leitura — nada aqui altera a negociação.
 */
export default function HistoricoDetalhe() {
  const { id = "" } = useParams();
  const negociacao = useQuery({ queryKey: ["historico", "detalhe", id], queryFn: () => obterHistorico(id) });

  return (
    <div className={estilos.pagina}>
      <Link to="/historico" className={estilos.voltar}>
        ← Histórico
      </Link>

      {negociacao.isPending && <Carregando rotulo="Carregando negociação…" />}
      {negociacao.isError &&
        (negociacao.error instanceof ErroDeApi && negociacao.error.status === 404 ? (
          <EstadoVazio
            icone="🗂️"
            titulo="Negociação não encontrada"
            descricao="Ela pode ainda estar em andamento ou não ser sua. O histórico mostra só negociações concluídas e canceladas."
            acao={{ rotulo: "Ver histórico", para: "/historico" }}
          />
        ) : (
          <ErroAoCarregar erro={negociacao.error} aoTentarDeNovo={() => negociacao.refetch()} />
        ))}

      {negociacao.data && (
        <>
          <section className={estilos.cartao} aria-label="Resumo">
            <div className={estilos.linhaTitulo}>
              <h1 className={estilos.titulo}>{negociacao.data.anuncio.titulo}</h1>
              <Badge tom={TOM_DA_NEGOCIACAO[negociacao.data.status]}>{ROTULO_DA_NEGOCIACAO[negociacao.data.status]}</Badge>
            </div>
            <p className={estilos.detalhes}>
              <span>{negociacao.data.papel === "comprador" ? "Você comprou" : "Você vendeu"}</span>
              <span>
                {ROTULO_DO_PAPEL[papelOposto(negociacao.data.papel)]}: <strong>{negociacao.data.contraparte.nome}</strong>
              </span>
            </p>
            <dl className={negociacaoEstilos.faixa}>
              <div>
                <dt>Valor inicial</dt>
                <dd>{fmtPrecoExato(negociacao.data.precoInicial)}</dd>
              </div>
              <div>
                <dt>Valor final</dt>
                <dd>{fmtPrecoExato(negociacao.data.valorFinal)}</dd>
              </div>
              <div>
                <dt>{negociacao.data.status === "concluida" ? "Concluída em" : "Cancelada em"}</dt>
                <dd>
                  {fmtDataHora(
                    negociacao.data.concluidaEm ?? negociacao.data.canceladaEm ?? negociacao.data.criadaEm,
                  )}
                </dd>
              </div>
            </dl>
            {negociacao.data.conclusaoAutomatica && (
              <p className={negociacaoEstilos.meta}>Concluída automaticamente: o comprador não respondeu no prazo.</p>
            )}
            {negociacao.data.avaliacao.disponivel && (
              <div className={estilos.acoes}>
                <Botao para={`/negociacoes/${negociacao.data.ofertaId}/avaliar`}>
                  Avaliar {negociacao.data.contraparte.nome}
                </Botao>
              </div>
            )}
          </section>

          <section className={negociacaoEstilos.secao} aria-label="Valores propostos">
            <h2>Valores propostos</h2>
            {negociacao.data.precos.length === 0 ? (
              <p className={negociacaoEstilos.meta}>Nenhum valor registrado.</p>
            ) : (
              <ol className={negociacaoEstilos.tempo}>
                {negociacao.data.precos.map((preco, indice) => (
                  <li key={`${preco.registradoEm}-${indice}`} className={negociacaoEstilos.evento}>
                    <span className={negociacaoEstilos.passo} aria-hidden="true">
                      {indice + 1}.
                    </span>
                    <div className={negociacaoEstilos.eventoCorpo}>
                      <strong>{ROTULO_DO_EVENTO[preco.tipo] ?? preco.tipo}</strong>
                      <span className={negociacaoEstilos.meta}>
                        {fmtDataHora(preco.registradoEm)}
                        {preco.rodada > 0 && ` · rodada ${preco.rodada}`}
                      </span>
                    </div>
                    <span className={negociacaoEstilos.valor}>{fmtPrecoExato(preco.preco)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className={negociacaoEstilos.secao} aria-label="Mensagens">
            <h2>Mensagens</h2>
            {negociacao.data.mensagens.length === 0 ? (
              <p className={negociacaoEstilos.meta}>Nenhuma mensagem foi trocada.</p>
            ) : (
              <ol className={negociacaoEstilos.mensagens}>
                {negociacao.data.mensagens.map((mensagem) => (
                  <li
                    key={mensagem.id}
                    className={`${negociacaoEstilos.mensagem} ${mensagem.minha ? negociacaoEstilos.mensagemMinha : ""}`}
                  >
                    <p>{mensagem.texto}</p>
                    <span>
                      {mensagem.minha ? "Você" : mensagem.autorNome} · {fmtDataHora(mensagem.registradaEm)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </div>
  );
}
