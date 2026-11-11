import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  alterarStatusDoProduto,
  criarProduto,
  editarProduto,
  enviarFotos,
  excluirProduto,
  listarProdutos,
  podeEditarProduto,
  podeExcluirProduto,
  transicoesDoProduto,
  type Produto,
  type StatusDoProduto,
} from "@/api/catalogo";
import { ErroDeApi, errosDeValidacao } from "@/api/cliente";
import { rotuloDaConservacao } from "@/api/ofertas";
import { Badge, Botao, Chip, DialogoDeConfirmacao } from "@/componentes/base";
import { FormularioDeProduto } from "@/componentes/catalogo/FormularioDeProduto";
import { FotosDoProduto, mensagemDasFotos } from "@/componentes/catalogo/FotosDoProduto";
import { ROTULO_DO_PRODUTO, TOM_DO_PRODUTO } from "@/componentes/catalogo/status";
import { Aviso, Carregando, ErroAoCarregar, EstadoVazio } from "@/componentes/estado";
import negociacaoEstilos from "@/componentes/negociacao/Negociacao.module.css";
import { fmtPrecoExato } from "@/utils/formato";
import estilos from "@/paginas/MeusAnuncios/MeusAnuncios.module.css";

const ACAO_DE_STATUS: Record<StatusDoProduto, string> = {
  disponivel: "Marcar como disponível",
  reservado: "Marcar como reservado",
  vendido: "Marcar como vendido",
};

const FILTROS: { valor: StatusDoProduto | undefined; rotulo: string }[] = [
  { valor: undefined, rotulo: "Todos" },
  { valor: "disponivel", rotulo: "Disponíveis" },
  { valor: "reservado", rotulo: "Reservados" },
  { valor: "vendido", rotulo: "Vendidos" },
];

type Confirmacao = { tipo: "excluir"; produto: Produto } | { tipo: "vender"; produto: Produto };
type Resultado = { tom: "sucesso" | "erro"; texto: string };

const mensagemDoErro = (erro: unknown, padrao: string) => {
  const { geral } = errosDeValidacao(erro);
  return geral ?? (erro instanceof ErroDeApi ? erro.message : padrao);
};

/**
 * Minha loja — catálogo de produtos do vendedor (QRO-08). Cada produto mostra
 * o status que a API devolve; só os disponíveis podem entrar numa oferta.
 * Um produto em negociação muda de status junto com ela.
 */
