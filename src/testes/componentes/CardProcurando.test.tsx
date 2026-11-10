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
  criadoEm: new Date(Date.now() - 12 * 60000).toISOString(),
  distanciaKm: 3.2,
};

const comprador = { id: "c1", nome: "Carlos Mendes", foto: null, nota: 4.8, avaliacoes: 23 };

describe("CardProcurando", () => {
  it("mostra demanda, orçamento compacto, local e distância em KM", () => {
    renderizar(<CardProcurando anuncio={anuncio} />);

    expect(screen.getByRole("link", { name: anuncio.titulo })).toHaveAttribute("href", "/anuncios/a1");
    expect(screen.getByText("Procurando")).toBeInTheDocument();
    expect(screen.getByText("Esportes")).toBeInTheDocument();
    expect(screen.getByText("12 min")).toBeInTheDocument();
    expect(screen.getByText("Orçamento")).toBeInTheDocument();
    expect(screen.getByText("R$ 1,2k — R$ 2,5k")).toBeInTheDocument();
    expect(screen.getByText("3,2 km")).toBeInTheDocument();
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

  it("mostra o comprador com nome curto, iniciais e nota quando a API envia", () => {
    renderizar(<CardProcurando anuncio={{ ...anuncio, compradorPublico: comprador }} />);

    expect(screen.getByText("Carlos M.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Foto de Carlos M." })).toHaveTextContent("CM");
    expect(screen.getByText("4,8")).toBeInTheDocument();
    expect(screen.getByText("ofertas")).toBeInTheDocument();
  });

  it("sem o comprador, o rodapé fica só com a contagem de ofertas", () => {
    renderizar(<CardProcurando anuncio={anuncio} />);

    expect(screen.queryByRole("img", { name: /Foto de/ })).not.toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("ofertas")).toBeInTheDocument();
  });
});
