import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usuarioDoPerfil } from "@/api/autenticacao";
import { situacaoDaNegociacao, ofertaDaApi, type OfertaDaApi } from "@/api/ofertas";
import { perfilDeTeste, simularApi } from "../apiFalsa";
import { renderizarAplicacao } from "../utilitarios";

// A pessoa logada é "7f1c". Nos testes de comprador ela publicou o anúncio;
// nos de vendedor, ela é a autora da oferta.
const eu = usuarioDoPerfil(perfilDeTeste);
const OUTRA = "outra-pessoa";

const anuncio = (dados: Record<string, unknown> = {}) => ({
  id: "a1",
  comprador: "7f1c",
  titulo: "Bicicleta aro 29",
  categoria: "esportes",
  categoria_nome: "Esportes",
  descricao: "Com freio a disco.",
  preco_min: "1200.00",
  preco_max: "2500.00",
  raio_km: 25,
  status: "ativo",
  distancia_km: null,
  ofertas_recebidas: 2,
  cidade: "Brasília",
  uf: "DF",
  criado_em: "2026-10-20T15:00:00Z",
  ...dados,
});

const evento = (dados: Record<string, unknown>) => ({
  id: 1,
  autor_id: OUTRA,
  preco: "2100.00",
  status: "enviada",
  tipo_evento: "enviada",
  justificativa: "",
  texto: "",
  rodada: 0,
  expira_em: null,
  respondida_em: null,
  resultado: null,
  registrado_em: "2026-10-21T12:00:00Z",
  ...dados,
});

const oferta = (dados: Record<string, unknown> = {}) => ({
  id: "o1",
  anuncio_id: "a1",
  vendedor_id: OUTRA,
  vendedor_nome: "Carlos Souza",
  produto_id: null,
  produto_nome: "",
  produto_foto: null,
  descricao: "Caloi Elite 2023, pouco uso.",
  estado_conservacao: "seminovo",
  preco: "2100.00",
  status: "enviada",
  criada_em: "2026-10-21T12:00:00Z",
  atualizada_em: "2026-10-21T12:00:00Z",
  historico: [evento({})],
  ...dados,
});

const conversa = (dados: Record<string, unknown> = {}) => ({
  id: "o1",
  anuncio_id: "a1",
  anuncio_titulo: "Bicicleta aro 29",
  status_oferta: "enviada",
  papel: "comprador",
  contraparte: { id: OUTRA, nome: "Carlos Souza" },
  somente_leitura: false,
  mensagens_nao_lidas: 0,
  ultima_mensagem_em: null,
  ...dados,
});

const vazia = { next: null, results: [] };

describe("situação da negociação", () => {
  const ler = (dados: Record<string, unknown>) => ofertaDaApi(oferta(dados) as unknown as OfertaDaApi);

  it("só o comprador abre a primeira contraproposta", () => {
    const sem = ler({});
    expect(situacaoDaNegociacao(sem, { usuarioId: "7f1c", papel: "comprador", anuncioAtivo: true })).toMatchObject({
      podeDecidirOferta: true,
      podeContrapor: true,
      pendente: null,
    });
    expect(situacaoDaNegociacao(sem, { usuarioId: OUTRA, papel: "vendedor", anuncioAtivo: true })).toMatchObject({
      podeDecidirOferta: false,
      podeContrapor: false,
    });
  });

  it("quem recusou a contraproposta pode propor o próximo valor", () => {
    const recusada = ler({
      status: "em_negociacao",
      historico: [
        evento({ id: 1 }),
        evento({ id: 2, autor_id: "7f1c", tipo_evento: "contraproposta", rodada: 1, resultado: "recusada", respondida_em: "2026-10-22T00:00:00Z" }),
        evento({ id: 3, autor_id: OUTRA, tipo_evento: "contraposta_recusada", rodada: 1, resultado: "recusada" }),
      ],
    });
    expect(situacaoDaNegociacao(recusada, { usuarioId: OUTRA, papel: "vendedor", anuncioAtivo: true }).podeContrapor).toBe(true);
    expect(situacaoDaNegociacao(recusada, { usuarioId: "7f1c", papel: "comprador", anuncioAtivo: true }).podeContrapor).toBe(false);
  });

  it("nada fica em aberto depois do aceite", () => {
    const aceita = ler({ status: "aceita" });
    expect(situacaoDaNegociacao(aceita, { usuarioId: "7f1c", papel: "comprador", anuncioAtivo: true })).toMatchObject({
      emAberto: false,
      podeDecidirOferta: false,
      podeContrapor: false,
    });
  });
});

