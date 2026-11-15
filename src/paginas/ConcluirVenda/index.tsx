import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { ErroDeApi, errosDeValidacao } from "@/api/cliente";
import {
  cancelarNegociacao,
  confirmarConclusao,
  recusarConclusao,
  solicitarConclusao,
  type Negociacao,
} from "@/api/negociacoes";
import { Badge, Botao, DialogoDeConfirmacao } from "@/componentes/base";
import { Aviso, Carregando, ErroAoCarregar, EstadoVazio } from "@/componentes/estado";
import negociacaoEstilos from "@/componentes/negociacao/Negociacao.module.css";
import { papelOposto, ROTULO_DA_NEGOCIACAO, ROTULO_DO_PAPEL, TOM_DA_NEGOCIACAO } from "@/componentes/negociacao/rotulos";
import { useNegociacaoDaOferta } from "@/hooks/useNegociacao";
import { fmtDataHora, fmtPrecoExato } from "@/utils/formato";
import estilos from "@/paginas/OfertarProduto/Ofertar.module.css";

type Acao = "solicitar" | "confirmar" | "recusar" | "cancelar";

const DIALOGOS: Record<Acao, { titulo: string; descricao: string; confirmar: string; perigo: boolean }> = {
  solicitar: {
    titulo: "Marcar a venda como concluída?",
    descricao:
      "O comprador recebe um pedido de confirmação. Se ele não responder no prazo, a conclusão é confirmada automaticamente.",
    confirmar: "Marcar como concluída",
    perigo: false,
  },
  confirmar: {
    titulo: "Confirmar que a venda foi concluída?",
    descricao: "O anúncio é encerrado e a negociação fica registrada como concluída. Uma venda concluída não pode ser reaberta.",
    confirmar: "Confirmar conclusão",
    perigo: false,
  },
  recusar: {
    titulo: "Negar a conclusão?",
    descricao: "A negociação continua em andamento e o vendedor pode marcar a conclusão de novo mais tarde.",
    confirmar: "Negar conclusão",
    perigo: true,
  },
  cancelar: {
    titulo: "Cancelar a negociação?",
    descricao: "A negociação é encerrada sem venda e o anúncio volta a aceitar ofertas.",
    confirmar: "Cancelar negociação",
    perigo: true,
  },
};

const RESULTADOS: Record<Acao, string> = {
  solicitar: "Conclusão marcada. Aguardando a confirmação do comprador.",
  confirmar: "Venda concluída. Vocês já podem se avaliar.",
  recusar: "Conclusão negada. A negociação segue em andamento.",
  cancelar: "Negociação cancelada. O anúncio voltou a aceitar ofertas.",
};

/**
 * Conclusão da venda (QRO-15, QRO-16): o vendedor marca, o comprador confirma
 * ou nega, e qualquer parte pode cancelar enquanto está em andamento. Cada
 * botão depende do estado que a API devolveu; uma venda concluída fica só
 * para consulta.
 */
export default function ConcluirVenda() {
  const { id = "" } = useParams();
  const clienteDeConsulta = useQueryClient();
  const { carregando, erro, naoEncontrada, negociacao, recarregar } = useNegociacaoDaOferta(id);
  const [acao, setAcao] = useState<Acao>();
  const [resultado, setResultado] = useState<{ tom: "sucesso" | "erro"; texto: string }>();

  const executar = useMutation({
    mutationFn: async ({ escolha, negociacaoId }: { escolha: Acao; negociacaoId: string }) => {
      if (escolha === "solicitar") await solicitarConclusao(negociacaoId);
      else if (escolha === "confirmar") await confirmarConclusao(negociacaoId);
      else if (escolha === "recusar") await recusarConclusao(negociacaoId);
      else await cancelarNegociacao(negociacaoId);
      return escolha;
    },
    onSuccess: (escolha) => setResultado({ tom: "sucesso", texto: RESULTADOS[escolha] }),
    onError: (falha) => {
      const { geral } = errosDeValidacao(falha);
      setResultado({
        tom: "erro",
        texto: geral ?? (falha instanceof ErroDeApi ? falha.message : "Não foi possível concluir a ação."),
      });
    },
    onSettled: () => {
      setAcao(undefined);
      return Promise.all([
        clienteDeConsulta.invalidateQueries({ queryKey: ["negociacao"] }),
        clienteDeConsulta.invalidateQueries({ queryKey: ["oferta", id] }),
        clienteDeConsulta.invalidateQueries({ queryKey: ["conversa", id] }),
        clienteDeConsulta.invalidateQueries({ queryKey: ["historico"] }),
      ]);
    },
  });

  return (
    <div className={estilos.pagina}>
      <Link to={`/negociacoes/${id}`} className={estilos.voltar}>
        ← Voltar à negociação
      </Link>
      <h1 className={estilos.titulo}>Conclusão da venda</h1>

      {resultado && <Aviso tom={resultado.tom}>{resultado.texto}</Aviso>}
      {carregando && <Carregando rotulo="Carregando negociação…" />}
      {!carregando && erro && <ErroAoCarregar erro={erro} aoTentarDeNovo={() => recarregar()} />}
      {naoEncontrada && (
        <EstadoVazio
          icone="🤝"
          titulo="Ainda não há negociação para concluir"
          descricao="A conclusão fica disponível depois que o comprador aceita a oferta."
          acao={{ rotulo: "Voltar à negociação", para: `/negociacoes/${id}` }}
        />
      )}

      {negociacao && (
        <PainelDeConclusao negociacao={negociacao} ofertaId={id} aoEscolher={setAcao} />
      )}

      {acao && negociacao && (
        <DialogoDeConfirmacao
          titulo={DIALOGOS[acao].titulo}
          descricao={DIALOGOS[acao].descricao}
          rotuloDeConfirmar={DIALOGOS[acao].confirmar}
          varianteDeConfirmar={DIALOGOS[acao].perigo ? "perigo" : "primario"}
          ocupado={executar.isPending}
          aoCancelar={() => setAcao(undefined)}
          aoConfirmar={() => executar.mutate({ escolha: acao, negociacaoId: negociacao.id })}
        />
      )}
    </div>
  );
}