export default function MinhaLoja() {
  const clienteDeConsulta = useQueryClient();
  const [filtro, setFiltro] = useState<StatusDoProduto>();
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<string>();
  const [confirmacao, setConfirmacao] = useState<Confirmacao>();
  const [resultado, setResultado] = useState<Resultado>();

  const produtos = useInfiniteQuery({
    queryKey: ["produtos", filtro ?? "todos"],
    queryFn: ({ pageParam }) => listarProdutos({ status: filtro, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (pagina) => pagina.proximo,
  });

  const atualizar = () => clienteDeConsulta.invalidateQueries({ queryKey: ["produtos"] });

  const mudarStatus = useMutation({
    mutationFn: ({ produto, status }: { produto: Produto; status: StatusDoProduto }) =>
      alterarStatusDoProduto(produto.id, status),
    onSuccess: (produto) =>
      setResultado({ tom: "sucesso", texto: `${produto.nome} agora está ${ROTULO_DO_PRODUTO[produto.status].toLowerCase()}.` }),
    onError: (erro) => setResultado({ tom: "erro", texto: mensagemDoErro(erro, "Não foi possível mudar o status.") }),
    onSettled: () => {
      setConfirmacao(undefined);
      return atualizar();
    },
  });

  const excluir = useMutation({
    mutationFn: (produto: Produto) => excluirProduto(produto.id),
    onSuccess: () => setResultado({ tom: "sucesso", texto: "Produto excluído. Ofertas já enviadas mantêm os dados do envio." }),
    onError: (erro) => setResultado({ tom: "erro", texto: mensagemDoErro(erro, "Não foi possível excluir.") }),
    onSettled: () => {
      setConfirmacao(undefined);
      return atualizar();
    },
  });

  const lista = produtos.data?.pages.flatMap((pagina) => pagina.itens) ?? [];

  return (
    <div className={estilos.pagina}>
      <div className={estilos.topo}>
        <div>
          <h1>Minha loja</h1>
          <span className={estilos.resumo}>Os produtos disponíveis preenchem suas ofertas com um clique.</span>
        </div>
        {!criando && (
          <Botao
            onClick={() => {
              setCriando(true);
              setResultado(undefined);
            }}
          >
            Novo produto
          </Botao>
        )}
      </div>

      {resultado && <Aviso tom={resultado.tom}>{resultado.texto}</Aviso>}

      {criando && (
        <section className={negociacaoEstilos.secao} aria-label="Novo produto">
          <h2>Novo produto</h2>
          <FormularioDeProduto
            rotuloDoEnvio="Cadastrar produto"
            comFotos
            aoCancelar={() => setCriando(false)}
            aoEnviar={async (dados, categoriaNome, fotos) => {
              const produto = await criarProduto(dados, categoriaNome);
              let aviso: Resultado = { tom: "sucesso", texto: `${produto.nome} entrou no seu catálogo.` };
              if (fotos.length) {
                try {
                  await enviarFotos(produto.id, fotos);
                } catch (erro) {
                  // O produto já existe: reenviar o formulário o duplicaria.
                  aviso = {
                    tom: "erro",
                    texto: `${produto.nome} foi cadastrado, mas as fotos não foram enviadas: ${mensagemDasFotos(erro)} Tente de novo em “Editar”.`,
                  };
                }
              }
              await atualizar();
              setCriando(false);
              setResultado(aviso);
            }}
          />
        </section>
      )}

      <div className={estilos.acoes} role="group" aria-label="Filtrar por status">
        {FILTROS.map((item) => (
          <Chip key={item.rotulo} ativo={filtro === item.valor} onClick={() => setFiltro(item.valor)}>
            {item.rotulo}
          </Chip>
        ))}
      </div>

      {produtos.isPending && <Carregando rotulo="Carregando seus produtos…" />}
      {produtos.isError && <ErroAoCarregar erro={produtos.error} aoTentarDeNovo={() => produtos.refetch()} />}

      {produtos.isSuccess && lista.length === 0 && (
        <EstadoVazio
          icone="🏷️"
          titulo={filtro ? "Nenhum produto com este status" : "Seu catálogo está vazio"}
          descricao={
            filtro
              ? "Troque o filtro para ver os outros produtos."
              : "Cadastre os produtos que você vende para responder aos anúncios de procura-se sem digitar tudo de novo."
          }
          acao={filtro ? { rotulo: "Ver todos", aoClicar: () => setFiltro(undefined) } : { rotulo: "Novo produto", aoClicar: () => setCriando(true) }}
        />
      )}

      {lista.length > 0 && (
        <ul className={estilos.lista}>
          {lista.map((produto) => (
            <li key={produto.id} className={estilos.item}>
              {produto.fotos[0]?.url && (
                <img className={negociacaoEstilos.miniatura} src={produto.fotos[0].url} alt={`Foto de ${produto.nome}`} />
              )}
              <div className={estilos.info}>
                <div className={estilos.linhaTitulo}>
                  <h2>{produto.nome}</h2>
                  <Badge tom={TOM_DO_PRODUTO[produto.status]}>{ROTULO_DO_PRODUTO[produto.status]}</Badge>
                </div>
                <p className={estilos.detalhes}>
                  <span className={estilos.preco}>{fmtPrecoExato(produto.preco)}</span>
                  <span>{rotuloDaConservacao(produto.estadoDeConservacao)}</span>
                  <span>{produto.categoriaNome}</span>
                  <span>
                    {produto.fotos.length} {produto.fotos.length === 1 ? "foto" : "fotos"}
                  </span>
                </p>
                {produto.status !== "disponivel" && (
                  <p className={estilos.detalhes}>
                    {produto.status === "reservado"
                      ? "Reservado em uma negociação: não aparece para novas ofertas."
                      : "Vendido: não aparece para novas ofertas e não pode ser alterado."}
                  </p>
                )}
              </div>

              <div className={estilos.acoes} role="group" aria-label={`Ações de ${produto.nome}`}>
                {podeEditarProduto(produto) && (
                  <Botao
                    variante="suave"
                    tamanho="pequeno"
                    onClick={() => setEditando(editando === produto.id ? undefined : produto.id)}
                    aria-expanded={editando === produto.id}
                  >
                    {editando === produto.id ? "Fechar edição" : "Editar"}
                  </Botao>
                )}
                {transicoesDoProduto(produto.status).map((status) => (
                  <Botao
                    key={status}
                    variante="secundario"
                    tamanho="pequeno"
                    carregando={mudarStatus.isPending && mudarStatus.variables?.produto.id === produto.id && mudarStatus.variables.status === status}
                    onClick={() =>
                      status === "vendido"
                        ? setConfirmacao({ tipo: "vender", produto })
                        : mudarStatus.mutate({ produto, status })
                    }
                  >
                    {ACAO_DE_STATUS[status]}
                  </Botao>
                ))}
                {podeExcluirProduto(produto) && (
                  <Botao variante="perigo" tamanho="pequeno" onClick={() => setConfirmacao({ tipo: "excluir", produto })}>
                    Excluir
                  </Botao>
                )}
              </div>

              {editando === produto.id && (
                <div className={negociacaoEstilos.linhaInteira}>
                  <FormularioDeProduto
                    inicial={produto}
                    rotuloDoEnvio="Salvar produto"
                    aoCancelar={() => setEditando(undefined)}
                    aoEnviar={async (dados, categoriaNome) => {
                      await editarProduto(produto.id, dados, categoriaNome);
                      await atualizar();
                      setEditando(undefined);
                      setResultado({ tom: "sucesso", texto: "Produto atualizado. Ofertas já enviadas mantêm os dados do envio." });
                    }}
                  />
                  <FotosDoProduto produto={produto} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {produtos.hasNextPage && (
        <div className={estilos.carregarMais}>
          <Botao variante="secundario" carregando={produtos.isFetchingNextPage} onClick={() => produtos.fetchNextPage()}>
            Carregar mais
          </Botao>
        </div>
      )}

      {confirmacao?.tipo === "excluir" && (
        <DialogoDeConfirmacao
          titulo={`Excluir ${confirmacao.produto.nome}?`}
          descricao="O produto sai do catálogo. Ofertas já enviadas com ele mantêm os dados do momento do envio."
          rotuloDeConfirmar="Excluir produto"
          ocupado={excluir.isPending}
          aoCancelar={() => setConfirmacao(undefined)}
          aoConfirmar={() => excluir.mutate(confirmacao.produto)}
        />
      )}
      {confirmacao?.tipo === "vender" && (
        <DialogoDeConfirmacao
          titulo={`Marcar ${confirmacao.produto.nome} como vendido?`}
          descricao="Vendido é definitivo: o produto deixa de aparecer para ofertas e não pode mais ser alterado."
          rotuloDeConfirmar="Marcar como vendido"
          ocupado={mudarStatus.isPending}
          aoCancelar={() => setConfirmacao(undefined)}
          aoConfirmar={() => mudarStatus.mutate({ produto: confirmacao.produto, status: "vendido" })}
        />
      )}
    </div>
  );
}
