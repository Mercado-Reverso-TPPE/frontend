import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderizarAplicacao, usuarioDeTeste } from "../utilitarios";

describe("navegação da SPA", () => {
  it("abre o feed na rota raiz", async () => {
    renderizarAplicacao();

    expect(
      screen.getByRole("heading", { name: /Você anuncia o que quer/i }),
    ).toBeInTheDocument();
    // O mesmo anúncio aparece na grade e no carrossel de recomendações.
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
    const { roteador } = renderizarAplicacao();

    const [primeiroCard] = await screen.findAllByRole("link", { name: "iPhone 15 Pro Max 256GB" });
    await userEvent.click(primeiroCard);

    expect(roteador.state.location.pathname).toBe("/anuncios/1");
  });

  it("mostra a tela de rota inexistente", async () => {
    renderizarAplicacao({ rota: "/rota-que-nao-existe" });

    expect(
      await screen.findByRole("heading", { name: "Esta página não existe" }),
    ).toBeInTheDocument();
  });
});
