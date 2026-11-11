import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  UploadDeFoto,
  TAMANHO_MAXIMO_BYTES,
} from "@/componentes/anuncio/UploadDeFoto";

describe("UploadDeFoto", () => {
  it("renderiza a área tracejada com ícone, textos e dica", () => {
    render(<UploadDeFoto aoMudar={() => {}} />);

    expect(
      screen.getByRole("button", { name: "Adicionar foto" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Adicionar foto")).toBeInTheDocument();
    expect(screen.getByText("PNG, JPG ou WEBP · máx. 10MB")).toBeInTheDocument();
    expect(
      screen.getByText("Opcional · Anúncios com foto recebem mais propostas"),
    ).toBeInTheDocument();
  });

  it("aceita arquivo válido e exibe pré-visualização com botão de remover", async () => {
    const aoMudar = vi.fn();
    const fakeUrl = "blob:http://localhost/fake-image";
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => fakeUrl) });

    render(<UploadDeFoto aoMudar={aoMudar} />);

    const file = new File(["dummy content"], "foto.png", { type: "image/png" });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await userEvent.upload(input, file);

    expect(aoMudar).toHaveBeenCalledWith(file, fakeUrl);
    const imagem = await screen.findByRole("img", {
      name: /Pré-visualização da foto do produto/i,
    });
    expect(imagem).toHaveAttribute("src", fakeUrl);

    const botaoRemover = screen.getByRole("button", { name: "Remover foto" });
    await userEvent.click(botaoRemover);

    expect(aoMudar).toHaveBeenCalledWith(null, null);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Adicionar foto" }),
    ).toBeInTheDocument();
  });

  it("recusa arquivo com formato inválido", async () => {
    const aoMudar = vi.fn();
    render(<UploadDeFoto aoMudar={aoMudar} />);

    const file = new File(["dummy"], "documento.pdf", {
      type: "application/pdf",
    });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(aoMudar).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "O arquivo deve estar em um dos formatos: PNG, JPG ou WEBP.",
    );
  });

  it("recusa arquivo que ultrapassa 10MB", async () => {
    const aoMudar = vi.fn();
    render(<UploadDeFoto aoMudar={aoMudar} />);

    const bigFile = new File(["a"], "grande.jpg", { type: "image/jpeg" });
    Object.defineProperty(bigFile, "size", {
      value: TAMANHO_MAXIMO_BYTES + 1024,
    });

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await userEvent.upload(input, bigFile);

    expect(aoMudar).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "O arquivo excede o limite de 10 MB.",
    );
  });

  it("funciona via drag and drop e é acessível por teclado", async () => {
    const aoMudar = vi.fn();
    const fakeUrl = "blob:http://localhost/drop-image";
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => fakeUrl) });

    render(<UploadDeFoto aoMudar={aoMudar} />);

    const areaDrop = screen.getByRole("button", { name: "Adicionar foto" });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    areaDrop.focus();
    await userEvent.keyboard("{Enter}");
    expect(clickSpy).toHaveBeenCalledTimes(1);

    const file = new File(["img"], "dropped.webp", { type: "image/webp" });
    fireEvent.dragOver(areaDrop);
    fireEvent.dragLeave(areaDrop);
    fireEvent.dragOver(areaDrop);
    fireEvent.drop(areaDrop, {
      dataTransfer: { files: [file] },
    });

    expect(aoMudar).toHaveBeenCalledWith(file, fakeUrl);
    expect(
      await screen.findByRole("img", {
        name: /Pré-visualização da foto do produto/i,
      }),
    ).toBeInTheDocument();
  });
});
