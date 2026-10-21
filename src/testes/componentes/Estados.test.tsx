import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Carregando, ErroAoCarregar, EstadoVazio } from "@/componentes/estado";
import { ErroDeApi } from "@/api/cliente";
import { renderizar } from "../utilitarios";

describe("padrões de estado", () => {
  it("carregando anuncia o que está acontecendo", () => {
    renderizar(<Carregando rotulo="Carregando ofertas…" />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando ofertas…");
  });

  it("erro mostra a mensagem da API e permite tentar de novo", async () => {
    const tentarDeNovo = vi.fn();
    renderizar(
      <ErroAoCarregar
        erro={new ErroDeApi("A plataforma está instável neste momento.", { codigo: "rede" })}
        aoTentarDeNovo={tentarDeNovo}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("A plataforma está instável neste momento.");

    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(tentarDeNovo).toHaveBeenCalledTimes(1);
  });

  it("estado vazio explica o próximo passo", () => {
    renderizar(
      <EstadoVazio
        titulo="Nenhum anúncio encontrado"
        descricao="Limpe os filtros para ver tudo."
        acao={{ rotulo: "Publicar o que eu quero", para: "/anunciar" }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Nenhum anúncio encontrado" })).toBeInTheDocument();
    expect(screen.getByText("Limpe os filtros para ver tudo.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Publicar o que eu quero" })).toHaveAttribute(
      "href",
      "/anunciar",
    );
  });
});
