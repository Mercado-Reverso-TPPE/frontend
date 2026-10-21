import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Badge } from "@/componentes/base";
import { renderizar } from "../utilitarios";

describe("Badge", () => {
  it("carrega o significado no texto, não na cor", () => {
    renderizar(
      <Badge tom="info" icone="🛒">
        Procurando
      </Badge>,
    );

    // O rótulo textual é o que o leitor de tela anuncia; o emoji é decorativo.
    expect(screen.getByText("Procurando")).toBeInTheDocument();
    expect(screen.getByText("🛒")).toHaveAttribute("aria-hidden", "true");
  });
});
