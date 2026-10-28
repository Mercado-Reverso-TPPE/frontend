import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { obterAnuncio } from "@/api/anuncios";
import { ErroDeApi, errosDeValidacao } from "@/api/cliente";
import type { Anuncio } from "@/api/meusAnuncios";
import {
  editarOferta,
  enviarOferta,
  minhaOfertaNoAnuncio,
  podeAlterarOferta,
  retirarOferta,
  rotuloDaConservacao,
  type Oferta,
} from "@/api/ofertas";
import { Badge, Botao, DialogoDeConfirmacao } from "@/componentes/base";
import { Aviso, Carregando, ErroAoCarregar } from "@/componentes/estado";
import { FormularioDeOferta } from "@/componentes/oferta/FormularioDeOferta";
import { motivoDoBloqueio, ROTULO_DA_OFERTA, TOM_DA_OFERTA } from "@/componentes/oferta/status";
import { useSessao } from "@/hooks/useSessao";
import { fmtData, fmtDistancia, fmtPrice } from "@/utils/formato";
import estilos from "./Ofertar.module.css";

function faixa(anuncio: Anuncio) {
  const { precoMin, precoMax } = anuncio;
  if (precoMin !== null && precoMax !== null) return `${fmtPrice(precoMin)} a ${fmtPrice(precoMax)}`;
  if (precoMax !== null) return `Até ${fmtPrice(precoMax)}`;
  if (precoMin !== null) return `A partir de ${fmtPrice(precoMin)}`;
  return "Sem faixa de preço";
}

/**
 * Oferta do vendedor para uma demanda (QRO-06). A tela só conhece a oferta da
 * própria pessoa: nada das ofertas concorrentes é pedido à API nem exibido.
 */
