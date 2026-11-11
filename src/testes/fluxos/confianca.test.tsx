import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usuarioDoPerfil } from "@/api/autenticacao";
import { destinoDaNotificacao, type Notificacao } from "@/api/notificacoes";
import { perfilDeTeste, simularApi } from "../apiFalsa";
import { renderizarAplicacao } from "../utilitarios";

const eu = usuarioDoPerfil(perfilDeTeste);

const negociacao = (dados: Record<string, unknown> = {}) => ({
  id: "n1",
  oferta_id: "o1",
  anuncio: { id: "a1", titulo: "Bicicleta aro 29", categoria: "esportes" },
  papel: "vendedor",
  contraparte: { id: "c1", nome: "Marina" },
  status: "em_andamento",
  valor_final: "1950.00",
  conclusao_solicitada_em: null,
  prazo_confirmacao_em: null,
  confirmada_em: null,
  concluida_em: null,
  cancelada_em: null,
  conclusao_automatica: false,
  avaliacao: { disponivel: false, enviada: false },
  criada_em: "2026-10-22T12:00:00Z",
  ...dados,
});

/** A negociação é achada pela notificação que liga oferta e negociação. */
const localizacao = {
  "GET /historico": () => ({ corpo: { next: null, results: [] } }),
  "GET /notificacoes": () => ({
    corpo: { next: null, results: [{ id: "x", oferta: "o1", negociacao: "n1" }] },
  }),
};

