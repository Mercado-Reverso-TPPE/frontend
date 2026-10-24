import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router";
import { ErroDeApi, errosDeValidacao } from "@/api/cliente";
import {
  acoesPermitidas,
  alterarStatusDoAnuncio,
  listarMeusAnuncios,
  type MeuAnuncio,
} from "@/api/meusAnuncios";
import { Badge, Botao } from "@/componentes/base";
import { IPlus } from "@/componentes/icones";
import { Aviso, Carregando, ErroAoCarregar, EstadoVazio } from "@/componentes/estado";
import { fmtData, fmtPlural, fmtPrice } from "@/utils/formato";
import { ROTULO_DO_STATUS, TOM_DO_STATUS } from "./status";
import estilos from "./MeusAnuncios.module.css";

type NovoStatus = "ativo" | "pausado" | "encerrado";

function faixaDePreco(anuncio: MeuAnuncio) {
  const { precoMin, precoMax } = anuncio;
  if (precoMin !== null && precoMax !== null) return `${fmtPrice(precoMin)} a ${fmtPrice(precoMax)}`;
  if (precoMax !== null) return `Até ${fmtPrice(precoMax)}`;
  if (precoMin !== null) return `A partir de ${fmtPrice(precoMin)}`;
  return "Sem faixa de preço";
}

