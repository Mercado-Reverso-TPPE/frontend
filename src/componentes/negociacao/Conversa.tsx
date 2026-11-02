import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ErroDeApi, errosDeValidacao } from "@/api/cliente";
import { enviarMensagem, listarMensagens, marcarConversaComoLida } from "@/api/negociacoes";
import { Botao, Campo } from "@/componentes/base";
import { Aviso, ErroAoCarregar } from "@/componentes/estado";
import { fmtDataHora } from "@/utils/formato";
import estilos from "./Negociacao.module.css";

const LIMITE_DA_MENSAGEM = 5000;
const INTERVALO_DE_ATUALIZACAO = 15_000;

interface ConversaProps {
  ofertaId: string;
  /** Vem da API: encerrada, a conversa só pode ser lida. */
  somenteLeitura: boolean;
}

/**
 * Chat da negociação (QRO-14). Mensagens são imutáveis: não há editar nem
 * apagar, nem aqui nem na API. Encerrada a negociação, o envio some e o
 * histórico continua disponível.
 */
export function Conversa({ ofertaId, somenteLeitura }: ConversaProps) {
  const clienteDeConsulta = useQueryClient();
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string>();
  const fim = useRef<HTMLLIElement>(null);

  const mensagens = useQuery({
    queryKey: ["mensagens", ofertaId],
    queryFn: () => listarMensagens(ofertaId),
    refetchInterval: somenteLeitura ? false : INTERVALO_DE_ATUALIZACAO,
  });

  const naoLidas = mensagens.data?.some((mensagem) => !mensagem.minha && !mensagem.lidaEm) ?? false;
  useEffect(() => {
    if (!naoLidas) return;
    marcarConversaComoLida(ofertaId)
      .then(() => clienteDeConsulta.invalidateQueries({ queryKey: ["notificacoes"] }))
      .catch(() => undefined);
  }, [naoLidas, ofertaId, clienteDeConsulta]);

  const quantidade = mensagens.data?.length ?? 0;
  useEffect(() => {
    fim.current?.scrollIntoView?.({ block: "nearest" });
  }, [quantidade]);

  const enviar = useMutation({
    mutationFn: (conteudo: string) => enviarMensagem(ofertaId, conteudo),
    onSuccess: () => {
      setTexto("");
      return clienteDeConsulta.invalidateQueries({ queryKey: ["mensagens", ofertaId] });
    },
    onError: (falha) => {
      const { campos, geral } = errosDeValidacao(falha);
      setErro(campos.texto ?? geral ?? (falha instanceof ErroDeApi ? falha.message : "Não foi possível enviar."));
      // A conversa pode ter sido encerrada enquanto a tela estava aberta.
      void clienteDeConsulta.invalidateQueries({ queryKey: ["conversa", ofertaId] });
    },
  });

  const aoEnviar = (evento: FormEvent) => {
    evento.preventDefault();
    const conteudo = texto.trim();
    if (!conteudo) return setErro("Escreva uma mensagem.");
    if (conteudo.length > LIMITE_DA_MENSAGEM) return setErro(`Use no máximo ${LIMITE_DA_MENSAGEM} caracteres.`);
    setErro(undefined);
    enviar.mutate(conteudo);
  };

  return (
    <section className={estilos.secao} aria-label="Conversa">
      <h2>Conversa</h2>
      {mensagens.isPending && <p className={estilos.meta}>Carregando mensagens…</p>}
      {mensagens.isError && <ErroAoCarregar erro={mensagens.error} aoTentarDeNovo={() => mensagens.refetch()} />}

      {mensagens.data && mensagens.data.length === 0 && (
        <p className={estilos.texto}>
          {somenteLeitura
            ? "Nenhuma mensagem foi trocada nesta negociação."
            : "Combine detalhes como estado do produto, entrega e pagamento. As mensagens não podem ser editadas nem apagadas."}
        </p>
      )}

      {mensagens.data && mensagens.data.length > 0 && (
        <ol className={estilos.mensagens} aria-label="Mensagens">
          {mensagens.data.map((mensagem) => (
            <li key={mensagem.id} className={`${estilos.mensagem} ${mensagem.minha ? estilos.mensagemMinha : ""}`}>
              <p>{mensagem.texto}</p>
              <span>
                {mensagem.minha ? "Você" : mensagem.autorNome} · {fmtDataHora(mensagem.registradaEm)}
              </span>
            </li>
          ))}
          <li ref={fim} aria-hidden="true" />
        </ol>
      )}

      {somenteLeitura ? (
        <Aviso tom="sucesso" titulo="Conversa encerrada">
          Esta negociação terminou. A conversa fica disponível somente para leitura.
        </Aviso>
      ) : (
        <form className={estilos.envio} noValidate onSubmit={aoEnviar}>
          <Campo
            como="textarea"
            rotulo="Mensagem"
            linhas={2}
            maxLength={LIMITE_DA_MENSAGEM}
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            erro={erro}
          />
          <Botao type="submit" carregando={enviar.isPending}>
            Enviar
          </Botao>
        </form>
      )}
    </section>
  );
}
