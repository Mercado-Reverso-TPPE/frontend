import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Avatar } from "@/componentes/base";

describe("Avatar", () => {
  it("mostra a foto quando há uma", () => {
    render(<Avatar iniciais="JS" cor="#000" nome="Joana" foto="https://exemplo.com/j.png" />);

    expect(screen.getByRole("img", { name: "Foto de Joana" })).toHaveAttribute("src", "https://exemplo.com/j.png");
  });

  it("volta para as iniciais se a foto não carregar", () => {
    render(<Avatar iniciais="JS" cor="#000" nome="Joana" foto="https://exemplo.com/quebrada.png" />);

    fireEvent.error(screen.getByRole("img", { name: "Foto de Joana" }));

    expect(screen.getByRole("img", { name: "Foto de Joana" })).toHaveTextContent("JS");
  });
});
