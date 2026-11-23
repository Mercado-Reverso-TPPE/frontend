import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usuarioDoPerfil } from "@/api/autenticacao";
import { perfilDeTeste, simularApi } from "../apiFalsa";
import { renderizarAplicacao } from "../utilitarios";

const usuario = usuarioDoPerfil(perfilDeTeste);

const CATEGORIAS = [
  { slug: "eletronicos", nome: "Eletrônicos" },
  { slug: "games", nome: "Games" },
];

const publico = (id: string, titulo: string, dados: Record<string, unknown> = {}) => ({
  id,
  titulo,
  categoria: "eletronicos",
  categoria_nome: "Eletrônicos",
  preco_min: "100.00",
  preco_max: "900.00",
  cidade: "São Paulo",
  uf: "SP",
  criado_em: "2026-11-20T15:00:00Z",
  ...dados,
});

const TODOS = [
  publico("a1", "Procuro notebook"),
  publico("a2", "Procuro console", { categoria: "games", categoria_nome: "Games" }),
  publico("a3", "Procuro celular", { cidade: "Rio de Janeiro", uf: "RJ" }),
];

/** Backend com a home pública filtrando por UF e categoria, e o feed autenticado. */
function apiPublica(extras: Parameters<typeof simularApi>[0] = {}) {
  return simularApi({
    "GET /categorias": () => ({ corpo: CATEGORIAS }),
    "GET /anuncios/publicos": (_corpo, chamada) => {
      const { uf, categoria } = chamada.parametros;
      const filtrados = TODOS.filter(
        (item) => (!uf || item.uf === uf) && (!categoria || item.categoria === categoria),
      );
      return { corpo: { count: filtrados.length, next: null, results: filtrados } };
    },
    "GET /anuncios": () => ({ corpo: { count: 0, next: null, results: [] } }),
    ...extras,
  });
}

const seletorDeLocalidade = () => screen.getByRole("combobox", { name: "Localidade" });

