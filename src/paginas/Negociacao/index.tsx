import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { ErroDeApi, errosDeValidacao } from "@/api/cliente";
import { obterConversa } from "@/api/negociacoes";
import {
  aceitarOferta,
  enviarContraproposta,
  obterOferta,
  recusarOferta,
  responderContraproposta,
  rotuloDaConservacao,
  situacaoDaNegociacao,
  type Oferta,
  type Papel,
} from "@/api/ofertas";
import { Badge, Botao, Campo, DialogoDeConfirmacao } from "@/componentes/base";
import { Aviso, Carregando, ErroAoCarregar, EstadoVazio } from "@/componentes/estado";
import { Conversa } from "@/componentes/negociacao/Conversa";
import { LinhaDoTempo } from "@/componentes/negociacao/LinhaDoTempo";
import { papelOposto, ROTULO_DO_PAPEL } from "@/componentes/negociacao/rotulos";
import negociacaoEstilos from "@/componentes/negociacao/Negociacao.module.css";
import { ROTULO_DA_OFERTA, TOM_DA_OFERTA } from "@/componentes/oferta/status";
import { chaveDaNegociacaoDaOferta } from "@/hooks/useNegociacao";
import { useSessao } from "@/hooks/useSessao";
import { fmtDataHora, fmtPrecoExato } from "@/utils/formato";
import { lerValorEmReais } from "@/utils/valores";
import estilos from "@/paginas/OfertarProduto/Ofertar.module.css";

type Decisao = "aceitar-oferta" | "recusar-oferta" | "aceitar-contraproposta" | "recusar-contraproposta";
type Resultado = { tom: "sucesso" | "erro"; texto: string };

const mensagemDoErro = (erro: unknown, padrao: string) => {
  const { geral, campos } = errosDeValidacao(erro);
  return geral ?? Object.values(campos)[0] ?? (erro instanceof ErroDeApi ? erro.message : padrao);
};

const DIALOGOS: Record<Decisao, { titulo: string; descricao: string; confirmar: string; perigo: boolean; motivo: boolean }> = {
  "aceitar-oferta": {
    titulo: "Aceitar esta oferta?",
    descricao:
      "O anúncio passa a “em negociação” e para de receber ofertas. As demais ofertas são recusadas automaticamente e os vendedores são avisados.",
    confirmar: "Aceitar oferta",
    perigo: false,
    motivo: false,
  },
  "recusar-oferta": {
    titulo: "Recusar esta oferta?",
    descricao: "A recusa é definitiva: o vendedor precisa enviar uma nova oferta se quiser voltar a concorrer.",
    confirmar: "Recusar oferta",
    perigo: true,
    motivo: true,
  },
  "aceitar-contraproposta": {
    titulo: "Aceitar a contraproposta?",
    descricao:
      "O valor proposto vira o preço acordado e a oferta é aceita. A venda ainda precisa ser concluída pelas duas partes.",
    confirmar: "Aceitar contraproposta",
    perigo: false,
    motivo: false,
  },
  "recusar-contraproposta": {
    titulo: "Recusar a contraproposta?",
    descricao: "A oferta volta ao valor anterior e a outra parte é avisada.",
    confirmar: "Recusar contraproposta",
    perigo: true,
    motivo: true,
  },
};

/**
 * Negociação de uma oferta (QRO-12 a QRO-15): histórico de valores,
 * contraproposta, aceite, recusa e o chat. `:id` é o id da oferta, que é o
 * que identifica a conversa entre as duas partes.
 */
