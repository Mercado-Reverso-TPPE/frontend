import { describe, expect, it } from "vitest";
import { destinoSeguro } from "@/utils/navegacao";

describe("destinoSeguro", () => {
  it("aceita caminhos internos com query", () => {
    expect(destinoSeguro("/meus-anuncios")).toBe("/meus-anuncios");
    expect(destinoSeguro("/anuncios/3?aba=ofertas")).toBe("/anuncios/3?aba=ofertas");
  });

  it("recusa destinos que levariam para fora da SPA", () => {
    expect(destinoSeguro("https://golpe.com")).toBe("/");
    expect(destinoSeguro("//golpe.com")).toBe("/");
    expect(destinoSeguro("/\\golpe.com")).toBe("/");
    expect(destinoSeguro("javascript:alert(1)")).toBe("/");
  });

  it("não devolve para as próprias telas de autenticação", () => {
    expect(destinoSeguro("/entrar")).toBe("/");
    expect(destinoSeguro("/cadastrar?retorno=/perfil")).toBe("/");
    expect(destinoSeguro(null)).toBe("/");
  });
});