/** Lista "Meus anúncios" com status, ofertas e ações por estado (QRO-05). */
export default function MeusAnuncios() {
  const localizacao = useLocation();
  const clienteDeConsulta = useQueryClient();
  const avisoDeOrigem = (localizacao.state as { aviso?: string } | null)?.aviso;
  const [aviso, setAviso] = useState<{ tom: "sucesso" | "erro"; texto: string } | undefined>(
    avisoDeOrigem ? { tom: "sucesso", texto: avisoDeOrigem } : undefined,
  );
  const [paraEncerrar, setParaEncerrar] = useState<MeuAnuncio>();

  const consulta = useInfiniteQuery({
    queryKey: ["meus-anuncios", "lista"],
    queryFn: ({ pageParam }) => listarMeusAnuncios(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (pagina) => pagina.proximo,
  });

  const mudarStatus = useMutation({
    mutationFn: ({ anuncio, status }: { anuncio: MeuAnuncio; status: NovoStatus }) =>
      alterarStatusDoAnuncio(anuncio.id, status),
    onSuccess: (atualizado, { status }) => {
      const verbo = status === "pausado" ? "pausado" : status === "encerrado" ? "encerrado" : "reativado";
      setAviso({ tom: "sucesso", texto: `"${atualizado.titulo}" foi ${verbo}.` });
    },
    onError: (erro) => {
      // O estado pode ter mudado no servidor (ex.: entrou em negociação).
      const { geral } = errosDeValidacao(erro);
      setAviso({
        tom: "erro",
        texto: geral ?? (erro instanceof ErroDeApi ? erro.message : "Não foi possível mudar o status agora."),
      });
    },
    onSettled: () => {
      setParaEncerrar(undefined);
      return clienteDeConsulta.invalidateQueries({ queryKey: ["meus-anuncios"] });
    },
  });

  const anuncios = consulta.data?.pages.flatMap((pagina) => pagina.itens) ?? [];
  const ativos = anuncios.filter((anuncio) => anuncio.status === "ativo").length;

  return (
    <div className={estilos.pagina}>
      <div className={estilos.topo}>
        <div>
          <h1>Meus anúncios</h1>
          {anuncios.length > 0 && (
            <span className={estilos.resumo}>
              {fmtPlural(ativos, "ativo")} · {anuncios.length} no total
            </span>
          )}
        </div>
        <Botao para="/anunciar" icone={<IPlus size={15} />}>
          Novo anúncio
        </Botao>
      </div>

      {aviso && <Aviso tom={aviso.tom}>{aviso.texto}</Aviso>}

      {consulta.isPending && <Carregando rotulo="Carregando seus anúncios…" />}
      {consulta.isError && (
        <ErroAoCarregar erro={consulta.error} aoTentarDeNovo={() => consulta.refetch()} />
      )}

      {consulta.isSuccess && anuncios.length === 0 && (
        <EstadoVazio
          icone="📋"
          titulo="Você ainda não publicou nada"
          descricao="Conte o que você procura e quanto quer pagar. Vendedores perto de você mandam ofertas."
          acao={{ rotulo: "Criar primeiro anúncio", para: "/anunciar" }}
        />
      )}

      {anuncios.length > 0 && (
        <ul className={estilos.lista}>
          {anuncios.map((anuncio) => (
            <ItemDoAnuncio
              key={anuncio.id}
              anuncio={anuncio}
              ocupado={mudarStatus.isPending && mudarStatus.variables?.anuncio.id === anuncio.id}
              aoMudarStatus={(status) =>
                status === "encerrado" ? setParaEncerrar(anuncio) : mudarStatus.mutate({ anuncio, status })
              }
            />
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

      {paraEncerrar && (
        <ConfirmarEncerramento
          anuncio={paraEncerrar}
          encerrando={mudarStatus.isPending}
          aoCancelar={() => setParaEncerrar(undefined)}
          aoConfirmar={() => mudarStatus.mutate({ anuncio: paraEncerrar, status: "encerrado" })}
        />
      )}
    </div>
  );
}

function ItemDoAnuncio({
  anuncio,
  ocupado,
  aoMudarStatus,
}: {
  anuncio: MeuAnuncio;
  ocupado: boolean;
  aoMudarStatus: (status: NovoStatus) => void;
}) {
  const acoes = acoesPermitidas(anuncio.status);

  return (
    <li className={`${estilos.item} ${anuncio.status === "encerrado" ? estilos.encerrado : ""}`}>
      <div className={estilos.info}>
        <div className={estilos.linhaTitulo}>
          <h2>{anuncio.titulo}</h2>
          <Badge tom={TOM_DO_STATUS[anuncio.status]}>{ROTULO_DO_STATUS[anuncio.status]}</Badge>
        </div>
        <p className={estilos.detalhes}>
          <span className={estilos.preco}>{faixaDePreco(anuncio)}</span>
          <span className={estilos.ofertas}>
            <strong>{anuncio.ofertasRecebidas}</strong>{" "}
            {anuncio.ofertasRecebidas === 1 ? "oferta recebida" : "ofertas recebidas"}
          </span>
          <span>Raio de {anuncio.raioKm} km</span>
          <span>Publicado em {fmtData(anuncio.criadoEm)}</span>
        </p>
      </div>

      <div className={estilos.acoes} aria-label={`Ações de ${anuncio.titulo}`} role="group">
        {anuncio.ofertasRecebidas > 0 && (
          <Botao para={`/anuncios/${anuncio.id}/ofertas`} variante="secundario" tamanho="pequeno">
            Ver ofertas
          </Botao>
        )}
        {acoes.includes("editar") && (
          <Botao para={`/meus-anuncios/${anuncio.id}/editar`} variante="suave" tamanho="pequeno">
            Editar
          </Botao>
        )}
        {acoes.includes("pausar") && (
          <Botao variante="suave" tamanho="pequeno" carregando={ocupado} onClick={() => aoMudarStatus("pausado")}>
            Pausar
          </Botao>
        )}
        {acoes.includes("reativar") && (
          <Botao variante="suave" tamanho="pequeno" carregando={ocupado} onClick={() => aoMudarStatus("ativo")}>
            Reativar
          </Botao>
        )}
        {acoes.includes("encerrar") && (
          <Botao variante="perigo" tamanho="pequeno" disabled={ocupado} onClick={() => aoMudarStatus("encerrado")}>
            Encerrar
          </Botao>
        )}
      </div>
    </li>
  );
}

function ConfirmarEncerramento({
  anuncio,
  encerrando,
  aoCancelar,
  aoConfirmar,
}: {
  anuncio: MeuAnuncio;
  encerrando: boolean;
  aoCancelar: () => void;
  aoConfirmar: () => void;
}) {
  const dialogo = useRef<HTMLDivElement>(null);
  const fechar = useRef(aoCancelar);
  fechar.current = aoCancelar;

  // Foco no diálogo ao abrir, de volta ao gatilho ao fechar; Esc cancela.
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    dialogo.current?.focus();
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") fechar.current();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      anterior?.focus();
    };
  }, []);

  return (
    <div className={estilos.fundoDoDialogo} onClick={aoCancelar}>
      <div
        ref={dialogo}
        tabIndex={-1}
        className={estilos.dialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-encerrar"
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2 id="titulo-encerrar">Encerrar "{anuncio.titulo}"?</h2>
        <p>
          O anúncio sai do feed e para de receber ofertas. Encerrado, ele não volta a ficar ativo nem pode ser
          editado.
        </p>
        <div className={estilos.botoesDoDialogo}>
          <Botao variante="secundario" onClick={aoCancelar}>
            Cancelar
          </Botao>
          <Botao variante="perigo" carregando={encerrando} onClick={aoConfirmar}>
            Encerrar anúncio
          </Botao>
        </div>
      </div>
    </div>
  );
}