export default function Negociacao() {
  const { id = "" } = useParams();
  const { usuario } = useSessao();
  const clienteDeConsulta = useQueryClient();
  const [decisao, setDecisao] = useState<Decisao>();
  const [motivo, setMotivo] = useState("");
  const [propondo, setPropondo] = useState(false);
  const [resultado, setResultado] = useState<Resultado>();

  const oferta = useQuery({ queryKey: ["oferta", id], queryFn: () => obterOferta(id) });
  const conversa = useQuery({ queryKey: ["conversa", id], queryFn: () => obterConversa(id) });

  const atualizar = () =>
    Promise.all([
      clienteDeConsulta.invalidateQueries({ queryKey: ["oferta", id] }),
      clienteDeConsulta.invalidateQueries({ queryKey: ["conversa", id] }),
      clienteDeConsulta.invalidateQueries({ queryKey: ["ofertas"] }),
    ]);

  const decidir = useMutation({
    mutationFn: async (escolha: Decisao) => {
      if (escolha === "aceitar-oferta") {
        const negociacao = await aceitarOferta(id);
        clienteDeConsulta.setQueryData(chaveDaNegociacaoDaOferta(id), negociacao.id);
        return `Oferta aceita por ${fmtPrecoExato(negociacao.valorFinal)}. O anúncio está em negociação e as demais ofertas foram recusadas.`;
      }
      if (escolha === "recusar-oferta") {
        await recusarOferta(id, motivo);
        return "Oferta recusada. O vendedor foi avisado.";
      }
      if (escolha === "aceitar-contraproposta") {
        const aceita = await responderContraproposta(id, { acao: "aceitar" });
        return `Contraproposta aceita. Valor acordado: ${fmtPrecoExato(aceita.preco)}.`;
      }
      await responderContraproposta(id, { acao: "recusar", justificativa: motivo });
      return "Contraproposta recusada. A oferta voltou ao valor anterior.";
    },
    onSuccess: (texto) => setResultado({ tom: "sucesso", texto }),
    onError: (erro) => setResultado({ tom: "erro", texto: mensagemDoErro(erro, "Não foi possível concluir a ação.") }),
    onSettled: () => {
      setDecisao(undefined);
      setMotivo("");
      return atualizar();
    },
  });

  if (oferta.isPending || conversa.isPending) {
    return (
      <div className={estilos.pagina}>
        <Carregando rotulo="Carregando negociação…" />
      </div>
    );
  }

  if (oferta.isError) {
    const naoParticipa = oferta.error instanceof ErroDeApi && [403, 404].includes(oferta.error.status);
    return (
      <div className={estilos.pagina}>
        {naoParticipa ? (
          <EstadoVazio
            icone="🔒"
            titulo="Negociação indisponível"
            descricao="Ela não existe ou você não participa dela. As suas estão em Minhas ofertas e Meus anúncios."
            acao={{ rotulo: "Minhas ofertas", para: "/minhas-ofertas" }}
            acaoSecundaria={{ rotulo: "Meus anúncios", para: "/meus-anuncios" }}
          />
        ) : (
          <ErroAoCarregar erro={oferta.error} aoTentarDeNovo={() => oferta.refetch()} />
        )}
      </div>
    );
  }

  const dados = oferta.data;
  const usuarioId = usuario?.id ?? "";
  const papel: Papel = conversa.data?.papel ?? (usuarioId === dados.vendedorId ? "vendedor" : "comprador");
  const somenteLeitura = conversa.data?.somenteLeitura ?? (dados.status === "recusada" || dados.status === "retirada");
  const situacao = situacaoDaNegociacao(dados, { usuarioId, papel, anuncioAtivo: !somenteLeitura });
  const outraParte = conversa.data?.contraparte.nome || (papel === "comprador" ? dados.vendedorNome : "Comprador");
  const titulo = conversa.data?.anuncioTitulo || dados.produtoNome || "Negociação";
  const dialogo = decisao ? DIALOGOS[decisao] : undefined;

  return (
    <div className={estilos.pagina}>
      <Link
        to={papel === "comprador" ? `/anuncios/${dados.anuncioId}/ofertas` : "/minhas-ofertas"}
        className={estilos.voltar}
      >
        ← {papel === "comprador" ? "Ofertas recebidas" : "Minhas ofertas"}
      </Link>

      <div>
        <h1 className={estilos.titulo}>{titulo}</h1>
        <p className={negociacaoEstilos.linha}>
          <span>
            {ROTULO_DO_PAPEL[papelOposto(papel)]}: <strong>{outraParte}</strong>
          </span>
          <Badge tom={TOM_DA_OFERTA[dados.status]}>{ROTULO_DA_OFERTA[dados.status]}</Badge>
        </p>
      </div>

      {resultado && <Aviso tom={resultado.tom}>{resultado.texto}</Aviso>}

      <ResumoDaOferta oferta={dados} />

      <section className={negociacaoEstilos.secao} aria-label="Valores da negociação">
        <h2>Valores</h2>
        {situacao.rodadaAtual > 0 && (
          <p className={negociacaoEstilos.meta}>Rodada atual de contraproposta: {situacao.rodadaAtual}</p>
        )}

        {situacao.pendente && (
          <div className={negociacaoEstilos.pendente} role="group" aria-label="Contraproposta aguardando resposta">
            <p className={negociacaoEstilos.meta}>
              Contraproposta {situacao.pendente.autorId === usuarioId ? "sua" : `do ${ROTULO_DO_PAPEL[papelOposto(papel)].toLowerCase()}`}
              {" · "}rodada {situacao.pendente.rodada}
            </p>
            <p className={negociacaoEstilos.valorGrande}>{fmtPrecoExato(situacao.pendente.preco ?? 0)}</p>
            {situacao.pendente.texto && <p className={negociacaoEstilos.justificativa}>“{situacao.pendente.texto}”</p>}
            {situacao.pendente.expiraEm && (
              <p className={negociacaoEstilos.meta}>Prazo para resposta: até {fmtDataHora(situacao.pendente.expiraEm)}</p>
            )}
            {!situacao.devoResponder && (
              <p className={negociacaoEstilos.texto}>Aguardando a resposta da outra parte.</p>
            )}
          </div>
        )}

        {situacao.devoResponder && !propondo && (
          <div className={negociacaoEstilos.acoes} role="group" aria-label="Responder à contraproposta">
            <Botao onClick={() => setDecisao("aceitar-contraproposta")}>Aceitar contraproposta</Botao>
            <Botao variante="secundario" onClick={() => setPropondo(true)}>
              Propor outro valor
            </Botao>
            <Botao variante="perigo" onClick={() => setDecisao("recusar-contraproposta")}>
              Recusar contraproposta
            </Botao>
          </div>
        )}

        {!situacao.pendente && (situacao.podeDecidirOferta || situacao.podeContrapor) && !propondo && (
          <div className={negociacaoEstilos.acoes} role="group" aria-label="Decidir sobre a oferta">
            {situacao.podeDecidirOferta && (
              <Botao onClick={() => setDecisao("aceitar-oferta")}>Aceitar oferta</Botao>
            )}
            {situacao.podeContrapor && (
              <Botao variante="secundario" onClick={() => setPropondo(true)}>
                Fazer contraproposta
              </Botao>
            )}
            {situacao.podeDecidirOferta && (
              <Botao variante="perigo" onClick={() => setDecisao("recusar-oferta")}>
                Recusar oferta
              </Botao>
            )}
          </div>
        )}

        {propondo && (
          <FormularioDeContraproposta
            oferta={dados}
            papel={papel}
            substituindo={situacao.devoResponder}
            aoCancelar={() => setPropondo(false)}
            aoConcluir={async (texto) => {
              setPropondo(false);
              setResultado({ tom: "sucesso", texto });
              await atualizar();
            }}
          />
        )}

        {!situacao.emAberto && dados.status !== "aceita" && (
          <p className={negociacaoEstilos.texto}>Esta oferta não aceita mais propostas de valor.</p>
        )}

        <LinhaDoTempo eventos={dados.historico} usuarioId={usuarioId} papel={papel} />
      </section>

      {dados.status === "aceita" && (
        <section className={negociacaoEstilos.secao} aria-label="Conclusão">
          <h2>Oferta aceita por {fmtPrecoExato(dados.preco)}</h2>
          <p className={negociacaoEstilos.texto}>
            Combinem entrega e pagamento pela conversa. Depois, o vendedor marca a venda como concluída e o comprador
            confirma.
          </p>
          <div className={negociacaoEstilos.acoes}>
            <Botao para={`/negociacoes/${id}/concluir`}>Acompanhar conclusão</Botao>
          </div>
        </section>
      )}

      <Conversa ofertaId={id} somenteLeitura={somenteLeitura} />

      {dialogo && decisao && (
        <DialogoDeConfirmacao
          titulo={dialogo.titulo}
          descricao={dialogo.descricao}
          rotuloDeConfirmar={dialogo.confirmar}
          varianteDeConfirmar={dialogo.perigo ? "perigo" : "primario"}
          ocupado={decidir.isPending}
          aoCancelar={() => {
            setDecisao(undefined);
            setMotivo("");
          }}
          aoConfirmar={() => decidir.mutate(decisao)}
        >
          {dialogo.motivo && (
            <Campo
              como="textarea"
              rotulo="Motivo (opcional)"
              dica="Só a outra parte vê o motivo."
              linhas={2}
              maxLength={2000}
              value={motivo}
              onChange={(evento) => setMotivo(evento.target.value)}
            />
          )}
        </DialogoDeConfirmacao>
      )}
    </div>
  );
}

