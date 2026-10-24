import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ErroDeApi, errosDeValidacao } from "@/api/cliente";
import {
  listarMinhasOfertas,
  podeAlterarOferta,
  retirarOferta,
  rotuloDaConservacao,
  type Oferta,
} from "@/api/ofertas";
import { Badge, Botao, DialogoDeConfirmacao } from "@/componentes/base";
import { Aviso, Carregando, ErroAoCarregar, EstadoVazio } from "@/componentes/estado";
import { motivoDoBloqueio, ROTULO_DA_OFERTA, TOM_DA_OFERTA } from "@/componentes/oferta/status";
import { fmtData, fmtPrice } from "@/utils/formato";
import estilos from "@/paginas/MeusAnuncios/MeusAnuncios.module.css";

/** Primeira linha da descrição, quando a oferta não veio de um produto do catálogo. */
const tituloDaOferta = (oferta: Oferta) =>
  oferta.produtoNome || oferta.descricao.split("\n")[0]?.slice(0, 80) || "Oferta";

/** Ofertas enviadas pelo vendedor e o status de cada uma (QRO-06). */
export default function MinhasOfertas() {
  const clienteDeConsulta = useQueryClient();
  const [paraRetirar, setParaRetirar] = useState<Oferta>();
  const [aviso, setAviso] = useState<{ tom: "sucesso" | "erro"; texto: string }>();

  const consulta = useInfiniteQuery({
    queryKey: ["ofertas", "minhas"],
    queryFn: ({ pageParam }) => listarMinhasOfertas(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (pagina) => pagina.proximo,
  });

  const retirar = useMutation({
    mutationFn: (oferta: Oferta) => retirarOferta(oferta.id),
    onSuccess: () => setAviso({ tom: "sucesso", texto: "Oferta retirada." }),
    onError: (erro) => {
      const { geral } = errosDeValidacao(erro);
      setAviso({ tom: "erro", texto: geral ?? (erro instanceof ErroDeApi ? erro.message : "Não foi possível retirar.") });
    },
    onSettled: () => {
      setParaRetirar(undefined);
      return clienteDeConsulta.invalidateQueries({ queryKey: ["ofertas"] });
    },
  });

  const ofertas = consulta.data?.pages.flatMap((pagina) => pagina.itens) ?? [];

  return (
    <div className={estilos.pagina}>
      <div className={estilos.topo}>
        <h1>Minhas ofertas</h1>
        <Botao para="/" variante="secundario">
          Explorar anúncios
        </Botao>
      </div>

      {aviso && <Aviso tom={aviso.tom}>{aviso.texto}</Aviso>}
      {consulta.isPending && <Carregando rotulo="Carregando suas ofertas…" />}
      {consulta.isError && <ErroAoCarregar erro={consulta.error} aoTentarDeNovo={() => consulta.refetch()} />}

      {consulta.isSuccess && ofertas.length === 0 && (
        <EstadoVazio
          icone="🏷️"
          titulo="Você ainda não enviou ofertas"
          descricao="Encontre no feed alguém procurando o que você tem e mande uma oferta."
          acao={{ rotulo: "Explorar anúncios", para: "/" }}
        />
      )}

      {ofertas.length > 0 && (
        <ul className={estilos.lista}>
          {ofertas.map((oferta) => (
            <li key={oferta.id} className={estilos.item}>
              <div className={estilos.info}>
                <div className={estilos.linhaTitulo}>
                  <h2>{tituloDaOferta(oferta)}</h2>
                  <Badge tom={TOM_DA_OFERTA[oferta.status]}>{ROTULO_DA_OFERTA[oferta.status]}</Badge>
                </div>
                <p className={estilos.detalhes}>
                  <span className={estilos.preco}>{fmtPrice(oferta.preco)}</span>
                  <span>{rotuloDaConservacao(oferta.estadoDeConservacao)}</span>
                  <span>Enviada em {fmtData(oferta.criadaEm)}</span>
                </p>
                {!podeAlterarOferta(oferta.status) && (
                  <p className={estilos.detalhes}>{motivoDoBloqueio(oferta.status)}</p>
                )}
              </div>
              <div className={estilos.acoes} role="group" aria-label={`Ações de ${tituloDaOferta(oferta)}`}>
                <Botao para={`/anuncios/${oferta.anuncioId}`} variante="secundario" tamanho="pequeno">
                  Ver anúncio
                </Botao>
                {podeAlterarOferta(oferta.status) && (
                  <>
                    <Botao para={`/anuncios/${oferta.anuncioId}/ofertar`} variante="suave" tamanho="pequeno">
                      Editar
                    </Botao>
                    <Botao variante="perigo" tamanho="pequeno" onClick={() => setParaRetirar(oferta)}>
                      Retirar
                    </Botao>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {consulta.hasNextPage && (
        <div className={estilos.carregarMais}>
          <Botao variante="secundario" carregando={consulta.isFetchingNextPage} onClick={() => consulta.fetchNextPage()}>
            Carregar mais
          </Botao>
        </div>
      )}

      {paraRetirar && (
        <DialogoDeConfirmacao
          titulo="Retirar esta oferta?"
          descricao="O comprador deixa de ver a oferta. Você pode enviar outra enquanto o anúncio estiver ativo."
          rotuloDeConfirmar="Retirar oferta"
          ocupado={retirar.isPending}
          aoCancelar={() => setParaRetirar(undefined)}
          aoConfirmar={() => retirar.mutate(paraRetirar)}
        />
      )}
    </div>
  );
}
