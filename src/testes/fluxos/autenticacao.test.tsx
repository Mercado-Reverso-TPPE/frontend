import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CHAVE_RENOVACAO } from "@/hooks/useSessao";
import { perfilDeTeste, simularApi } from "../apiFalsa";
import { renderizarAplicacao } from "../utilitarios";

const SENHA = "senha-bem-longa";

/** Backend com uma conta: joana@exemplo.com / SENHA. */
function apiComConta() {
  return simularApi({
    "POST /sessoes": (corpo) => {
      const { email, password } = corpo as { email: string; password: string };
      return email === perfilDeTeste.email && password === SENHA
        ? { corpo: { access: "acesso-1", refresh: "renovacao-1" } }
        : { status: 401, corpo: { detail: "E-mail ou senha inválidos." } };
    },
    "GET /perfil": (_corpo, chamada) =>
      chamada.autorizacao ? { corpo: perfilDeTeste } : { status: 401, corpo: { detail: "Sem credenciais." } },
    "DELETE /sessoes": () => ({ status: 205 }),
    "POST /sessoes/renovar": (corpo) =>
      (corpo as { refresh: string }).refresh === "renovacao-1"
        ? { corpo: { access: "acesso-2", refresh: "renovacao-2" } }
        : { status: 401, corpo: { detail: "Token inválido." } },
  });
}

async function preencherLogin(email: string, senha: string) {
  await userEvent.type(screen.getByLabelText(/E-mail/), email);
  await userEvent.type(screen.getByLabelText(/^Senha/), senha);
  await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
}

describe("entrar", () => {
  it("leva ao destino pedido depois de entrar, sem guardar a senha", async () => {
    const chamadas = apiComConta();
    const { roteador } = renderizarAplicacao({ rota: "/meus-anuncios" });

    await screen.findByRole("heading", { name: "Bem-vindo de volta" });
    await preencherLogin(perfilDeTeste.email, SENHA);

    expect(await screen.findByRole("heading", { name: "Meus anúncios" })).toBeInTheDocument();
    expect(roteador.state.location.pathname).toBe("/meus-anuncios");
    expect(sessionStorage.getItem(CHAVE_RENOVACAO)).toBe("renovacao-1");
    expect(JSON.stringify({ ...sessionStorage })).not.toContain(SENHA);
    expect(JSON.stringify({ ...localStorage })).not.toContain(SENHA);
    expect(chamadas.some((chamada) => chamada.caminho.includes(SENHA))).toBe(false);
  });

  it("mostra erro genérico de credencial sem sair da tela e limpa a senha", async () => {
    apiComConta();
    const { roteador } = renderizarAplicacao({ rota: "/entrar" });

    await preencherLogin("ninguem@exemplo.com", "qualquer-senha");

    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha inválidos.");
    expect(roteador.state.location.pathname).toBe("/entrar");
    expect(screen.getByLabelText(/^Senha/)).toHaveValue("");
  });

  it("valida o formulário antes de chamar a API", async () => {
    const chamadas = apiComConta();
    renderizarAplicacao({ rota: "/entrar" });

    await userEvent.type(screen.getByLabelText(/E-mail/), "sem-arroba");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(screen.getByText(/Informe um e-mail válido/)).toBeInTheDocument();
    expect(screen.getByText("Informe a senha.")).toBeInTheDocument();
    expect(chamadas).toHaveLength(0);
  });

  it("ignora um retorno que apontaria para outro site", async () => {
    apiComConta();
    const { roteador } = renderizarAplicacao({ rota: "/entrar?retorno=%2F%2Fgolpe.com" });

    await preencherLogin(perfilDeTeste.email, SENHA);

    await waitFor(() => expect(roteador.state.location.pathname).toBe("/"));
  });
});