function ResumoDaOferta({ oferta }: { oferta: Oferta }) {
  return (
    <section className={estilos.cartao} aria-label="Oferta">
      <div className={negociacaoEstilos.linha}>
        {oferta.produtoFoto && (
          <img className={negociacaoEstilos.miniatura} src={oferta.produtoFoto} alt={oferta.produtoNome || "Produto"} />
        )}
        <div>
          <span className={estilos.rotulo}>Valor atual</span>
          <p className={negociacaoEstilos.valorGrande}>{fmtPrecoExato(oferta.preco)}</p>
        </div>
      </div>
      {oferta.produtoNome && <h2>{oferta.produtoNome}</h2>}
      <p className={estilos.descricao}>{oferta.descricao}</p>
      <p className={estilos.detalhes}>
        <span>{rotuloDaConservacao(oferta.estadoDeConservacao)}</span>
        <span>Enviada em {fmtDataHora(oferta.criadaEm)}</span>
      </p>
    </section>
  );
}

interface FormularioDeContrapropostaProps {
  oferta: Oferta;
  papel: Papel;
  /** Respondendo a uma contraproposta aberta com outro valor. */
  substituindo: boolean;
  aoCancelar: () => void;
  aoConcluir: (mensagem: string) => Promise<void>;
}

/** Novo valor com justificativa opcional (QRO-12) ou resposta com outro valor (QRO-13). */
function FormularioDeContraproposta({ oferta, papel, substituindo, aoCancelar, aoConcluir }: FormularioDeContrapropostaProps) {
  const [valor, setValor] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [erroDoValor, setErroDoValor] = useState<string>();
  const [erroGeral, setErroGeral] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    const preco = lerValorEmReais(valor);
    setErroGeral(undefined);
    if (preco === null) return setErroDoValor("Informe o novo valor.");
    if (Number.isNaN(preco) || preco <= 0) return setErroDoValor("Informe um valor em reais maior que zero.");
    if (papel === "comprador" && !substituindo && preco >= oferta.preco) {
      return setErroDoValor(
        `Esse valor não é uma barganha: é igual ou maior que os ${fmtPrecoExato(oferta.preco)} da oferta. Se ele serve, aceite a oferta.`,
      );
    }
    setErroDoValor(undefined);
    setEnviando(true);
    try {
      if (substituindo) {
        await responderContraproposta(oferta.id, { acao: "contrapropor", preco, texto: justificativa });
      } else {
        await enviarContraproposta(oferta.id, { preco, texto: justificativa });
      }
      await aoConcluir(`Contraproposta de ${fmtPrecoExato(preco)} enviada. A outra parte foi avisada.`);
    } catch (erro) {
      const { campos } = errosDeValidacao(erro);
      if (campos.preco) setErroDoValor(campos.preco);
      else setErroGeral(mensagemDoErro(erro, "Não foi possível enviar a contraproposta."));
      setEnviando(false);
    }
  };

  return (
    <form className={negociacaoEstilos.secao} noValidate onSubmit={enviar} aria-label="Nova contraproposta">
      {erroGeral && <Aviso tom="erro">{erroGeral}</Aviso>}
      <Campo
        rotulo="Novo valor (R$)"
        inputMode="decimal"
        placeholder="0,00"
        value={valor}
        onChange={(evento) => setValor(evento.target.value)}
        erro={erroDoValor}
        obrigatorio
      />
      <Campo
        como="textarea"
        rotulo="Justificativa (opcional)"
        dica="Aparece para a outra parte junto do valor."
        linhas={3}
        maxLength={5000}
        value={justificativa}
        onChange={(evento) => setJustificativa(evento.target.value)}
      />
      <div className={negociacaoEstilos.acoes}>
        <Botao type="submit" carregando={enviando}>
          Enviar contraproposta
        </Botao>
        <Botao variante="texto" onClick={aoCancelar}>
          Cancelar
        </Botao>
      </div>
    </form>
  );
}
