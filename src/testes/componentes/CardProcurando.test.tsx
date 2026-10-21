import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { CardProcurando } from "@/componentes/anuncio";
import { BUYER_ADS } from "@/dados/demo";
import { renderizar } from "../utilitarios";

describe("CardProcurando", () => {
  const anuncio = BUYER_ADS[0];

  it("mostra demanda, orçamento e distância em KM", () => {
    renderizar(<CardProcurando anuncio={anuncio} />);

    expect(screen.getByRole("link", { name: anuncio.title })).toHaveAttribute(
      "href",
      `/anuncios/${anuncio.id}`,
    );
    expect(screen.getByText("Procurando")).toBeInTheDocument();
    expect(screen.getByText(/km/)).toBeInTheDocument();
    expect(screen.getByText(/R\$/)).toBeInTheDocument();
  });

  it("leva ao envio de oferta do próprio anúncio", () => {
    renderizar(<CardProcurando anuncio={anuncio} />);

    expect(screen.getByRole("link", { name: `Ofertar no anúncio ${anuncio.title}` })).toHaveAttribute(
      "href",
      `/anuncios/${anuncio.id}/ofertar`,
    );
  });
});