describe("sessão", () => {
  it("restaura a sessão de um recarregamento antes de abrir a rota privada", async () => {
    apiComConta();
    sessionStorage.setItem(CHAVE_RENOVACAO, "renovacao-1");
    renderizarAplicacao({ rota: "/meus-anuncios" });

    expect(screen.getByText("Verificando sua sessão…")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Meus anúncios" })).toBeInTheDocument();
    expect(sessionStorage.getItem(CHAVE_RENOVACAO)).toBe("renovacao-2");
  });

  it("manda para entrar quando o token guardado não vale mais", async () => {
    apiComConta();
    sessionStorage.setItem(CHAVE_RENOVACAO, "revogado");
    const { roteador } = renderizarAplicacao({ rota: "/perfil" });

    expect(await screen.findByRole("heading", { name: "Bem-vindo de volta" })).toBeInTheDocument();
    expect(roteador.state.location.search).toBe("?retorno=%2Fperfil");
    expect(sessionStorage.getItem(CHAVE_RENOVACAO)).toBeNull();
  });

  it("sai invalidando o token no servidor", async () => {
    const chamadas = apiComConta();
    renderizarAplicacao({ rota: "/entrar" });
    await preencherLogin(perfilDeTeste.email, SENHA);

    await userEvent.click(await screen.findByRole("button", { name: /Joana/ }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Sair" }));

    await waitFor(() => expect(sessionStorage.getItem(CHAVE_RENOVACAO)).toBeNull());
    expect(chamadas.find((chamada) => chamada.metodo === "DELETE")).toMatchObject({
      caminho: "/sessoes",
      corpo: { refresh: "renovacao-1" },
    });
    expect(await screen.findByRole("link", { name: "Entrar" })).toBeInTheDocument();
  });
});

describe("cadastro", () => {
  async function preencherCadastro(senha = SENHA) {
    await userEvent.type(screen.getByLabelText(/Nome completo/), "Joana da Silva");
    await userEvent.type(screen.getByLabelText(/E-mail/), perfilDeTeste.email);
    await userEvent.type(screen.getByLabelText(/^Senha/), senha);
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));
  }

  it("cria a conta, entra e volta ao destino", async () => {
    const chamadas = simularApi({
      "POST /usuarios": () => ({ status: 201, corpo: { id: "7f1c" } }),
      "POST /sessoes": () => ({ corpo: { access: "acesso-1", refresh: "renovacao-1" } }),
      "GET /perfil": () => ({ corpo: perfilDeTeste }),
    });
    const { roteador } = renderizarAplicacao({ rota: "/cadastrar?retorno=%2Fanunciar" });

    await preencherCadastro();

    await waitFor(() => expect(roteador.state.location.pathname).toBe("/anunciar"));
    expect(chamadas.map((chamada) => `${chamada.metodo} ${chamada.caminho}`)).toEqual([
      "POST /usuarios",
      "POST /sessoes",
      "GET /perfil",
    ]);
  });

  it("mostra no campo o erro devolvido pela API", async () => {
    simularApi({
      "POST /usuarios": () => ({ status: 400, corpo: { email: ["Usuário com este e-mail já existe."] } }),
    });
    const { roteador } = renderizarAplicacao({ rota: "/cadastrar" });

    await preencherCadastro();

    expect(await screen.findByText("Usuário com este e-mail já existe.")).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/^Senha/)).toHaveValue("");
    expect(roteador.state.location.pathname).toBe("/cadastrar");
  });

  it("exige a senha mínima do backend antes de enviar", async () => {
    const chamadas = simularApi({});
    renderizarAplicacao({ rota: "/cadastrar" });

    await preencherCadastro("curta");

    expect(screen.getByText("A senha precisa de pelo menos 10 caracteres.")).toBeInTheDocument();
    expect(chamadas).toHaveLength(0);
  });
});

describe("recuperação de senha", () => {
  it("confirma o envio sem dizer se a conta existe", async () => {
    const chamadas = simularApi({
      "POST /senha/redefinir": () => ({
        status: 202,
        corpo: { detail: "Se a conta existir, enviaremos um link de redefinição." },
      }),
    });
    renderizarAplicacao({ rota: "/entrar" });

    await userEvent.click(screen.getByRole("button", { name: "Esqueci minha senha" }));
    await userEvent.type(screen.getByLabelText(/E-mail/), "alguem@exemplo.com");
    await userEvent.click(screen.getByRole("button", { name: "Enviar link de recuperação" }));

    expect(await screen.findByText(/Se houver uma conta com esse endereço/)).toBeInTheDocument();
    expect(chamadas[0]?.corpo).toEqual({ email: "alguem@exemplo.com" });
  });

  it("grava a nova senha pelo link e volta para entrar", async () => {
    const chamadas = simularApi({ "POST /senha/redefinir/confirmar": () => ({ status: 204 }) });
    const { roteador } = renderizarAplicacao({ rota: "/redefinir-senha?uid=MQ&token=abc-123" });

    await userEvent.type(screen.getByLabelText(/^Nova senha/), SENHA);
    await userEvent.type(screen.getByLabelText(/Confirme/), SENHA);
    await userEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));

    expect(await screen.findByText("Senha alterada. Entre com a nova senha.")).toBeInTheDocument();
    expect(roteador.state.location.pathname).toBe("/entrar");
    expect(chamadas[0]?.corpo).toEqual({ uid: "MQ", token: "abc-123", nova_senha: SENHA });
  });

  it("avisa quando o link expirou", async () => {
    simularApi({
      "POST /senha/redefinir/confirmar": () => ({ status: 400, corpo: ["Link de redefinição inválido ou expirado."] }),
    });
    renderizarAplicacao({ rota: "/redefinir-senha?uid=MQ&token=velho" });

    await userEvent.type(screen.getByLabelText(/^Nova senha/), SENHA);
    await userEvent.type(screen.getByLabelText(/Confirme/), SENHA);
    await userEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Link de redefinição inválido ou expirado.");
  });

  it("explica quando o link chega incompleto", () => {
    renderizarAplicacao({ rota: "/redefinir-senha" });

    expect(screen.getByRole("heading", { name: "Link inválido" })).toBeInTheDocument();
  });
});
