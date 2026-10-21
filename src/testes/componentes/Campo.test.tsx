import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Campo } from "@/componentes/base";
import { renderizar } from "../utilitarios";

describe("Campo", () => {
  it("liga o rótulo ao controle", async () => {
    renderizar(<Campo rotulo="Título do anúncio" placeholder="iPhone 15 Pro" />);

    const campo = screen.getByLabelText("Título do anúncio");
    await userEvent.type(campo, "Bicicleta");

    expect(campo).toHaveValue("Bicicleta");
  });

  it("expõe a dica pelo aria-describedby", () => {
    renderizar(<Campo rotulo="Orçamento máximo" dica="Valor em reais, sem centavos." />);

    expect(screen.getByLabelText("Orçamento máximo")).toHaveAccessibleDescription(
      "Valor em reais, sem centavos.",
    );
  });

  it("marca o campo como inválido e anuncia o erro", () => {
    renderizar(<Campo rotulo="E-mail" erro="Informe um e-mail válido." />);

    expect(screen.getByLabelText("E-mail")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Informe um e-mail válido.");
  });

  it("renderiza seleção com as opções recebidas", () => {
    renderizar(
      <Campo rotulo="Estado" como="select" defaultValue="SP">
        <option value="SP">SP</option>
        <option value="RJ">RJ</option>
      </Campo>,
    );

    expect(screen.getByLabelText("Estado")).toHaveValue("SP");
  });
});
