import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usuarioDoPerfil } from "@/api/autenticacao";
import { perfilDeTeste, simularApi } from "../apiFalsa";
import { renderizarAplicacao } from "../utilitarios";

const usuario = usuarioDoPerfil(perfilDeTeste);

function secao(nome: string) {
  return within(screen.getByRole("region", { name: nome }));
}

describe("perfil", () => {
  it("mostra os dados atuais vindos da sessão", () => {
    renderizarAplicacao({ rota: "/perfil", usuario });

    expect(screen.getByRole("heading", { name: "Meu perfil" })).toBeInTheDocument();
    expect(secao("Dados pessoais").getByLabelText(/^Nome/)).toHaveValue("Joana da Silva");
    expect(secao("Localização de referência").getByText("Brasília, DF · CEP 70000-000")).toBeInTheDocument();
    expect(secao("E-mail").getByText("joana@exemplo.com")).toBeInTheDocument();
  });

  it("salva os dados pessoais e atualiza o avatar do cabeçalho", async () => {
    const chamadas = simularApi({
      "PATCH /perfil": (corpo) => ({ corpo: { ...perfilDeTeste, ...(corpo as object) } }),
    });
    renderizarAplicacao({ rota: "/perfil", usuario });
    const dados = secao("Dados pessoais");

    await userEvent.clear(dados.getByLabelText(/^Nome/));
    await userEvent.type(dados.getByLabelText(/^Nome/), "Joana Prado");
    await userEvent.type(dados.getByLabelText(/Link da foto/), "https://exemplo.com/joana.png");
    await userEvent.click(dados.getByRole("button", { name: "Salvar dados pessoais" }));

    expect(await dados.findByText("Dados pessoais salvos.")).toBeInTheDocument();
    expect(chamadas[0]?.corpo).toEqual({
      nome: "Joana Prado",
      telefone: perfilDeTeste.telefone,
      foto: "https://exemplo.com/joana.png",
    });
    const cabecalho = within(screen.getByRole("banner"));
    expect(cabecalho.getByRole("button", { name: /Joana/ })).toBeInTheDocument();
    expect(cabecalho.getByRole("img", { name: "Foto de Joana Prado" })).toHaveAttribute(
      "src",
      "https://exemplo.com/joana.png",
    );
  });

  it("só habilita salvar quando algo mudou", () => {
    renderizarAplicacao({ rota: "/perfil", usuario });

    expect(secao("Dados pessoais").getByRole("button", { name: "Salvar dados pessoais" })).toBeDisabled();
  });

  it("atualiza a localização e reflete no menu da conta", async () => {
    simularApi({
      "PATCH /perfil": () => ({
        corpo: { ...perfilDeTeste, localizacao: { ...perfilDeTeste.localizacao, cep: "", cidade: "Goiânia", uf: "GO" } },
      }),
    });
    renderizarAplicacao({ rota: "/perfil", usuario });
    const local = secao("Localização de referência");

    await userEvent.clear(local.getByLabelText("CEP"));
    await userEvent.clear(local.getByLabelText("Cidade"));
    await userEvent.type(local.getByLabelText("Cidade"), "Goiânia");
    await userEvent.selectOptions(local.getByLabelText("Estado"), "GO");
    await userEvent.click(local.getByRole("button", { name: "Salvar localização" }));

    expect(await local.findByText("Localização atualizada.")).toBeInTheDocument();
    expect(local.getByText("Goiânia, GO")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Joana/ }));
    expect(screen.getByRole("menu")).toHaveTextContent("Goiânia, GO");
  });

  it("informa falha de localização e mantém a localização anterior visível", async () => {
    simularApi({
      "PATCH /perfil": () => ({ status: 400, corpo: ["Não foi possível localizar o CEP ou a cidade informada."] }),
    });
    renderizarAplicacao({ rota: "/perfil", usuario });
    const local = secao("Localização de referência");

    await userEvent.clear(local.getByLabelText("CEP"));
    await userEvent.type(local.getByLabelText("CEP"), "99999-999");
    await userEvent.click(local.getByRole("button", { name: "Salvar localização" }));

    expect(await local.findByRole("alert")).toHaveTextContent("Não foi possível localizar o CEP");
    expect(local.getByText("Brasília, DF · CEP 70000-000")).toBeInTheDocument();
    expect(local.getByLabelText("CEP")).toHaveValue("99999-999");
  });

  it("exige CEP ou cidade antes de enviar", async () => {
    const chamadas = simularApi({});
    renderizarAplicacao({ rota: "/perfil", usuario });
    const local = secao("Localização de referência");

    await userEvent.clear(local.getByLabelText("CEP"));
    await userEvent.clear(local.getByLabelText("Cidade"));
    await userEvent.click(local.getByRole("button", { name: "Salvar localização" }));

    expect(local.getByText("Informe o CEP ou a cidade.")).toBeInTheDocument();
    expect(chamadas).toHaveLength(0);
  });
});

