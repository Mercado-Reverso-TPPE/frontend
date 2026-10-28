import { describe, expect, it, vi } from "vitest";
import {
  apiConfigurada,
  definirRenovadorDeSessao,
  definirTokenDeAcesso,
  ErroDeApi,
  errosDeValidacao,
  requisicao,
} from "@/api/cliente";
import { simularApi } from "../apiFalsa";

describe("cliente HTTP", () => {
  it("reconhece que o ambiente de teste não tem API configurada", () => {
    expect(apiConfigurada()).toBe(false);
  });

  it("falha com ErroDeApi explícito quando não há API para chamar", async () => {
    await expect(requisicao("/anuncios")).rejects.toMatchObject({
      name: "ErroDeApi",
      codigo: "sem-api",
    });
  });

  it("marca como recuperável só o que vale tentar de novo", () => {
    expect(new ErroDeApi("rede caiu", { codigo: "rede" }).recuperavel).toBe(true);
    expect(new ErroDeApi("instável", { codigo: "http", status: 503 }).recuperavel).toBe(true);
    expect(new ErroDeApi("não encontrado", { codigo: "http", status: 404 }).recuperavel).toBe(false);
  });
});

describe("cliente HTTP com API configurada", () => {
  it("separa os erros de validação do DRF por campo", async () => {
    simularApi({
      "POST /usuarios": () => ({
        status: 400,
        corpo: { email: ["Já existe uma conta com este e-mail."], localizacao: { cidade: ["Cidade não encontrada."] } },
      }),
    });

    const erro = await requisicao("/usuarios", { metodo: "POST", corpo: {} }).catch((falha: unknown) => falha);

    expect(errosDeValidacao(erro)).toEqual({
      campos: { email: "Já existe uma conta com este e-mail.", "localizacao.cidade": "Cidade não encontrada." },
    });
  });

  it("trata lista solta e non_field_errors como erro geral", () => {
    const lista = new ErroDeApi("x", { status: 400, detalhes: ["CEP não localizado."] });
    const naoDeCampo = new ErroDeApi("x", { status: 400, detalhes: { non_field_errors: ["Informe latitude e longitude em conjunto."] } });

    expect(errosDeValidacao(lista).geral).toBe("CEP não localizado.");
    expect(errosDeValidacao(naoDeCampo).geral).toBe("Informe latitude e longitude em conjunto.");
    expect(errosDeValidacao(new Error("outro"))).toEqual({ campos: {} });
  });

  it("renova o token num 401 e repete a chamada uma vez", async () => {
    const chamadas = simularApi({
      "GET /perfil": (_corpo, chamada) =>
        chamada.autorizacao === "Bearer novo" ? { corpo: { ok: true } } : { status: 401, corpo: { detail: "expirado" } },
    });
    definirTokenDeAcesso("velho");
    const renovador = vi.fn(async () => {
      definirTokenDeAcesso("novo");
      return true;
    });
    definirRenovadorDeSessao(renovador);

    await expect(requisicao("/perfil")).resolves.toEqual({ ok: true });
    expect(renovador).toHaveBeenCalledTimes(1);
    expect(chamadas.map((chamada) => chamada.autorizacao)).toEqual(["Bearer velho", "Bearer novo"]);
    definirRenovadorDeSessao(null);
  });

  it("devolve o 401 quando a renovação falha", async () => {
    simularApi({ "GET /perfil": () => ({ status: 401, corpo: { detail: "Token inválido." } }) });
    definirTokenDeAcesso("velho");
    definirRenovadorDeSessao(async () => false);

    await expect(requisicao("/perfil")).rejects.toMatchObject({ status: 401 });
    definirRenovadorDeSessao(null);
  });
});
