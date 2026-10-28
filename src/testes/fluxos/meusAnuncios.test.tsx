import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usuarioDoPerfil } from "@/api/autenticacao";
import { perfilDeTeste, simularApi } from "../apiFalsa";
import { renderizarAplicacao } from "../utilitarios";

const usuario = usuarioDoPerfil(perfilDeTeste);

function anuncioDaApi(dados: Partial<Record<string, unknown>> = {}) {
  return {
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
    ofertas_recebidas: 3,
    cidade: "Brasília",
    uf: "DF",
    criado_em: "2026-10-20T15:00:00Z",
    atualizado_em: "2026-10-20T15:00:00Z",
    ...dados,
  };
}

const CATEGORIAS = [
  { slug: "eletronicos", nome: "Eletrônicos" },
  { slug: "esportes", nome: "Esportes" },
];

function item(titulo: string) {
  return within(screen.getByRole("heading", { name: titulo }).closest("li")!);
}

describe("meus anúncios", () => {
  it("mostra status, ofertas e só as ações que o status permite", async () => {
    simularApi({
      "GET /anuncios/meus": () => ({
        corpo: {
          next: null,
          results: [
            anuncioDaApi({ id: "a1", titulo: "Ativo", status: "ativo" }),
            anuncioDaApi({ id: "a2", titulo: "Pausado", status: "pausado", ofertas_recebidas: 0 }),
            anuncioDaApi({ id: "a3", titulo: "Negociando", status: "em_negociacao" }),
            anuncioDaApi({ id: "a4", titulo: "Fechado", status: "encerrado", ofertas_recebidas: 1 }),
          ],
        },
      }),
    });
    renderizarAplicacao({ rota: "/meus-anuncios", usuario });

    await screen.findByRole("heading", { name: "Ativo" });
    expect(screen.getByText("1 ativo · 4 no total")).toBeInTheDocument();

    const ativo = item("Ativo");
    expect(ativo.getByText("Ativo", { selector: "span" })).toBeInTheDocument();
    expect(ativo.getByText("ofertas recebidas", { exact: false })).toHaveTextContent("3 ofertas recebidas");
    expect(ativo.getByText("R$ 1.200 a R$ 2.500")).toBeInTheDocument();
    expect(ativo.getByText("Raio de 25 km")).toBeInTheDocument();
    expect(ativo.getByRole("link", { name: "Editar" })).toHaveAttribute("href", "/meus-anuncios/a1/editar");
    expect(ativo.getByRole("button", { name: "Pausar" })).toBeInTheDocument();
    expect(ativo.getByRole("button", { name: "Encerrar" })).toBeInTheDocument();
    expect(ativo.queryByRole("button", { name: "Reativar" })).not.toBeInTheDocument();

    const pausado = item("Pausado");
    expect(pausado.getByRole("button", { name: "Reativar" })).toBeInTheDocument();
    expect(pausado.queryByRole("button", { name: "Pausar" })).not.toBeInTheDocument();
    expect(pausado.queryByRole("link", { name: "Ver ofertas" })).not.toBeInTheDocument();

    for (const titulo of ["Negociando", "Fechado"]) {
      const semAcoes = item(titulo);
      expect(semAcoes.queryByRole("link", { name: "Editar" })).not.toBeInTheDocument();
      expect(semAcoes.queryByRole("button", { name: /Pausar|Reativar|Encerrar/ })).not.toBeInTheDocument();
    }
    expect(item("Negociando").getByText("Em negociação")).toBeInTheDocument();
  });

  it("orienta o próximo passo quando não há anúncios", async () => {
    simularApi({ "GET /anuncios/meus": () => ({ corpo: { next: null, results: [] } }) });
    renderizarAplicacao({ rota: "/meus-anuncios", usuario });

    expect(await screen.findByRole("heading", { name: "Você ainda não publicou nada" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Criar primeiro anúncio" })).toHaveAttribute("href", "/anunciar");
  });

  it("pausa pelo endpoint de status e recarrega a lista", async () => {
    let status = "ativo";
    const chamadas = simularApi({
      "GET /anuncios/meus": () => ({ corpo: { next: null, results: [anuncioDaApi({ status })] } }),
      "PATCH /anuncios/a1/status": (corpo) => {
        status = (corpo as { status: string }).status;
        return { corpo: anuncioDaApi({ status }) };
      },
    });
    renderizarAplicacao({ rota: "/meus-anuncios", usuario });

    await userEvent.click(await screen.findByRole("button", { name: "Pausar" }));

    expect(await screen.findByText('"Bicicleta aro 29" foi pausado.')).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Reativar" })).toBeInTheDocument();
    expect(chamadas.find((chamada) => chamada.metodo === "PATCH")?.corpo).toEqual({ status: "pausado" });
  });

  it("pede confirmação antes de encerrar", async () => {
    const chamadas = simularApi({
      "GET /anuncios/meus": () => ({ corpo: { next: null, results: [anuncioDaApi()] } }),
      "PATCH /anuncios/a1/status": () => ({ corpo: anuncioDaApi({ status: "encerrado" }) }),
    });
    renderizarAplicacao({ rota: "/meus-anuncios", usuario });

    await userEvent.click(await screen.findByRole("button", { name: "Encerrar" }));
    const dialogo = screen.getByRole("dialog", { name: 'Encerrar "Bicicleta aro 29"?' });
    await userEvent.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(chamadas.some((chamada) => chamada.metodo === "PATCH")).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: "Encerrar" }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Encerrar anúncio" }));

    expect(await screen.findByText('"Bicicleta aro 29" foi encerrado.')).toBeInTheDocument();
    expect(chamadas.find((chamada) => chamada.metodo === "PATCH")?.corpo).toEqual({ status: "encerrado" });
  });

  it("mostra a recusa do backend quando a transição não vale mais", async () => {
    simularApi({
      "GET /anuncios/meus": () => ({ corpo: { next: null, results: [anuncioDaApi()] } }),
      "PATCH /anuncios/a1/status": () => ({ status: 400, corpo: ["Transição de status inválida."] }),
    });
    renderizarAplicacao({ rota: "/meus-anuncios", usuario });

    await userEvent.click(await screen.findByRole("button", { name: "Pausar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Transição de status inválida.");
  });

  it("carrega a próxima página pelo cursor", async () => {
    const chamadas = simularApi({
      "GET /anuncios/meus": (_corpo, chamada) =>
        chamada.parametros.cursor === "c2"
          ? { corpo: { next: null, results: [anuncioDaApi({ id: "a2", titulo: "Segundo" })] } }
          : {
              corpo: {
                next: "http://api.teste/api/v1/anuncios/meus?cursor=c2",
                results: [anuncioDaApi({ id: "a1", titulo: "Primeiro" })],
              },
            },
    });
    renderizarAplicacao({ rota: "/meus-anuncios", usuario });

    await userEvent.click(await screen.findByRole("button", { name: "Carregar mais" }));

    expect(await screen.findByRole("heading", { name: "Segundo" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Primeiro" })).toBeInTheDocument();
    expect(chamadas.at(-1)?.parametros).toEqual({ cursor: "c2" });
    expect(screen.queryByRole("button", { name: "Carregar mais" })).not.toBeInTheDocument();
  });
});

describe("publicar anúncio", () => {
  it("valida obrigatórios e faixa de preço antes de enviar", async () => {
    const chamadas = simularApi({ "GET /categorias": () => ({ corpo: CATEGORIAS }) });
    renderizarAplicacao({ rota: "/anunciar", usuario });

    await userEvent.type(screen.getByLabelText(/Mínimo/), "3000");
    await userEvent.type(screen.getByLabelText(/Máximo/), "2000");
    await userEvent.click(screen.getByRole("button", { name: "Publicar anúncio" }));

    expect(screen.getByText("Diga o que você procura.")).toBeInTheDocument();
    expect(screen.getByText("Escolha uma categoria.")).toBeInTheDocument();
    expect(screen.getByText("Descreva o que você procura.")).toBeInTheDocument();
    expect(screen.getByText("O máximo precisa ser maior ou igual ao mínimo.")).toBeInTheDocument();
    expect(chamadas.filter((chamada) => chamada.metodo === "POST")).toHaveLength(0);
  });

  it("mostra o raio em km com prévia do alcance", async () => {
    simularApi({ "GET /categorias": () => ({ corpo: CATEGORIAS }) });
    renderizarAplicacao({ rota: "/anunciar", usuario });

    expect(screen.getByRole("img", { name: /Alcance de 20 km a partir de Brasília, DF/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "50 km" }));

    expect(screen.getByRole("slider", { name: /Raio de busca/ })).toHaveValue("50");
    expect(screen.getByRole("img", { name: /Alcance de 50 km a partir de Brasília, DF, cerca de 7.854 km²/ })).toBeInTheDocument();
  });

  it("publica e volta para a lista com o aviso", async () => {
    const chamadas = simularApi({
      "GET /categorias": () => ({ corpo: CATEGORIAS }),
      "POST /anuncios": (corpo) => ({ status: 201, corpo: anuncioDaApi({ ...(corpo as object), id: "novo", ofertas_recebidas: 0 }) }),
      "GET /anuncios/meus": () => ({ corpo: { next: null, results: [anuncioDaApi({ id: "novo", titulo: "Bicicleta aro 29" })] } }),
    });
    const { roteador } = renderizarAplicacao({ rota: "/anunciar", usuario });

    await userEvent.type(screen.getByLabelText(/^Título/), "Bicicleta aro 29");
    await userEvent.selectOptions(await screen.findByLabelText(/^Categoria/), "esportes");
    await userEvent.type(screen.getByLabelText(/^Descrição/), "Com freio a disco.");
    await userEvent.type(screen.getByLabelText(/Mínimo/), "1.200,50");
    await userEvent.type(screen.getByLabelText(/Máximo/), "2500");
    await userEvent.click(screen.getByRole("button", { name: "25 km" }));
    expect(screen.getByText("Faixa: R$ 1.201 a R$ 2.500")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Publicar anúncio" }));

    expect(await screen.findByText(/"Bicicleta aro 29" foi publicado/)).toBeInTheDocument();
    expect(roteador.state.location.pathname).toBe("/meus-anuncios");
    expect(chamadas.find((chamada) => chamada.metodo === "POST")?.corpo).toEqual({
      titulo: "Bicicleta aro 29",
      categoria: "esportes",
      descricao: "Com freio a disco.",
      preco_min: 1200.5,
      preco_max: 2500,
      raio_km: 25,
    });
  });

  it("mostra no campo o erro devolvido pela API", async () => {
    simularApi({
      "GET /categorias": () => ({ corpo: CATEGORIAS }),
      "POST /anuncios": () => ({ status: 400, corpo: { preco_max: ["Certifique-se de que não haja mais de 10 dígitos no total."] } }),
    });
    renderizarAplicacao({ rota: "/anunciar", usuario });

    await userEvent.type(screen.getByLabelText(/^Título/), "Carro");
    await userEvent.selectOptions(await screen.findByLabelText(/^Categoria/), "eletronicos");
    await userEvent.type(screen.getByLabelText(/^Descrição/), "Qualquer um.");
    await userEvent.type(screen.getByLabelText(/Máximo/), "99999999999");
    await userEvent.click(screen.getByRole("button", { name: "Publicar anúncio" }));

    expect(await screen.findByText(/não haja mais de 10 dígitos/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Máximo/)).toHaveAttribute("aria-invalid", "true");
  });

  it("bloqueia a publicação sem localização no perfil", async () => {
    simularApi({ "GET /categorias": () => ({ corpo: CATEGORIAS }) });
    renderizarAplicacao({ rota: "/anunciar", usuario: { ...usuario, city: "", state: "", cep: "" } });

    expect(screen.getByText("Falta sua localização")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publicar anúncio" })).toBeDisabled();
  });
});

describe("editar anúncio", () => {
  it("carrega o anúncio, salva as mudanças e volta para a lista", async () => {
    const chamadas = simularApi({
      "GET /categorias": () => ({ corpo: CATEGORIAS }),
      "GET /anuncios/a1": () => ({ corpo: anuncioDaApi() }),
      "PATCH /anuncios/a1": (corpo) => ({ corpo: anuncioDaApi(corpo as object) }),
      "GET /anuncios/meus": () => ({ corpo: { next: null, results: [anuncioDaApi()] } }),
    });
    const { roteador } = renderizarAplicacao({ rota: "/meus-anuncios/a1/editar", usuario });

    const titulo = await screen.findByLabelText(/^Título/);
    expect(titulo).toHaveValue("Bicicleta aro 29");
    expect(screen.getByLabelText(/Mínimo/)).toHaveValue("1200");
    expect(chamadas[0]?.parametros).toEqual({ meus: "true" });

    await userEvent.clear(titulo);
    await userEvent.type(titulo, "Bicicleta aro 29 com suspensão");
    await waitFor(() => expect(screen.getByLabelText(/^Categoria/)).toHaveValue("esportes"));
    await userEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByText(/Alterações em "Bicicleta aro 29 com suspensão" salvas/)).toBeInTheDocument();
    expect(roteador.state.location.pathname).toBe("/meus-anuncios");
    expect(chamadas.find((chamada) => chamada.metodo === "PATCH")?.corpo).toMatchObject({
      titulo: "Bicicleta aro 29 com suspensão",
      raio_km: 25,
    });
  });

  it("não oferece edição para anúncio encerrado", async () => {
    simularApi({
      "GET /categorias": () => ({ corpo: CATEGORIAS }),
      "GET /anuncios/a1": () => ({ corpo: anuncioDaApi({ status: "encerrado" }) }),
    });
    renderizarAplicacao({ rota: "/meus-anuncios/a1/editar", usuario });

    expect(await screen.findByText("Este anúncio não pode ser editado")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Salvar alterações" })).not.toBeInTheDocument();
  });
});