describe("troca de e-mail", () => {
  it("pede a confirmação e avisa que o e-mail atual segue valendo", async () => {
    const chamadas = simularApi({
      "POST /perfil/email": () => ({ status: 202, corpo: { detail: "Enviamos um link de confirmação." } }),
    });
    renderizarAplicacao({ rota: "/perfil", usuario });
    const email = secao("E-mail");

    await userEvent.click(email.getByRole("button", { name: "Alterar e-mail" }));
    await userEvent.type(email.getByLabelText(/Novo e-mail/), "joana.nova@exemplo.com");
    await userEvent.click(email.getByRole("button", { name: "Enviar link de confirmação" }));

    expect(await email.findByText(/Enviamos um link para joana.nova@exemplo.com/)).toHaveTextContent(
      "continua sendo joana@exemplo.com",
    );
    expect(chamadas[0]?.corpo).toEqual({ novo_email: "joana.nova@exemplo.com" });
    expect(email.getByText("joana@exemplo.com")).toBeInTheDocument();
  });

  it("mostra a recusa da API", async () => {
    simularApi({
      "POST /perfil/email": () => ({ status: 400, corpo: ["Este e-mail já está sendo usado por outra conta."] }),
    });
    renderizarAplicacao({ rota: "/perfil", usuario });
    const email = secao("E-mail");

    await userEvent.click(email.getByRole("button", { name: "Alterar e-mail" }));
    await userEvent.type(email.getByLabelText(/Novo e-mail/), "outra@exemplo.com");
    await userEvent.click(email.getByRole("button", { name: "Enviar link de confirmação" }));

    expect(await email.findByRole("alert")).toHaveTextContent("Este e-mail já está sendo usado por outra conta.");
  });

  it("confirma pelo link e atualiza o e-mail da sessão", async () => {
    const chamadas = simularApi({
      "POST /perfil/email/confirmar": () => ({ status: 204 }),
      "GET /perfil": () => ({ corpo: { ...perfilDeTeste, email: "joana.nova@exemplo.com" } }),
    });
    const { roteador } = renderizarAplicacao({ rota: "/confirmar-email?token=tok-1", usuario });

    expect(await screen.findByText("E-mail alterado")).toBeInTheDocument();
    expect(chamadas[0]?.corpo).toEqual({ token: "tok-1" });

    await userEvent.click(await screen.findByRole("link", { name: "Voltar ao perfil" }));
    expect(roteador.state.location.pathname).toBe("/perfil");
    expect(await secao("E-mail").findByText("joana.nova@exemplo.com")).toBeInTheDocument();
  });

  it("avisa quando o link de confirmação expirou", async () => {
    simularApi({
      "POST /perfil/email/confirmar": () => ({ status: 400, corpo: ["O link de confirmação é inválido ou expirou."] }),
    });
    renderizarAplicacao({ rota: "/confirmar-email?token=velho" });

    expect(await screen.findByRole("alert")).toHaveTextContent("O link de confirmação é inválido ou expirou.");
  });
});
