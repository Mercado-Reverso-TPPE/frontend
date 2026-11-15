import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { simularApi } from "../apiFalsa";
import { renderizarAplicacao, usuarioDeTeste } from "../utilitarios";

const ANUNCIO = {
  id: "a1",
  comprador: "outro",
  titulo: "iPhone 15 Pro Max 256GB",
  categoria: "eletronicos",
  categoria_nome: "Eletrônicos",
  descricao: "Na caixa, com nota fiscal",
  preco_min: "6000.00",
  preco_max: "7500.00",
  raio_km: 25,
  status: "ativo",
  distancia_km: 3.2,
  ofertas_recebidas: 0,
  cidade: "São Paulo",
  uf: "SP",
  criado_em: "2026-11-10T12:00:00Z",
};

const apiComUmAnuncio = () =>
  simularApi({
    "GET /categorias": () => ({ corpo: [{ slug: "eletronicos", nome: "Eletrônicos" }] }),
    "GET /anuncios": () => ({ corpo: { count: 1, next: null, results: [ANUNCIO] } }),
    "GET /anuncios/a1": () => ({ corpo: ANUNCIO }),
  });

describe("navegação da SPA", () => {
  it("abre o feed na rota raiz", async () => {
    apiComUmAnuncio();
    renderizarAplicacao({ usuario: usuarioDeTeste });

    expect(
      screen.getByRole("heading", { name: /Você anuncia o que quer/i }),
    ).toBeInTheDocument();
    expect((await screen.findAllByText("iPhone 15 Pro Max 256GB")).length).toBeGreaterThan(0);
  });

  it("manda quem não tem sessão para entrar, guardando o destino", async () => {
    const { roteador } = renderizarAplicacao({ rota: "/meus-anuncios" });

    expect(await screen.findByRole("heading", { name: "Bem-vindo de volta" })).toBeInTheDocument();
    expect(roteador.state.location.pathname).toBe("/entrar");
    expect(roteador.state.location.search).toBe("?retorno=%2Fmeus-anuncios");
  });

  it("abre a rota privada quando a sessão está aberta", async () => {
    renderizarAplicacao({ rota: "/meus-anuncios", usuario: usuarioDeTeste });

    expect(await screen.findByRole("heading", { name: "Meus anúncios" })).toBeInTheDocument();
  });

  it("navega do feed para o detalhe do anúncio", async () => {
    apiComUmAnuncio();
    const { roteador } = renderizarAplicacao({ usuario: usuarioDeTeste });

    const [primeiroCard] = await screen.findAllByRole("link", { name: "iPhone 15 Pro Max 256GB" });
    await userEvent.click(primeiroCard);

    expect(roteador.state.location.pathname).toBe("/anuncios/a1");
  });

  it("mostra a tela de rota inexistente", async () => {
    renderizarAplicacao({ rota: "/rota-que-nao-existe" });

    expect(
      await screen.findByRole("heading", { name: "Esta página não existe" }),
    ).toBeInTheDocument();
  });
});
