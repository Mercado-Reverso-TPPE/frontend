import { describe, expect, it } from "vitest";
import { apiConfigurada, ErroDeApi, requisicao } from "@/api/cliente";

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