function PainelDeConclusao({
  negociacao,
  ofertaId,
  aoEscolher,
}: {
  negociacao: Negociacao;
  ofertaId: string;
  aoEscolher: (acao: Acao) => void;
}) {
  const { papel, status } = negociacao;
  const emAndamento = status === "em_andamento";
  const aguardandoComprador = emAndamento && negociacao.conclusaoSolicitadaEm !== null;

  return (
    <>
      <section className={estilos.cartao} aria-label="Resumo">
        <div className={estilos.linhaTitulo}>
          <h2>{negociacao.anuncio.titulo}</h2>
          <Badge tom={TOM_DA_NEGOCIACAO[status]}>{ROTULO_DA_NEGOCIACAO[status]}</Badge>
        </div>
        <p className={estilos.detalhes}>
          <span>
            {ROTULO_DO_PAPEL[papelOposto(papel)]}: <strong>{negociacao.contraparte.nome}</strong>
          </span>
          <span>Aberta em {fmtDataHora(negociacao.criadaEm)}</span>
        </p>
        <div>
          <span className={estilos.rotulo}>Valor acordado</span>
          <p className={negociacaoEstilos.valorGrande}>{fmtPrecoExato(negociacao.valorFinal)}</p>
        </div>
      </section>

      <section className={negociacaoEstilos.secao} aria-label="Confirmações">
        <h2>Confirmações</h2>
        <ul className={negociacaoEstilos.tempo}>
          <li className={negociacaoEstilos.evento}>
            <span className={negociacaoEstilos.passo} aria-hidden="true">
              1.
            </span>
            <div className={negociacaoEstilos.eventoCorpo}>
              <strong>Vendedor</strong>
              <span className={negociacaoEstilos.meta}>
                {negociacao.conclusaoSolicitadaEm
                  ? `Marcou a venda como concluída em ${fmtDataHora(negociacao.conclusaoSolicitadaEm)}`
                  : negociacao.concluidaEm
                    ? "Marcou a venda como concluída"
                    : "Ainda não marcou a venda como concluída"}
              </span>
            </div>
          </li>
          <li className={negociacaoEstilos.evento}>
            <span className={negociacaoEstilos.passo} aria-hidden="true">
              2.
            </span>
            <div className={negociacaoEstilos.eventoCorpo}>
              <strong>Comprador</strong>
              <span className={negociacaoEstilos.meta}>
                {negociacao.confirmadaEm
                  ? `Confirmou em ${fmtDataHora(negociacao.confirmadaEm)}`
                  : negociacao.conclusaoAutomatica
                    ? "Não respondeu no prazo: a conclusão foi confirmada automaticamente"
                    : aguardandoComprador && negociacao.prazoConfirmacaoEm
                      ? `Pode confirmar ou negar até ${fmtDataHora(negociacao.prazoConfirmacaoEm)}`
                      : "Ainda não confirmou"}
              </span>
            </div>
          </li>
        </ul>

        {status === "concluida" && (
          <Aviso tom="sucesso" titulo="Venda concluída">
            {negociacao.concluidaEm ? `Concluída em ${fmtDataHora(negociacao.concluidaEm)}. ` : ""}
            Uma venda concluída não pode ser reaberta.
          </Aviso>
        )}
        {status === "cancelada" && (
          <Aviso tom="erro" titulo="Negociação cancelada">
            {negociacao.canceladaEm ? `Cancelada em ${fmtDataHora(negociacao.canceladaEm)}.` : "Cancelada."}
          </Aviso>
        )}

        {emAndamento && (
          <div className={negociacaoEstilos.acoes}>
            {papel === "vendedor" && !aguardandoComprador && (
              <Botao onClick={() => aoEscolher("solicitar")}>Marcar venda como concluída</Botao>
            )}
            {papel === "vendedor" && aguardandoComprador && (
              <p className={negociacaoEstilos.texto}>Aguardando a confirmação do comprador.</p>
            )}
            {papel === "comprador" && aguardandoComprador && (
              <>
                <Botao onClick={() => aoEscolher("confirmar")}>Confirmar conclusão</Botao>
                <Botao variante="secundario" onClick={() => aoEscolher("recusar")}>
                  Negar conclusão
                </Botao>
              </>
            )}
            {papel === "comprador" && !aguardandoComprador && (
              <p className={negociacaoEstilos.texto}>O vendedor marca a venda como concluída e você confirma aqui.</p>
            )}
            <Botao variante="perigo" onClick={() => aoEscolher("cancelar")}>
              Cancelar negociação
            </Botao>
          </div>
        )}

        {negociacao.avaliacao.disponivel && (
          <div className={negociacaoEstilos.acoes}>
            <Botao para={`/negociacoes/${ofertaId}/avaliar`}>Avaliar {negociacao.contraparte.nome}</Botao>
          </div>
        )}
        {negociacao.avaliacao.enviada && <p className={negociacaoEstilos.meta}>Você já avaliou esta negociação.</p>}
      </section>
    </>
  );
}