describe("negociação — comprador", () => {
  const rotas = (extra: Record<string, Parameters<typeof simularApi>[0][string]> = {}) => ({
    "GET /ofertas/o1": () => ({ corpo: oferta() }),
    "GET /conversas": () => ({ corpo: { next: null, results: [conversa()] } }),
    "GET /conversas/o1/mensagens": () => ({ corpo: vazia }),
    ...extra,
  });

  it("oferece aceitar, recusar e contrapropor como ações distintas", async () => {
    simularApi(rotas());
    renderizarAplicacao({ rota: "/negociacoes/o1", usuario: eu });

    const acoes = within(await screen.findByRole("group", { name: "Decidir sobre a oferta" }));
    expect(acoes.getByRole("button", { name: "Aceitar oferta" })).toBeInTheDocument();
    expect(acoes.getByRole("button", { name: "Fazer contraproposta" })).toBeInTheDocument();
    expect(acoes.getByRole("button", { name: "Recusar oferta" })).toBeInTheDocument();
    expect(screen.getByText("Vendedor:", { exact: false })).toHaveTextContent("Carlos Souza");
  });

  it("avisa que valor igual ou maior não é barganha e envia a contraproposta com justificativa", async () => {
    const chamadas = simularApi(
      rotas({
        "POST /ofertas/o1/contrapropostas": () => ({
          status: 201,
          corpo: evento({ id: 9, autor_id: "7f1c", tipo_evento: "contraproposta", rodada: 1, preco: "1800.00" }),
        }),
      }),
    );
    renderizarAplicacao({ rota: "/negociacoes/o1", usuario: eu });

    await userEvent.click(await screen.findByRole("button", { name: "Fazer contraproposta" }));
    await userEvent.type(screen.getByLabelText(/Novo valor/), "2100");
    await userEvent.click(screen.getByRole("button", { name: "Enviar contraproposta" }));
    expect(screen.getByText(/não é uma barganha/)).toBeInTheDocument();
    expect(chamadas.some((chamada) => chamada.metodo === "POST")).toBe(false);

    await userEvent.clear(screen.getByLabelText(/Novo valor/));
    await userEvent.type(screen.getByLabelText(/Novo valor/), "1800");
    await userEvent.type(screen.getByLabelText(/Justificativa/), "Tem marcas de uso.");
    await userEvent.click(screen.getByRole("button", { name: "Enviar contraproposta" }));

    expect(await screen.findByText(/Contraproposta de R\$ 1.800 enviada/)).toBeInTheDocument();
    expect(chamadas.find((chamada) => chamada.metodo === "POST")?.corpo).toEqual({
      preco: "1800.00",
      texto: "Tem marcas de uso.",
    });
  });

  it("pede confirmação antes de aceitar e mostra o resultado da API", async () => {
    const chamadas = simularApi(
      rotas({
        "POST /ofertas/o1/aceitar": () => ({
          status: 201,
          corpo: { id: "n1", oferta_id: "o1", anuncio_id: "a1", valor_final: "2100.00", status: "em_andamento" },
        }),
      }),
    );
    renderizarAplicacao({ rota: "/negociacoes/o1", usuario: eu });

    await userEvent.click(await screen.findByRole("button", { name: "Aceitar oferta" }));
    const dialogo = within(screen.getByRole("dialog"));
    expect(dialogo.getByText(/demais ofertas são recusadas automaticamente/)).toBeInTheDocument();
    expect(chamadas.some((chamada) => chamada.metodo === "POST")).toBe(false);
    await userEvent.click(dialogo.getByRole("button", { name: "Aceitar oferta" }));

    expect(await screen.findByText(/Oferta aceita por R\$ 2.100/)).toBeInTheDocument();
  });

  it("recusa com motivo opcional", async () => {
    const chamadas = simularApi(rotas({ "POST /ofertas/o1/recusar": () => ({ corpo: oferta({ status: "recusada" }) }) }));
    renderizarAplicacao({ rota: "/negociacoes/o1", usuario: eu });

    await userEvent.click(await screen.findByRole("button", { name: "Recusar oferta" }));
    const dialogo = within(screen.getByRole("dialog"));
    await userEvent.type(dialogo.getByLabelText(/Motivo/), "Achei outra.");
    await userEvent.click(dialogo.getByRole("button", { name: "Recusar oferta" }));

    expect(await screen.findByText("Oferta recusada. O vendedor foi avisado.")).toBeInTheDocument();
    expect(chamadas.find((chamada) => chamada.metodo === "POST")?.corpo).toEqual({ justificativa: "Achei outra." });
  });
});

