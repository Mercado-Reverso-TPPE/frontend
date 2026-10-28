import { describe, expect, it } from "vitest";
import { abrirSessao, cadastrarConta, iniciais, usuarioDoPerfil } from "@/api/autenticacao";
import { perfilDeTeste, simularApi } from "../apiFalsa";

describe("recurso de autenticação", () => {
  it("abre a sessão com o campo que o backend espera e devolve os tokens", async () => {
    const chamadas = simularApi({
      "POST /sessoes": () => ({ corpo: { access: "a1", refresh: "r1" } }),
    });

    await expect(abrirSessao({ email: " joana@exemplo.com ", senha: "segredo-longo" })).resolves.toEqual({
      acesso: "a1",
      renovacao: "r1",
    });
    expect(chamadas[0]).toMatchObject({
      metodo: "POST",
      caminho: "/sessoes",
      corpo: { email: "joana@exemplo.com", password: "segredo-longo" },
    });
  });

  it("cadastra sem mandar campos opcionais vazios", async () => {
    const chamadas = simularApi({ "POST /usuarios": () => ({ status: 201, corpo: { id: "1" } }) });

    await cadastrarConta({ nome: " Joana ", email: "j@x.com", senha: "segredo-longo", telefone: "", cidade: "", uf: "SP" });

    expect(chamadas[0]?.corpo).toEqual({ nome: "Joana", email: "j@x.com", senha: "segredo-longo" });
  });

  it("converte o perfil da API no usuário das telas", () => {
    expect(usuarioDoPerfil(perfilDeTeste)).toMatchObject({
      id: "7f1c",
      name: "Joana da Silva",
      initials: "JS",
      city: "Brasília",
      state: "DF",
      rating: 4.5,
      email: "joana@exemplo.com",
    });
    expect(usuarioDoPerfil({ ...perfilDeTeste, localizacao: null })).toMatchObject({ city: "", state: "" });
  });

  it("monta as iniciais com a primeira e a última palavra", () => {
    expect(iniciais("maria")).toBe("M");
    expect(iniciais("  ana   paula souza ")).toBe("AS");
    expect(iniciais("")).toBe("?");
  });
});
