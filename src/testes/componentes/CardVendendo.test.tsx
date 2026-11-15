import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { produtoDaApi, type ProdutoAVenda } from "@/api/vitrine";
import { CardVendendo } from "@/componentes/anuncio";
import { renderizar } from "../utilitarios";

const produto: ProdutoAVenda = {
  id: "p1",
  titulo: "MacBook Pro 14\" M3 Pro",
  descricao: "Perfeito estado, com caixa original.",
  categoria: "informatica",
  categoriaNome: "Informática",
  preco: 13500,
  estadoConservacao: "seminovo",
  foto: "https://exemplo.com/macbook.jpg",
  cidade: "São Paulo",
  uf: "SP",
  distanciaKm: 2.1,
  visualizacoes: 284,
  criadoEm: new Date(Date.now() - 30 * 60000).toISOString(),
  vendedor: { id: "v1", nome: "Lucas Teixeira", foto: null, nota: 4.9, avaliacoes: 37 },
};

describe("CardVendendo", () => {
  it("mostra foto, conservação, preço, distância e visualizações", () => {
    renderizar(<CardVendendo produto={produto} />);

    expect(screen.getByRole("img", { name: `Foto de ${produto.titulo}` })).toHaveAttribute("src", produto.foto);
    expect(screen.getByText("Semi-novo")).toBeInTheDocument();
    expect(screen.getByText("Vendendo")).toBeInTheDocument();
    expect(screen.getByText("Informática")).toBeInTheDocument();
    expect(screen.getByText("30 min")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: produto.titulo })).toBeInTheDocument();
    expect(screen.getByText("R$ 13.500")).toBeInTheDocument();
    expect(screen.getByText("2,1 km")).toBeInTheDocument();
    expect(screen.getByText("284")).toBeInTheDocument();
  });

  it("mostra o vendedor e leva a ofertar", () => {
    renderizar(<CardVendendo produto={produto} paraOfertar="/anunciar" />);

    expect(screen.getByText("Lucas T.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Foto de Lucas T." })).toHaveTextContent("LT");
    expect(screen.getByText("4,9")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: `Ofertar por ${produto.titulo}` })).toHaveAttribute("href", "/anunciar");
  });

  it("sem foto, mostra o placeholder com o ícone da categoria", () => {
    renderizar(<CardVendendo produto={{ ...produto, foto: null }} />);

    const placeholder = screen.getByRole("img", { name: `${produto.titulo} sem foto` });
    expect(placeholder).toHaveTextContent("💻");
    expect(screen.queryByRole("img", { name: `Foto de ${produto.titulo}` })).not.toBeInTheDocument();
  });

  it("sem o vendedor, o rodapé fica só com a ação", () => {
    renderizar(<CardVendendo produto={{ ...produto, vendedor: null }} />);

    expect(screen.queryByText("Lucas T.")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ofertar por/ })).toBeInTheDocument();
  });

  it("converte o produto da API com a primeira foto e o resumo do vendedor", () => {
    const convertido = produtoDaApi({
      id: "p9",
      nome: "Bike",
      descricao: "Aro 29",
      categoria: "esportes",
      categoria_nome: "Esportes",
      preco: "4500.00",
      estado_conservacao: "usado_bom",
      fotos: [{ url: "https://exemplo.com/1.jpg" }],
      distancia_km: 11.2,
      visualizacoes: 147,
      criado_em: "2026-11-10T10:00:00Z",
      vendedor_publico: { id: 7, nome: "Diego Moura", nota: "4.50" },
    });

    expect(convertido).toMatchObject({
      titulo: "Bike",
      preco: 4500,
      foto: "https://exemplo.com/1.jpg",
      vendedor: { id: "7", nome: "Diego Moura", nota: 4.5, foto: null },
    });
  });
});