describe("conclusão da venda", () => {
  it("o vendedor marca a conclusão depois de confirmar", async () => {
    let atual = negociacao();
    const chamadas = simularApi({
      ...localizacao,
      "GET /negociacoes/n1": () => ({ corpo: atual }),
      "POST /negociacoes/n1/conclusao": () => {
        atual = negociacao({
          conclusao_solicitada_em: "2026-10-23T10:00:00Z",
          prazo_confirmacao_em: "2026-10-26T10:00:00Z",
        });
        return { corpo: atual };
      },
    });
    renderizarAplicacao({ rota: "/negociacoes/o1/concluir", usuario: eu });

    await userEvent.click(await screen.findByRole("button", { name: "Marcar venda como concluída" }));
    expect(chamadas.some((chamada) => chamada.metodo === "POST")).toBe(false);
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Marcar como concluída" }));

    expect(await screen.findByText("Conclusão marcada. Aguardando a confirmação do comprador.")).toBeInTheDocument();
    expect(await screen.findByText(/Marcou a venda como concluída em 23\/10\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/Pode confirmar ou negar até 26\/10\/2026/)).toBeInTheDocument();
  });

  it("o comprador confirma ou nega a conclusão pedida", async () => {
    simularApi({
      ...localizacao,
      "GET /negociacoes/n1": () => ({
        corpo: negociacao({ papel: "comprador", conclusao_solicitada_em: "2026-10-23T10:00:00Z", prazo_confirmacao_em: "2026-10-26T10:00:00Z" }),
      }),
      "POST /negociacoes/n1/conclusao/recusa": () => ({ corpo: negociacao({ papel: "comprador" }) }),
    });
    renderizarAplicacao({ rota: "/negociacoes/o1/concluir", usuario: eu });

    expect(await screen.findByRole("button", { name: "Confirmar conclusão" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Negar conclusão" }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Negar conclusão" }));
    expect(await screen.findByText("Conclusão negada. A negociação segue em andamento.")).toBeInTheDocument();
  });

  it("mostra a mensagem da API quando o cancelamento é recusado", async () => {
    simularApi({
      ...localizacao,
      "GET /negociacoes/n1": () => ({ corpo: negociacao() }),
      "POST /negociacoes/n1/cancelar": () => ({ status: 400, corpo: ["O anúncio não está em negociação."] }),
    });
    renderizarAplicacao({ rota: "/negociacoes/o1/concluir", usuario: eu });

    await userEvent.click(await screen.findByRole("button", { name: "Cancelar negociação" }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar negociação" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("O anúncio não está em negociação.");
  });

  it("uma venda concluída mostra as confirmações e não oferece reabrir", async () => {
    simularApi({
      "GET /historico": () => ({ corpo: { next: null, results: [negociacao({ status: "concluida" })] } }),
      "GET /negociacoes/n1": () => ({
        corpo: negociacao({
          status: "concluida",
          concluida_em: "2026-10-25T10:00:00Z",
          conclusao_automatica: true,
          avaliacao: { disponivel: true, enviada: false },
        }),
      }),
    });
    renderizarAplicacao({ rota: "/negociacoes/o1/concluir", usuario: eu });

    expect(await screen.findByText("Venda concluída")).toBeInTheDocument();
    expect(screen.getByText(/confirmada automaticamente/)).toBeInTheDocument();
    expect(screen.getByText(/não pode ser reaberta/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cancelar negociação|Marcar venda/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Avaliar Marina" })).toHaveAttribute("href", "/negociacoes/o1/avaliar");
  });
});

describe("avaliação", () => {
  const concluida = negociacao({ status: "concluida", avaliacao: { disponivel: true, enviada: false } });

  it("exige a nota e envia nota e comentário", async () => {
    const chamadas = simularApi({
      "GET /historico": () => ({ corpo: { next: null, results: [concluida] } }),
      "GET /negociacoes/n1": () => ({ corpo: concluida }),
      "POST /negociacoes/n1/avaliacoes": () => ({ status: 201, corpo: {} }),
    });
    renderizarAplicacao({ rota: "/negociacoes/o1/avaliar", usuario: eu });

    await userEvent.click(await screen.findByRole("button", { name: "Enviar avaliação" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Escolha uma nota de 1 a 5.");

    await userEvent.click(screen.getByRole("radio", { name: /4 – Boa/ }));
    await userEvent.type(screen.getByLabelText(/Comentário/), "Entrega rápida.");
    await userEvent.click(screen.getByRole("button", { name: "Enviar avaliação" }));

    expect(await screen.findByText("Avaliação enviada")).toBeInTheDocument();
    expect(screen.getByText(/oculta até Marina avaliar também/)).toBeInTheDocument();
    expect(chamadas.find((chamada) => chamada.metodo === "POST")?.corpo).toEqual({ nota: 4, comentario: "Entrega rápida." });
  });

  it("não reabre o formulário de quem já avaliou", async () => {
    const avaliada = negociacao({ status: "concluida", avaliacao: { disponivel: false, enviada: true } });
    simularApi({
      "GET /historico": () => ({ corpo: { next: null, results: [avaliada] } }),
      "GET /negociacoes/n1": () => ({ corpo: avaliada }),
    });
    renderizarAplicacao({ rota: "/negociacoes/o1/avaliar", usuario: eu });

    expect(await screen.findByText("Você já avaliou esta negociação")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enviar avaliação" })).not.toBeInTheDocument();
  });
});

describe("notificações", () => {
  const notificacao = (dados: Record<string, unknown> = {}) => ({
    id: "nt1",
    tipo: "contraproposta_recebida",
    titulo: "Nova contraproposta",
    mensagem: "Você recebeu uma contraproposta.",
    anuncio: "a1",
    oferta: "o1",
    negociacao: null,
    contexto: {},
    criada_em: "2026-10-22T12:00:00Z",
    lida_em: null,
    ...dados,
  });

  it("leva cada tipo ao lugar certo", () => {
    const ler = (dados: Record<string, unknown>) =>
      destinoDaNotificacao({
        id: "x",
        tipo: "",
        titulo: "",
        mensagem: "",
        anuncioId: "a1",
        ofertaId: "o1",
        negociacaoId: "n1",
        criadaEm: "",
        lidaEm: null,
        ...dados,
      } as Notificacao);
    expect(ler({ tipo: "oferta_recebida" })).toBe("/anuncios/a1/ofertas");
    expect(ler({ tipo: "mensagem_recebida" })).toBe("/negociacoes/o1");
    expect(ler({ tipo: "negociacao_concluida" })).toBe("/negociacoes/o1/avaliar");
    expect(ler({ tipo: "avaliacao_recebida" })).toBe("/historico/n1");
    expect(ler({ tipo: "anuncio_compativel", ofertaId: null })).toBe("/anuncios/a1");
  });

  it("lista o histórico, destaca as não lidas e marca como lida ao abrir", async () => {
    const chamadas = simularApi({
      "GET /notificacoes": () => ({
        corpo: {
          next: null,
          results: [notificacao(), notificacao({ id: "nt2", titulo: "Oferta aceita", lida_em: "2026-10-21T00:00:00Z" })],
        },
      }),
      "PATCH /notificacoes/nt1/lida": () => ({ corpo: notificacao({ lida_em: "2026-10-23T00:00:00Z" }) }),
      "GET /ofertas/o1": () => ({ status: 404, corpo: { detail: "Não encontrado." } }),
      "GET /conversas": () => ({ corpo: { next: null, results: [] } }),
    });
    const { roteador } = renderizarAplicacao({ rota: "/notificacoes", usuario: eu });

    const nova = within((await screen.findByRole("heading", { name: "Nova contraproposta" })).closest("li")!);
    expect(nova.getByText("Não lida")).toBeInTheDocument();
    expect(within(screen.getByRole("heading", { name: "Oferta aceita" }).closest("li")!).queryByText("Não lida")).not.toBeInTheDocument();
    expect(screen.getByText("1 não lida")).toBeInTheDocument();

    await userEvent.click(nova.getByRole("button", { name: "Abrir" }));
    await waitFor(() => expect(roteador.state.location.pathname).toBe("/negociacoes/o1"));
    expect(chamadas.some((chamada) => chamada.metodo === "PATCH" && chamada.caminho === "/notificacoes/nt1/lida")).toBe(true);
  });

  it("salva preferências sem permitir desligar os avisos de segurança", async () => {
    const preferencias = [
      { tipo: "mensagem_recebida", canal: "aplicativo", habilitada: true },
      { tipo: "mensagem_recebida", canal: "email", habilitada: true },
      { tipo: "seguranca_conta", canal: "aplicativo", habilitada: true },
      { tipo: "seguranca_conta", canal: "email", habilitada: true },
    ];
    const chamadas = simularApi({
      "GET /preferencias/notificacoes": () => ({ corpo: { preferencias } }),
      "PATCH /preferencias/notificacoes": (corpo) => ({ corpo }),
    });
    renderizarAplicacao({ rota: "/notificacoes?aba=preferencias", usuario: eu });

    const seguranca = await screen.findByRole("checkbox", { name: "Segurança da conta por e-mail" });
    expect(seguranca).toBeChecked();
    expect(seguranca).toBeDisabled();

    await userEvent.click(screen.getByRole("checkbox", { name: "Mensagem recebida por e-mail" }));
    await userEvent.click(screen.getByRole("button", { name: "Salvar preferências" }));

    expect(await screen.findByText("Preferências salvas.")).toBeInTheDocument();
    expect(chamadas.find((chamada) => chamada.metodo === "PATCH")?.corpo).toEqual({
      preferencias: [
        { tipo: "mensagem_recebida", canal: "aplicativo", habilitada: true },
        { tipo: "mensagem_recebida", canal: "email", habilitada: false },
      ],
    });
  });

  it("mostra no sino a contagem de não lidas da API", async () => {
    simularApi({
      "GET /notificacoes/nao-lidas": () => ({ corpo: { nao_lidas: 3 } }),
      "GET /notificacoes": () => ({ corpo: { next: null, results: [] } }),
    });
    renderizarAplicacao({ rota: "/notificacoes", usuario: eu });

    expect(await screen.findByRole("link", { name: "Notificações, 3 não lidas" })).toBeInTheDocument();
  });
});

describe("histórico", () => {
  it("mostra resumo, cartões com valor com sinal e uma trilha única de filtros", async () => {
    const chamadas = simularApi({
      "GET /historico": (_corpo, chamada) => {
        const todas = [
          negociacao({ status: "concluida", concluida_em: "2026-10-25T10:00:00Z", contraparte: { id: "c1", nome: "Marina Prado" } }),
          negociacao({
            id: "n2",
            papel: "comprador",
            status: "concluida",
            valor_final: "13500.00",
            anuncio: { id: "a2", titulo: "MacBook Pro 14", categoria: "informatica" },
            contraparte: { id: "c2", nome: "Lucas Tavares" },
            concluida_em: "2026-08-15T10:00:00Z",
          }),
          negociacao({
            id: "n3",
            status: "cancelada",
            valor_final: "800.00",
            anuncio: { id: "a3", titulo: "Patins", categoria: "esportes" },
            cancelada_em: "2026-10-01T10:00:00Z",
          }),
        ];
        const { papel, status } = chamada.parametros;
        const filtradas = todas.filter(
          (item) => (!papel || item.papel === papel) && (!status || item.status === status),
        );
        return { corpo: { next: null, results: filtradas } };
      },
    });
    const { roteador } = renderizarAplicacao({ rota: "/historico", usuario: eu });

    const venda = within((await screen.findByRole("heading", { name: "Bicicleta aro 29" })).closest("li")!);
    expect(venda.getByText("Vendido para Marina P. · 25/10/2026")).toBeInTheDocument();
    expect(venda.getByText("R$ 1.950", { exact: false })).toHaveTextContent("+R$ 1.950");
    expect(venda.getByText("Concluído")).toBeInTheDocument();

    const compra = within(screen.getByRole("heading", { name: "MacBook Pro 14" }).closest("li")!);
    expect(compra.getByText("Comprado de Lucas T. · 15/08/2026")).toBeInTheDocument();
    expect(compra.getByText("R$ 13.500", { exact: false })).toHaveTextContent("-R$ 13.500");
    expect(compra.getByRole("link", { name: "MacBook Pro 14" })).toHaveAttribute("href", "/historico/n2");

    const resumo = within(screen.getByRole("region", { name: "Resumo" }));
    expect(resumo.getByText("Negociações concluídas").previousSibling).toHaveTextContent("2");
    expect(resumo.getByText("Volume negociado").previousSibling).toHaveTextContent("R$ 15.450");
    expect(resumo.getByText("Total de negociações").previousSibling).toHaveTextContent("3");

    const filtros = within(screen.getByRole("group", { name: "Filtrar histórico" }));
    expect(filtros.getAllByRole("button").map((botao) => botao.textContent)).toEqual([
      "Todos",
      "🛒 Compras",
      "🏷️ Vendas",
      "❌ Encerradas",
    ]);

    await userEvent.click(filtros.getByRole("button", { name: "Compras" }));
    await waitFor(() => expect(chamadas.at(-1)?.parametros).toEqual({ papel: "comprador" }));
    expect(roteador.state.location.search).toBe("?filtro=compras");
    await waitFor(() =>
      expect(
        within(screen.getByRole("region", { name: "Resumo" })).getByText("Total de negociações").previousSibling,
      ).toHaveTextContent("1"),
    );
    expect(screen.getByRole("region", { name: "Resumo" })).toHaveTextContent("R$ 13.500");

    await userEvent.click(filtros.getByRole("button", { name: "Encerradas" }));
    await waitFor(() => expect(chamadas.at(-1)?.parametros).toEqual({ status: "cancelada" }));
    expect(await screen.findByText("Cancelado")).toBeInTheDocument();
  });

  it("usa os totais da API quando ela envia o resumo", async () => {
    simularApi({
      "GET /historico": () => ({
        corpo: {
          next: "http://api.teste/api/v1/historico?cursor=c2",
          results: [negociacao({ status: "concluida", concluida_em: "2026-10-25T10:00:00Z" })],
          resumo: { concluidas: 40, volume: "98000.00", total: 52 },
        },
      }),
    });
    renderizarAplicacao({ rota: "/historico", usuario: eu });

    const resumo = within(await screen.findByRole("region", { name: "Resumo" }));
    expect(resumo.getByText("R$ 98.000")).toBeInTheDocument();
    expect(resumo.getByText("52")).toBeInTheDocument();
    expect(screen.queryByText("Totais das negociações carregadas até aqui.")).not.toBeInTheDocument();
  });

  it("explica como começar quando não há negociações", async () => {
    simularApi({ "GET /historico": () => ({ corpo: { next: null, results: [] } }) });
    renderizarAplicacao({ rota: "/historico", usuario: eu });

    expect(await screen.findByText("Você ainda não tem negociações encerradas")).toBeInTheDocument();
  });

  it("abre os valores propostos e as mensagens, só para leitura", async () => {
    simularApi({
      "GET /historico/n1": () => ({
        corpo: {
          ...negociacao({ status: "cancelada", cancelada_em: "2026-10-24T10:00:00Z" }),
          preco_inicial: "2100.00",
          precos: [
            { preco: "2100.00", tipo_evento: "enviada", rodada: 0, registrado_em: "2026-10-21T12:00:00Z" },
            { preco: "1950.00", tipo_evento: "contraproposta", rodada: 1, registrado_em: "2026-10-22T12:00:00Z" },
          ],
          mensagens: [
            { id: 1, autor_id: "c1", autor_nome: "Marina", minha: false, texto: "Ainda tem?", registrado_em: "2026-10-22T13:00:00Z", lida_em: null },
          ],
        },
      }),
    });
    renderizarAplicacao({ rota: "/historico/n1", usuario: eu });

    const valores = within(await screen.findByRole("region", { name: "Valores propostos" }));
    expect(valores.getByText("Oferta enviada")).toBeInTheDocument();
    expect(valores.getByText("R$ 1.950")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Mensagens" })).getByText("Ainda tem?")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
