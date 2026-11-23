import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { ROTULO_DE_CONSERVACAO, proporCompraEmProduto, type ProdutoAVenda } from "@/api/vitrine";
import { Avatar, Badge, Botao, Campo } from "@/componentes/base";
import { IEye, IPin, IStar, ITag } from "@/componentes/icones";
import { catColor } from "@/estilos/tokens";
import { fmtDistancia, fmtNota, fmtNumero, fmtPrice, fmtTempoRelativo } from "@/utils/formato";
import { lerValorEmReais } from "@/utils/valores";
import { iconeDaCategoria } from "./categorias";
import { corDaPessoa, iniciaisDe, nomeCurto } from "./pessoa";
import estilos from "./Cards.module.css";

interface CardVendendoProps {
  produto: ProdutoAVenda;
  /** @deprecated Não tem mais efeito — o card abre o modal de proposta. */
  paraOfertar?: string;
}

/**
 * Card de produto à venda (aba "Vendendo"): foto à esquerda com o estado de
 * conservação, preço em destaque e o vendedor no rodapé. Em telas pequenas a
 * foto vai para o topo.
 *
 * Ao clicar em "Ofertar" abre um modal onde o comprador informa o valor
 * proposto. Ao confirmar, a API cria anúncio + oferta e redireciona para a
 * tela de negociação (`/negociacoes/:ofertaId`).
 */
export function CardVendendo({ produto }: CardVendendoProps) {
  const corDaCategoria = catColor(produto.categoriaNome);
  const vendedor = produto.vendedor;
  const navegar = useNavigate();

  const [modalAberto, setModalAberto] = useState(false);
  const [valorTexto, setValorTexto] = useState(String(produto.preco));
  const [mensagem, setMensagem] = useState("");
  const [erroLocal, setErroLocal] = useState("");

  const proposta = useMutation({
    mutationFn: () =>
      proporCompraEmProduto(produto.id, {
        preco: lerValorEmReais(valorTexto) ?? 0,
        mensagem,
      }),
    onSuccess: (dados) => {
      setModalAberto(false);
      navegar(`/negociacoes/${dados.ofertaId}`);
    },
    onError: (erro: unknown) => {
      const msg =
        erro instanceof Error ? erro.message : "Não foi possível enviar a proposta. Tente novamente.";
      setErroLocal(msg);
    },
  });

  function abrirModal() {
    setValorTexto(String(produto.preco));
    setMensagem("");
    setErroLocal("");
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    proposta.reset();
  }

  function enviar(e: FormEvent) {
    e.preventDefault();
    setErroLocal("");
    const valor = lerValorEmReais(valorTexto);
    if (!valor || valor <= 0) {
      setErroLocal("Informe um valor válido maior que zero.");
      return;
    }
    proposta.mutate();
  }

  return (
    <>
    <article className={`${estilos.card} ${estilos.cardVenda}`}>
      <span className={estilos.faixaVertical} aria-hidden="true" />

      <div className={estilos.foto}>
        {produto.foto ? (
          <img src={produto.foto} alt={`Foto de ${produto.titulo}`} loading="lazy" />
        ) : (
          <div className={estilos.fotoVazia} role="img" aria-label={`${produto.titulo} sem foto`}>
            <span aria-hidden="true">{iconeDaCategoria(produto.categoriaNome)}</span>
          </div>
        )}
        <span className={estilos.conservacao}>
          <Badge tom="neutro">{ROTULO_DE_CONSERVACAO[produto.estadoConservacao] ?? produto.estadoConservacao}</Badge>
        </span>
      </div>

      <div className={estilos.corpoVenda}>
        <div className={estilos.topo}>
          <Badge tom="marca" icone="🏷️">
            Vendendo
          </Badge>
          <Badge cor={corDaCategoria} icone={<ITag size={10} color={corDaCategoria} />}>
            {produto.categoriaNome}
          </Badge>
          <time className={estilos.tempo} dateTime={produto.criadoEm}>
            {fmtTempoRelativo(produto.criadoEm)}
          </time>
        </div>

        <h3 className={`${estilos.titulo} truncar-2`}>{produto.titulo}</h3>
        <p className={`${estilos.descricao} truncar-2`}>{produto.descricao}</p>

        <div className={estilos.linhaPreco}>
          <span className={estilos.preco}>{fmtPrice(produto.preco)}</span>
          <div className={estilos.metricas}>
            {produto.distanciaKm !== null && (
              <span className={estilos.metrica}>
                <IPin size={11} aria-hidden="true" />
                {fmtDistancia(produto.distanciaKm)}
              </span>
            )}
            {produto.visualizacoes !== null && (
              <span className={estilos.metrica}>
                <IEye size={12} aria-hidden="true" />
                {fmtNumero(produto.visualizacoes)}
                <span className="apenas-leitor-de-tela"> visualizações</span>
              </span>
            )}
          </div>
        </div>

        <div className={estilos.rodapeVenda}>
          {vendedor && (
            <>
              <Avatar
                iniciais={iniciaisDe(vendedor.nome)}
                cor={corDaPessoa(vendedor.id)}
                foto={vendedor.foto ?? undefined}
                nome={nomeCurto(vendedor.nome)}
                tamanho={28}
              />
              <div className={estilos.pessoaDados}>
                <div className={estilos.pessoaNome}>{nomeCurto(vendedor.nome)}</div>
                {vendedor.nota !== null && (
                  <div className={estilos.reputacao}>
                    <IStar size={11} aria-hidden="true" />
                    {fmtNota(vendedor.nota)}
                  </div>
                )}
              </div>
            </>
          )}

          <Botao
            variante="suave"
            tamanho="pequeno"
            className={estilos.acao}
            onClick={abrirModal}
            aria-label={`Ofertar por ${produto.titulo}`}
          >
            Ofertar
          </Botao>
        </div>
      </div>
    </article>

    {modalAberto && (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-proposta-titulo"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.target === e.currentTarget && fecharModal()}
      >
        <div
          style={{
            background: "var(--cor-fundo, #fff)",
            borderRadius: 12,
            padding: "1.5rem",
            width: "min(90vw, 400px)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 id="modal-proposta-titulo" style={{ margin: 0, fontSize: "1.1rem" }}>
            Proposta para {produto.titulo}
          </h2>
          <p style={{ margin: 0, color: "var(--cor-texto-suave, #666)", fontSize: "0.9rem" }}>
            Preço pedido:{" "}
            <strong>{fmtPrice(produto.preco)}</strong>
          </p>

          <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <Campo
              rotulo="Seu valor proposto (R$)"
              value={valorTexto}
              onChange={(e) => setValorTexto(e.target.value)}
              placeholder={String(produto.preco)}
              type="number"
              min="0.01"
              step="0.01"
              obrigatorio
            />
            <Campo
              rotulo="Mensagem (opcional)"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Explique sua proposta ao vendedor…"
              como="textarea"
              linhas={3}
            />

            {(erroLocal || proposta.isError) && (
              <p role="alert" style={{ color: "var(--cor-erro, #c0392b)", margin: 0, fontSize: "0.875rem" }}>
                {erroLocal || "Não foi possível enviar a proposta. Tente novamente."}
              </p>
            )}

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <Botao variante="secundario" tamanho="pequeno" onClick={fecharModal} type="button">
                Cancelar
              </Botao>
              <Botao
                variante="primario"
                tamanho="pequeno"
                type="submit"
                disabled={proposta.isPending}
                carregando={proposta.isPending}
              >
                Enviar proposta
              </Botao>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
  );
}
