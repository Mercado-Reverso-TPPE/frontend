import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import type { Anuncio } from "@/api/meusAnuncios";
import { CardProcurando } from "@/componentes/anuncio";
import { renderizar } from "../utilitarios";

const anuncio: Anuncio = {
  id: "a1",
  comprador: "c1",
  titulo: "Bicicleta aro 29",
  categoria: "esportes",
  categoriaNome: "Esportes",
  descricao: "Com freio a disco.",
  precoMin: 1200,
  precoMax: 2500,
  raioKm: 25,
  status: "ativo",
  ofertasRecebidas: 3,
  cidade: "Brasília",
  uf: "DF",
  criadoEm: "2026-10-20T15:00:00Z",
  distanciaKm: 3.2,
};

describe("CardProcurando", () => {
  it("mostra demanda, orçamento e distância em KM", () => {
    renderizar(<CardProcurando anuncio={anuncio} />);

    expect(screen.getByRole("link", { name: anuncio.titulo })).toHaveAttribute("href", "/anuncios/a1");
    expect(screen.getByText("Procurando")).toBeInTheDocument();
    expect(screen.getByText("3,2 km")).toBeInTheDocument();
    expect(screen.getByText("R$ 1.200 a R$ 2.500")).toBeInTheDocument();
    expect(screen.getByText("Brasília, DF", { exact: false })).toBeInTheDocument();
  });

  it("leva ao envio de oferta do próprio anúncio", () => {
    renderizar(<CardProcurando anuncio={anuncio} />);

    expect(screen.getByRole("link", { name: "Ofertar no anúncio Bicicleta aro 29" })).toHaveAttribute(
      "href",
      "/anuncios/a1/ofertar",
    );
  });

  it("mostra 'A combinar' quando não há orçamento", () => {
    renderizar(<CardProcurando anuncio={{ ...anuncio, precoMin: null, precoMax: null }} />);

    expect(screen.getByText("A combinar")).toBeInTheDocument();
  });
});
