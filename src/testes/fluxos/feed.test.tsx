import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usuarioDoPerfil } from "@/api/autenticacao";
import { perfilDeTeste, simularApi } from "../apiFalsa";
import { renderizarAplicacao } from "../utilitarios";

const usuario = usuarioDoPerfil(perfilDeTeste);

const anuncio = (id: string, titulo: string, dados: Record<string, unknown> = {}) => ({
  id,
  comprador: "outro",
  titulo,
  categoria: "esportes",
  categoria_nome: "Esportes",
  descricao: "Descrição",
  preco_min: "100.00",
  preco_max: "900.00",
  raio_km: 25,
  status: "ativo",
  distancia_km: 2.5,
  ofertas_recebidas: 1,
  cidade: "Brasília",
  uf: "DF",
  criado_em: "2026-10-20T15:00:00Z",
  ...dados,
});

const CATEGORIAS = [
  { slug: "esportes", nome: "Esportes" },
  { slug: "games", nome: "Games" },
];

/** Backend com um feed de `total` anúncios, paginado de 12 em 12. */
function apiComFeed(total = 3) {
  const todos = Array.from({ length: total }, (_, indice) => anuncio(`a${indice + 1}`, `Anúncio ${indice + 1}`));
  return simularApi({
    "GET /categorias": () => ({ corpo: CATEGORIAS }),
    "GET /anuncios": (_corpo, chamada) => {
      const inicio = Number(chamada.parametros.cursor ?? 0);
      const tamanho = Number(chamada.parametros.tamanho ?? 12);
      const fim = inicio + tamanho;
      return {
        corpo: {
          count: todos.length,
          next: fim < todos.length ? `http://api.teste/api/v1/anuncios?cursor=${fim}` : null,
          results: todos.slice(inicio, fim),
        },
      };
    },
    "GET /anuncios/a1": () => ({ corpo: todos[0] }),
  });
}

const chamadasDoFeed = (chamadas: ReturnType<typeof simularApi>) =>
  chamadas.filter((chamada) => chamada.caminho === "/anuncios" && chamada.parametros.tamanho === "12");

describe("feed de anúncios (demonstração)", () => {
  it("mostra o esqueleto de carregamento antes dos anúncios", async () => {
    renderizarAplicacao();

    expect(screen.getByText("Carregando anúncios…")).toBeInTheDocument();
    expect((await screen.findAllByText("iPhone 15 Pro Max 256GB")).length).toBeGreaterThan(0);
  });

  it("explica o próximo passo quando a busca não encontra nada", async () => {
    renderizarAplicacao({ rota: "/?q=zepelim%20de%20borracha" });

    expect(await screen.findByRole("heading", { name: "Nenhum anúncio encontrado" })).toBeInTheDocument();
    expect(screen.getByText(/Tente outra categoria, aumente a distância/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Publicar o que eu quero" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Limpar filtros" }).length).toBeGreaterThan(0);
  });

  it("não tem aba de anúncios de venda", async () => {
    renderizarAplicacao();
    await screen.findAllByText("iPhone 15 Pro Max 256GB");

    expect(screen.queryByRole("button", { name: /Vendendo/ })).not.toBeInTheDocument();
  });
});