describe("home pública (visitante)", () => {
  it("renderiza sem token, com os anúncios do Brasil inteiro", async () => {
    const chamadas = apiPublica();
    renderizarAplicacao();

    expect(await screen.findByRole("link", { name: "Procuro notebook" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Procuro celular" })).toBeInTheDocument();

    const pedido = chamadas.find((chamada) => chamada.caminho === "/anuncios/publicos");
    expect(pedido?.autorizacao).toBeUndefined();
    expect(pedido?.parametros.uf).toBeUndefined();
    expect(pedido?.parametros.ordenacao).toBe("recentes");
    expect(chamadas.some((chamada) => chamada.caminho === "/anuncios")).toBe(false);
  });

  it("começa o seletor de localidade em Brasil", async () => {
    apiPublica();
    renderizarAplicacao();

    await screen.findByRole("link", { name: "Procuro notebook" });
    expect(seletorDeLocalidade()).toHaveValue("");
    expect(within(seletorDeLocalidade()).getByRole("option", { selected: true })).toHaveTextContent("Brasil");
    expect(within(seletorDeLocalidade()).getAllByRole("option")).toHaveLength(28);
  });

  it("trocar a UF atualiza a URL e a busca, e voltar desfaz", async () => {
    const chamadas = apiPublica();
    const { roteador } = renderizarAplicacao();
    await screen.findByRole("link", { name: "Procuro notebook" });

    await userEvent.selectOptions(seletorDeLocalidade(), "SP");

    await waitFor(() => expect(roteador.state.location.search).toBe("?uf=SP"));
    await waitFor(() => expect(screen.queryByRole("link", { name: "Procuro celular" })).not.toBeInTheDocument());
    expect(chamadas.at(-1)?.parametros.uf).toBe("SP");

    await roteador.navigate(-1);
    await waitFor(() => expect(seletorDeLocalidade()).toHaveValue(""));
  });

  it("combina a UF com a categoria na URL", async () => {
    apiPublica();
    const { roteador } = renderizarAplicacao({ rota: "/?uf=SP" });
    await screen.findByRole("link", { name: "Procuro notebook" });

    await userEvent.click(screen.getByRole("button", { name: /Games/ }));

    await waitFor(() => expect(new URLSearchParams(roteador.state.location.search).get("categoria")).toBe("games"));
    expect(new URLSearchParams(roteador.state.location.search).get("uf")).toBe("SP");
    expect(await screen.findByRole("link", { name: "Procuro console" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Procuro notebook" })).not.toBeInTheDocument();
  });

  it("o clique no card leva a entrar com retorno ao anúncio", async () => {
    apiPublica();
    const { roteador } = renderizarAplicacao();

    await userEvent.click(await screen.findByRole("link", { name: "Procuro notebook" }));

    expect(roteador.state.location.pathname).toBe("/entrar");
    expect(roteador.state.location.search).toBe("?retorno=%2Fanuncios%2Fa1");
  });

  it("/login?next= leva ao mesmo login com retorno", async () => {
    apiPublica();
    const { roteador } = renderizarAplicacao({ rota: "/login?next=/anuncios/a1" });

    await waitFor(() => expect(roteador.state.location.pathname).toBe("/entrar"));
    expect(roteador.state.location.search).toBe("?retorno=%2Fanuncios%2Fa1");
  });

  it("/login?next= com destino externo volta para a home", async () => {
    apiPublica();
    const { roteador } = renderizarAplicacao({ rota: "/login?next=https://malicioso.example" });

    await waitFor(() => expect(roteador.state.location.pathname).toBe("/entrar"));
    expect(roteador.state.location.search).toBe("");
  });

  it("ofertar também pede para entrar, com retorno à oferta", async () => {
    apiPublica();
    renderizarAplicacao();
    await screen.findByRole("link", { name: "Procuro notebook" });

    expect(screen.getByRole("link", { name: "Ofertar no anúncio Procuro notebook" })).toHaveAttribute(
      "href",
      "/entrar?retorno=%2Fanuncios%2Fa1%2Fofertar",
    );
  });

  it("o card mostra só o superficial", async () => {
    apiPublica();
    renderizarAplicacao();
    const titulo = await screen.findByRole("link", { name: "Procuro notebook" });
    const card = titulo.closest("article")!;

    expect(within(card).getByText("Eletrônicos")).toBeInTheDocument();
    expect(within(card).getByText(/São Paulo, SP/)).toBeInTheDocument();
    expect(within(card).getByText("Entre para ver detalhes e ofertar")).toBeInTheDocument();
    expect(within(card).queryByText(/oferta(s)?$/)).not.toBeInTheDocument();
  });

  it("a aba Vendendo só convida a entrar e não busca a vitrine", async () => {
    const chamadas = apiPublica();
    renderizarAplicacao();
    await screen.findByRole("link", { name: "Procuro notebook" });

    const abas = screen.getByRole("group", { name: "Tipo de anúncio" });
    expect(within(abas).queryByRole("button", { name: "Todos" })).not.toBeInTheDocument();
    await userEvent.click(within(abas).getByRole("button", { name: /Vendendo/ }));

    expect(
      await screen.findByRole("heading", { name: "Entre para ver produtos à venda perto de você" }),
    ).toBeInTheDocument();
    expect(chamadas.some((chamada) => chamada.caminho === "/vitrine")).toBe(false);
  });

  it("a ordenação não oferece 'Mais próximos'", async () => {
    apiPublica();
    renderizarAplicacao();
    await screen.findByRole("link", { name: "Procuro notebook" });

    const ordenar = screen.getByRole("combobox", { name: "Ordenar:" });
    expect(within(ordenar).queryByRole("option", { name: "Mais próximos" })).not.toBeInTheDocument();
    expect(ordenar).toHaveValue("recentes");
  });
});

describe("convite para entrar", () => {
  it("aparece para o visitante, com Entrar e Criar conta", async () => {
    apiPublica();
    renderizarAplicacao();

    const convite = await screen.findByRole("region", { name: "Entre e o quero. trabalha por você" });
    expect(within(convite).getByText(/Anuncie o que quer comprar/)).toBeInTheDocument();
    expect(within(convite).getByText(/pedidos perto de você/)).toBeInTheDocument();
    expect(within(convite).getByText(/indicações conforme seus interesses/)).toBeInTheDocument();
    expect(within(convite).getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/entrar");
    expect(within(convite).getByRole("link", { name: "Criar conta" })).toHaveAttribute("href", "/cadastrar");
  });

  it("some para quem está logado, que vê o feed geolocalizado", async () => {
    const chamadas = apiPublica();
    renderizarAplicacao({ usuario });

    await waitFor(() => expect(chamadas.some((chamada) => chamada.caminho === "/anuncios")).toBe(true));
    expect(screen.queryByRole("region", { name: "Entre e o quero. trabalha por você" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Localidade" })).not.toBeInTheDocument();
    expect(chamadas.some((chamada) => chamada.caminho === "/anuncios/publicos")).toBe(false);
  });
});
