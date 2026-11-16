import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { ErroDeApi, errosDeValidacao } from "@/api/cliente";
import { avaliarNegociacao, COMENTARIO_MAXIMO } from "@/api/negociacoes";
import { Botao, Campo } from "@/componentes/base";
import { Aviso, Carregando, ErroAoCarregar, EstadoVazio } from "@/componentes/estado";
import negociacaoEstilos from "@/componentes/negociacao/Negociacao.module.css";
import { useNegociacaoDaOferta } from "@/hooks/useNegociacao";
import { fmtPrecoExato } from "@/utils/formato";
import estilos from "@/paginas/OfertarProduto/Ofertar.module.css";

const NOTAS = [
  { nota: 1, rotulo: "Péssima" },
  { nota: 2, rotulo: "Ruim" },
  { nota: 3, rotulo: "Regular" },
  { nota: 4, rotulo: "Boa" },
  { nota: 5, rotulo: "Ótima" },
];

/**
 * Avaliação da contraparte (QRO-18): nota de 1 a 5 e comentário opcional,
 * uma vez por negociação concluída. A avaliação fica oculta até as duas
 * partes avaliarem ou o prazo acabar, e não pode ser editada depois.
 */
export default function Avaliar() {
  const { id = "" } = useParams();
  const clienteDeConsulta = useQueryClient();
  const { carregando, erro, naoEncontrada, negociacao, recarregar } = useNegociacaoDaOferta(id);
  const [nota, setNota] = useState<number>();
  const [comentario, setComentario] = useState("");
  const [erroDaNota, setErroDaNota] = useState<string>();
  const [erroGeral, setErroGeral] = useState<string>();

  const avaliar = useMutation({
    mutationFn: ({ negociacaoId, valor }: { negociacaoId: string; valor: number }) =>
      avaliarNegociacao(negociacaoId, valor, comentario),
    onSuccess: () => clienteDeConsulta.invalidateQueries({ queryKey: ["historico"] }),
    onError: (falha) => {
      const { campos, geral } = errosDeValidacao(falha);
      if (campos.nota) setErroDaNota(campos.nota);
      setErroGeral(geral ?? campos.comentario ?? (falha instanceof ErroDeApi ? falha.message : "Não foi possível avaliar."));
    },
  });

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    if (!negociacao) return;
    if (!nota) return setErroDaNota("Escolha uma nota de 1 a 5.");
    setErroDaNota(undefined);
    setErroGeral(undefined);
    avaliar.mutate({ negociacaoId: negociacao.id, valor: nota });
  };

  return (
    <div className={estilos.pagina}>
      <Link to="/historico" className={estilos.voltar}>
        ← Histórico
      </Link>
      <h1 className={estilos.titulo}>Avaliar negociação</h1>

      {carregando && <Carregando rotulo="Carregando negociação…" />}
      {!carregando && erro && <ErroAoCarregar erro={erro} aoTentarDeNovo={() => recarregar()} />}
      {naoEncontrada && (
        <EstadoVazio
          icone="⭐"
          titulo="Nada para avaliar aqui"
          descricao="A avaliação abre quando a negociação é concluída. Suas negociações encerradas ficam no histórico."
          acao={{ rotulo: "Ver histórico", para: "/historico" }}
        />
      )}

      {negociacao && (
        <section className={estilos.cartao} aria-label="Negociação">
          <span className={estilos.rotulo}>{negociacao.anuncio.titulo}</span>
          <h2>{negociacao.contraparte.nome}</h2>
          <p className={estilos.detalhes}>
            <span className={estilos.preco}>{fmtPrecoExato(negociacao.valorFinal)}</span>
            <span>{negociacao.papel === "comprador" ? "Você comprou" : "Você vendeu"}</span>
          </p>
        </section>
      )}

      {negociacao && (avaliar.isSuccess || negociacao.avaliacao.enviada) && (
        <Aviso tom="sucesso" titulo={avaliar.isSuccess ? "Avaliação enviada" : "Você já avaliou esta negociação"}>
          Ela fica oculta até {negociacao.contraparte.nome} avaliar também ou o prazo acabar; então as duas são
          publicadas ao mesmo tempo. Avaliações não podem ser editadas.
        </Aviso>
      )}

      {negociacao && !negociacao.avaliacao.disponivel && !negociacao.avaliacao.enviada && !avaliar.isSuccess && (
        <Aviso tom="erro" titulo="Avaliação indisponível">
          Só é possível avaliar depois que a negociação é concluída.
        </Aviso>
      )}

      {negociacao && negociacao.avaliacao.disponivel && !avaliar.isSuccess && (
        <form className={estilos.cartao} noValidate onSubmit={enviar} aria-label="Avaliação">
          {erroGeral && <Aviso tom="erro">{erroGeral}</Aviso>}
          <fieldset className={negociacaoEstilos.estrelas} aria-describedby={erroDaNota ? "erro-da-nota" : undefined}>
            <legend>Como foi negociar com {negociacao.contraparte.nome}?</legend>
            {NOTAS.map((item) => (
              <label key={item.nota} className={negociacaoEstilos.estrela}>
                <input
                  type="radio"
                  name="nota"
                  value={item.nota}
                  checked={nota === item.nota}
                  onChange={() => setNota(item.nota)}
                />
                <span aria-hidden="true">{"★".repeat(item.nota)}</span>
                {item.nota} – {item.rotulo}
              </label>
            ))}
          </fieldset>
          {erroDaNota && (
            <p id="erro-da-nota" role="alert" className={negociacaoEstilos.meta}>
              <span aria-hidden="true">⚠ </span>
              {erroDaNota}
            </p>
          )}
          <Campo
            como="textarea"
            rotulo="Comentário (opcional)"
            dica="Fica público junto da nota. Não é possível editar depois de enviar."
            linhas={4}
            maxLength={COMENTARIO_MAXIMO}
            value={comentario}
            onChange={(evento) => setComentario(evento.target.value)}
          />
          <div className={estilos.acoes}>
            <Botao type="submit" carregando={avaliar.isPending}>
              Enviar avaliação
            </Botao>
          </div>
        </form>
      )}
    </div>
  );
}