describe("feed de anúncios (API)", () => {
  it("pede para entrar quando não há sessão", async () => {
    const chamadas = apiComFeed();
    renderizarAplicacao();

    expect(await screen.findByRole("heading", { name: "Entre para ver anúncios perto de você" })).toBeInTheDocument();
    expect(chamadas.some((chamada) => chamada.caminho === "/anuncios")).toBe(false);
  });

  it("pede a localização quando o perfil não tem", async () => {
    apiComFeed();
    renderizarAplicacao({ usuario: { ...usuario, city: "", state: "", cep: "" } });

    expect(await screen.findByRole("heading", { name: "Falta sua localização" })).toBeInTheDocument();
  });

  it("mostra só o que a API devolve", async () => {
    apiComFeed(2);
    renderizarAplicacao({ usuario });

    expect(await screen.findByRole("heading", { name: "2 anúncios" })).toBeInTheDocument();
    const grade = screen.getAllByRole("article").filter((card) => within(card).queryByText("Procurando"));
    expect(grade.length).toBeGreaterThanOrEqual(2);
  });

  it("combina filtros e ordenação na URL e na chamada", async () => {
    const chamadas = apiComFeed();
    const { roteador } = renderizarAplicacao({ rota: "/?q=bike", usuario });
    await screen.findByRole("heading", { name: "3 anúncios" });

    await userEvent.click(await screen.findByRole("button", { name: "Esportes" }));
    await userEvent.selectOptions(screen.getByLabelText("Distância máxima"), "25");
    await userEvent.type(screen.getByLabelText(/Orçamento até/), "3.000");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar preço" }));
    await userEvent.selectOptions(screen.getByLabelText("Ordenar:"), "recentes");

    await waitFor(() =>
      expect(Object.fromEntries(new URLSearchParams(roteador.state.location.search))).toEqual({
        q: "bike",
        categoria: "esportes",
        distancia: "25",
        preco_max: "3000",
        ordenar: "recentes",
      }),
    );
    await waitFor(() =>
      expect(chamadasDoFeed(chamadas).at(-1)?.parametros).toEqual({
        q: "bike",
        categoria: "esportes",
        distancia_max_km: "25",
        preco_max: "3000",
        ordenacao: "recentes",
        tamanho: "12",
      }),
    );
  });

  it("recusa faixa de preço invertida sem buscar", async () => {
    apiComFeed();
    const { roteador } = renderizarAplicacao({ usuario });
    await screen.findByRole("heading", { name: "3 anúncios" });

    await userEvent.type(screen.getByLabelText(/Orçamento a partir/), "500");
    await userEvent.type(screen.getByLabelText(/Orçamento até/), "100");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar preço" }));

    expect(screen.getByText("O máximo precisa ser maior ou igual ao mínimo.")).toBeInTheDocument();
    expect(roteador.state.location.search).toBe("");
  });

  it("carrega mais anúncios pelo cursor", async () => {
    const chamadas = apiComFeed(14);
    renderizarAplicacao({ usuario });
    await screen.findByRole("heading", { name: "14 anúncios" });
    expect(screen.queryByRole("link", { name: "Anúncio 13" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Carregar mais anúncios" }));

    expect(await screen.findByRole("link", { name: "Anúncio 13" })).toBeInTheDocument();
    expect(chamadasDoFeed(chamadas).at(-1)?.parametros.cursor).toBe("12");
    expect(screen.queryByRole("button", { name: "Carregar mais anúncios" })).not.toBeInTheDocument();
  });

  it("mantém os filtros ao voltar do detalhe", async () => {
    apiComFeed();
    const { roteador } = renderizarAplicacao({ rota: "/?categoria=esportes&ordenar=recentes", usuario });

    const [link] = await screen.findAllByRole("link", { name: "Anúncio 1" });
    await userEvent.click(link!);
    expect(await screen.findByRole("heading", { name: "Anúncio 1" })).toBeInTheDocument();
    expect(roteador.state.location.pathname).toBe("/anuncios/a1");

    await userEvent.click(screen.getByRole("button", { name: "← Voltar" }));

    await waitFor(() => expect(roteador.state.location.pathname).toBe("/"));
    expect(roteador.state.location.search).toBe("?categoria=esportes&ordenar=recentes");
    expect(await screen.findByRole("button", { name: "Esportes" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Ordenar:")).toHaveValue("recentes");
  });
});

describe("recomendações", () => {
  it("convidam a ofertar ou podem ser descartadas, sem criar oferta", async () => {
    renderizarAplicacao({ usuario });
    const carrossel = within(await screen.findByRole("region", { name: "Recomendados para você" }));

    const [primeiroConvite] = carrossel.getAllByRole("link", { name: /Fazer oferta em/ });
    expect(primeiroConvite).toHaveAttribute("href", expect.stringMatching(/^\/anuncios\/.+\/ofertar$/));

    const descartes = carrossel.getAllByRole("button", { name: /Descartar recomendação/ });
    const nome = descartes[0]!.getAttribute("aria-label")!.replace("Descartar recomendação ", "");
    await userEvent.click(descartes[0]!);

    expect(carrossel.queryByRole("button", { name: `Descartar recomendação ${nome}` })).not.toBeInTheDocument();
    expect(localStorage.getItem("quero.recomendacoes.descartadas")).toContain('"');
  });
});