export default function OfertarProduto() {
  const { id = "" } = useParams();
  const { usuario } = useSessao();
  const clienteDeConsulta = useQueryClient();
  const [editando, setEditando] = useState(false);
  const [confirmandoRetirada, setConfirmandoRetirada] = useState(false);
  const [aviso, setAviso] = useState<{ tom: "sucesso" | "erro"; texto: string }>();

  const anuncio = useQuery({ queryKey: ["anuncio", id], queryFn: () => obterAnuncio(id) });
  const minhaOferta = useQuery({ queryKey: ["ofertas", "no-anuncio", id], queryFn: () => minhaOfertaNoAnuncio(id) });

  const atualizar = () => clienteDeConsulta.invalidateQueries({ queryKey: ["ofertas"] });

  const retirar = useMutation({
    mutationFn: (oferta: Oferta) => retirarOferta(oferta.id),
    onSuccess: () => setAviso({ tom: "sucesso", texto: "Oferta retirada. O comprador não a vê mais." }),
    onError: (erro) => {
      const { geral } = errosDeValidacao(erro);
      setAviso({ tom: "erro", texto: geral ?? (erro instanceof ErroDeApi ? erro.message : "Não foi possível retirar.") });
    },
    onSettled: () => {
      setConfirmandoRetirada(false);
      return atualizar();
    },
  });

  if (anuncio.isPending || minhaOferta.isPending) {
    return (
      <div className={estilos.pagina}>
        <Carregando rotulo="Carregando anúncio…" />
      </div>
    );
  }

  if (anuncio.isError || minhaOferta.isError) {
    return (
      <div className={estilos.pagina}>
        <ErroAoCarregar
          erro={anuncio.error ?? minhaOferta.error}
          aoTentarDeNovo={() => {
            void anuncio.refetch();
            void minhaOferta.refetch();
          }}
        />
      </div>
    );
  }

  const demanda = anuncio.data;
  const oferta = minhaOferta.data;
  const ehMeu = usuario !== null && demanda.comprador === usuario.id;

  return (
    <div className={estilos.pagina}>
      <Link to={`/anuncios/${id}`} className={estilos.voltar}>
        ← Ver anúncio
      </Link>
      <h1 className={estilos.titulo}>{oferta ? "Sua oferta" : "Fazer uma oferta"}</h1>

      <section className={estilos.cartao} aria-label="Anúncio">
        <span className={estilos.rotulo}>O comprador procura</span>
        <h2>{demanda.titulo}</h2>
        <p className={estilos.descricao}>{demanda.descricao}</p>
        <p className={estilos.detalhes}>
          <span className={estilos.preco}>{faixa(demanda)}</span>
          <span>{demanda.categoriaNome}</span>
          {demanda.cidade && <span>{[demanda.cidade, demanda.uf].filter(Boolean).join(", ")}</span>}
          {demanda.distanciaKm !== null && <span>a {fmtDistancia(demanda.distanciaKm)} de você</span>}
        </p>
      </section>

      {aviso && <Aviso tom={aviso.tom}>{aviso.texto}</Aviso>}

      {ehMeu ? (
        <Aviso tom="erro" titulo="Este anúncio é seu">
          Você não pode ofertar no próprio anúncio. As ofertas recebidas ficam em{" "}
          <Link to="/meus-anuncios">Meus anúncios</Link>.
        </Aviso>
      ) : oferta ? (
        <section className={estilos.cartao} aria-label="Sua oferta">
          <div className={estilos.linhaTitulo}>
            <span className={estilos.preco}>{fmtPrice(oferta.preco)}</span>
            <Badge tom={TOM_DA_OFERTA[oferta.status]}>{ROTULO_DA_OFERTA[oferta.status]}</Badge>
          </div>

          {editando ? (
            <FormularioDeOferta
              inicial={oferta}
              rotuloDoEnvio="Salvar oferta"
              aoCancelar={() => setEditando(false)}
              aoEnviar={async (dados) => {
                await editarOferta(oferta.id, dados);
                await atualizar();
                setEditando(false);
                setAviso({ tom: "sucesso", texto: "Oferta atualizada." });
              }}
            />
          ) : (
            <>
              <p className={estilos.detalhes}>
                <span>{rotuloDaConservacao(oferta.estadoDeConservacao)}</span>
                <span>Enviada em {fmtData(oferta.criadaEm)}</span>
              </p>
              <p className={estilos.descricao}>{oferta.descricao}</p>
              {podeAlterarOferta(oferta.status) ? (
                <div className={estilos.acoes}>
                  <Botao variante="secundario" onClick={() => setEditando(true)}>
                    Editar oferta
                  </Botao>
                  <Botao variante="perigo" onClick={() => setConfirmandoRetirada(true)}>
                    Retirar oferta
                  </Botao>
                </div>
              ) : (
                <Aviso tom="sucesso">{motivoDoBloqueio(oferta.status)}</Aviso>
              )}
            </>
          )}
        </section>
      ) : demanda.status !== "ativo" ? (
        <Aviso tom="erro" titulo="Este anúncio não está recebendo ofertas">
          O comprador pausou, encerrou ou já está negociando este anúncio.
        </Aviso>
      ) : (
        <section className={estilos.cartao} aria-label="Nova oferta">
          <FormularioDeOferta
            rotuloDoEnvio="Enviar oferta"
            aoEnviar={async (dados) => {
              await enviarOferta(id, dados);
              await atualizar();
              setAviso({
                tom: "sucesso",
                texto: "Oferta enviada. O comprador pode aceitar, recusar ou fazer uma contraproposta.",
              });
            }}
          />
          <p className={estilos.dica}>
            Só o comprador vê sua oferta. Para incluir fotos, oferte um produto da sua loja.
          </p>
        </section>
      )}

      {oferta && !ehMeu && (
        <Link to="/minhas-ofertas" className={estilos.voltar}>
          Ver todas as minhas ofertas →
        </Link>
      )}

      {confirmandoRetirada && oferta && (
        <DialogoDeConfirmacao
          titulo="Retirar esta oferta?"
          descricao="O comprador deixa de ver a oferta. Depois de retirar, você pode enviar uma nova enquanto o anúncio estiver ativo."
          rotuloDeConfirmar="Retirar oferta"
          ocupado={retirar.isPending}
          aoCancelar={() => setConfirmandoRetirada(false)}
          aoConfirmar={() => retirar.mutate(oferta)}
        />
      )}
    </div>
  );
}
