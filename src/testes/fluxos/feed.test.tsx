import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SELLER_ADS } from "@/dados/demo";
import { renderizarAplicacao } from "../utilitarios";

describe("feed de anúncios", () => {
  it("mostra o esqueleto de carregamento antes dos anúncios", async () => {
    renderizarAplicacao();

    expect(screen.getByText("Carregando anúncios…")).toBeInTheDocument();
    expect((await screen.findAllByText("iPhone 15 Pro Max 256GB")).length).toBeGreaterThan(0);
  });

  it("filtra por tipo de anúncio e guarda o filtro na URL", async () => {
    const { roteador } = renderizarAplicacao();
    await screen.findAllByText("iPhone 15 Pro Max 256GB");

    await userEvent.click(screen.getByRole("button", { name: /Vendendo/ }));

    await waitFor(() => expect(roteador.state.location.search).toBe("?tipo=vendendo"));
    expect(
      await screen.findByText(`${SELLER_ADS.length} resultados`),
    ).toBeInTheDocument();
  });

  it("explica o próximo passo quando a busca não encontra nada", async () => {
    renderizarAplicacao({ rota: "/?q=zepelim%20de%20borracha" });

    expect(
      await screen.findByRole("heading", { name: "Nenhum anúncio encontrado" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Publicar o que eu quero" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Limpar filtros" })).toBeInTheDocument();
  });
});