describe("negociação — vendedor responde à contraproposta", () => {
  const pendente = evento({
    id: 2,
    autor_id: OUTRA,
    preco: "1800.00",
    status: "em_negociacao",
    tipo_evento: "contraproposta",
    texto: "Tem marcas de uso.",
    rodada: 1,
    expira_em: "2026-10-24T15:00:00Z",
    resultado: "pendente",
    registrado_em: "2026-10-22T15:00:00Z",
  });
  const minhaOferta = oferta({
    vendedor_id: "7f1c",
    status: "em_negociacao",
    historico: [evento({ id: 1, autor_id: "7f1c" }), pendente],
  });
  const rotas = (extra: Record<string, Parameters<typeof simularApi>[0][string]> = {}) => ({
    "GET /ofertas/o1": () => ({ corpo: minhaOferta }),
    "GET /conversas": () => ({
      corpo: { next: null, results: [conversa({ papel: "vendedor", contraparte: { id: OUTRA, nome: "Marina" } })] },
    }),
    "GET /conversas/o1/mensagens": () => ({ corpo: vazia }),
    ...extra,
  });

  it("mostra valor, justificativa, rodada, prazo e a linha do tempo em ordem", async () => {
    simularApi(rotas());
    renderizarAplicacao({ rota: "/negociacoes/o1", usuario: eu });

    const caixa = within(await screen.findByRole("group", { name: "Contraproposta aguardando resposta" }));
    expect(caixa.getByText("R$ 1.800")).toBeInTheDocument();
    expect(caixa.getByText("“Tem marcas de uso.”")).toBeInTheDocument();
    expect(caixa.getByText(/rodada 1/)).toBeInTheDocument();
    expect(caixa.getByText(/Prazo para resposta: até 24\/10\/2026/)).toBeInTheDocument();

    const passos = within(screen.getByRole("list", { name: "Histórico de valores" })).getAllByRole("listitem");
    expect(passos[0]).toHaveTextContent("Oferta enviada");
    expect(passos[0]).toHaveTextContent("Você");
    expect(passos[1]).toHaveTextContent("Contraproposta");
    expect(passos[1]).toHaveTextContent("Comprador");

    const acoes = within(screen.getByRole("group", { name: "Responder à contraproposta" }));
    expect(acoes.getAllByRole("button").map((botao) => botao.textContent)).toEqual([
      "Aceitar contraproposta",
      "Propor outro valor",
      "Recusar contraproposta",
    ]);
    expect(screen.queryByRole("button", { name: "Aceitar oferta" })).not.toBeInTheDocument();
  });

  it("responde com outro valor pela rota de resposta", async () => {
    const chamadas = simularApi(rotas({ "POST /ofertas/o1/contrapropostas/responder": () => ({ corpo: minhaOferta }) }));
    renderizarAplicacao({ rota: "/negociacoes/o1", usuario: eu });

    await userEvent.click(await screen.findByRole("button", { name: "Propor outro valor" }));
    await userEvent.type(screen.getByLabelText(/Novo valor/), "1950");
    await userEvent.click(screen.getByRole("button", { name: "Enviar contraproposta" }));

    expect(await screen.findByText(/Contraproposta de R\$ 1.950 enviada/)).toBeInTheDocument();
    expect(chamadas.find((chamada) => chamada.metodo === "POST")?.corpo).toEqual({
      acao: "contrapropor",
      preco: "1950.00",
      texto: "",
    });
  });

  it("mostra a mensagem da API quando a contraproposta expirou", async () => {
    simularApi(
      rotas({
        "POST /ofertas/o1/contrapropostas/responder": () => ({ status: 409, corpo: { detail: "A contraproposta expirou." } }),
      }),
    );
    renderizarAplicacao({ rota: "/negociacoes/o1", usuario: eu });

    await userEvent.click(await screen.findByRole("button", { name: "Aceitar contraproposta" }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Aceitar contraproposta" }));
    expect(await screen.findByText("A contraproposta expirou.")).toBeInTheDocument();
  });
});

describe("chat da negociação", () => {
  const mensagem = (dados: Record<string, unknown>) => ({
    id: 1,
    autor_id: OUTRA,
    autor_nome: "Carlos Souza",
    minha: false,
    texto: "Posso entregar sábado.",
    registrado_em: "2026-10-22T15:00:00Z",
    lida_em: null,
    ...dados,
  });

  it("mostra as mensagens no contexto da oferta, marca como lidas e envia sem opção de editar ou apagar", async () => {
    let mensagens = [mensagem({})];
    const chamadas = simularApi({
      "GET /ofertas/o1": () => ({ corpo: oferta() }),
      "GET /conversas": () => ({ corpo: { next: null, results: [conversa()] } }),
      "GET /conversas/o1/mensagens": () => ({ corpo: { next: null, results: mensagens } }),
      "POST /conversas/o1/leitura": () => ({ corpo: { marcadas: 1 } }),
      "POST /conversas/o1/mensagens": (corpo) => {
        const nova = mensagem({ id: 2, autor_id: "7f1c", autor_nome: "Joana", minha: true, ...(corpo as object) });
        mensagens = [...mensagens, nova];
        return { status: 201, corpo: nova };
      },
    });
    renderizarAplicacao({ rota: "/negociacoes/o1", usuario: eu });

    const conversaNaTela = within(await screen.findByRole("region", { name: "Conversa" }));
    expect(await conversaNaTela.findByText("Posso entregar sábado.")).toBeInTheDocument();
    await waitFor(() => expect(chamadas.some((chamada) => chamada.caminho === "/conversas/o1/leitura")).toBe(true));

    await userEvent.type(conversaNaTela.getByLabelText("Mensagem"), "Combinado!");
    await userEvent.click(conversaNaTela.getByRole("button", { name: "Enviar" }));
    expect(await conversaNaTela.findByText("Combinado!")).toBeInTheDocument();
    expect(chamadas.find((chamada) => chamada.caminho === "/conversas/o1/mensagens" && chamada.metodo === "POST")?.corpo).toEqual({
      texto: "Combinado!",
    });
    expect(conversaNaTela.queryByRole("button", { name: /Editar|Apagar|Excluir/ })).not.toBeInTheDocument();
  });

  it("fica somente leitura quando a API encerra a conversa", async () => {
    simularApi({
      "GET /ofertas/o1": () => ({ corpo: oferta({ status: "recusada" }) }),
      "GET /conversas": () => ({ corpo: { next: null, results: [conversa({ somente_leitura: true })] } }),
      "GET /conversas/o1/mensagens": () => ({ corpo: { next: null, results: [mensagem({ lida_em: "2026-10-22T16:00:00Z" })] } }),
    });
    renderizarAplicacao({ rota: "/negociacoes/o1", usuario: eu });

    const conversaNaTela = within(await screen.findByRole("region", { name: "Conversa" }));
    expect(await conversaNaTela.findByText("Posso entregar sábado.")).toBeInTheDocument();
    expect(conversaNaTela.getByText("Conversa encerrada")).toBeInTheDocument();
    expect(conversaNaTela.queryByLabelText("Mensagem")).not.toBeInTheDocument();
  });
});

