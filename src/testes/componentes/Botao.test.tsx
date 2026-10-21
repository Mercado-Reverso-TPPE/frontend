import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Botao } from "@/componentes/base";
import { renderizar } from "../utilitarios";

describe("Botao", () => {
  it("dispara o clique", async () => {
    const aoClicar = vi.fn();
    renderizar(<Botao onClick={aoClicar}>Publicar demanda</Botao>);

    await userEvent.click(screen.getByRole("button", { name: "Publicar demanda" }));

    expect(aoClicar).toHaveBeenCalledTimes(1);
  });

  it("bloqueia o clique e anuncia ocupado enquanto carrega", async () => {
    const aoClicar = vi.fn();
    renderizar(
      <Botao carregando onClick={aoClicar}>
        Enviando
      </Botao>,
    );

    const botao = screen.getByRole("button", { name: "Enviando" });
    expect(botao).toBeDisabled();
    expect(botao).toHaveAttribute("aria-busy", "true");

    await userEvent.click(botao);
    expect(aoClicar).not.toHaveBeenCalled();
  });

  it("vira link de navegação quando recebe `para`", () => {
    renderizar(<Botao para="/anunciar">Anunciar</Botao>);

    expect(screen.getByRole("link", { name: "Anunciar" })).toHaveAttribute("href", "/anunciar");
  });
});
